use crate::crunch::utils::{is_power_of_2, next_pow2};

const MAX_EXPECTED_CODE_SIZE: usize = 16;
const MAX_SUPPORTED_SYMS: u32 = 8192;
const MAX_TABLE_BITS: u32 = 11;

#[derive(Debug, Clone)]
pub(crate) struct DecoderTables {
    pub(crate) num_syms: u32,
    pub(crate) total_used_syms: u32,
    pub(crate) table_bits: u32,
    pub(crate) table_shift: u32,
    pub(crate) table_max_code: u32,
    pub(crate) decode_start_code_size: u32,

    pub(crate) min_code_size: u8,
    pub(crate) max_code_size: u8,

    pub(crate) max_codes: [u32; MAX_EXPECTED_CODE_SIZE + 1],
    pub(crate) val_ptrs: [i32; MAX_EXPECTED_CODE_SIZE + 1],

    pub(crate) cur_lookup_size: u32,
    pub(crate) lookup: Vec<u32>,
    pub(crate) cur_sorted_symbol_order_size: u32,
    pub(crate) sorted_symbol_order: Vec<u16>
}

impl DecoderTables {
    pub(crate) fn new() -> DecoderTables {
        DecoderTables {
            num_syms: 0,
            total_used_syms: 0,
            table_bits: 0,
            table_shift: 0,
            table_max_code: 0,
            decode_start_code_size: 0,
            min_code_size: 0,
            max_code_size: 0,
            max_codes: [0u32; MAX_EXPECTED_CODE_SIZE + 1],
            val_ptrs: [0i32; MAX_EXPECTED_CODE_SIZE + 1],
            cur_lookup_size: 0,
            lookup: vec![],
            cur_sorted_symbol_order_size: 0,
            sorted_symbol_order: Vec::new(),
        }
    }

    pub(crate) fn init(&mut self, num_syms: u32, code_sizes: Vec<u8>, mut table_bits: u32) -> bool {
        let mut min_codes = [0; MAX_EXPECTED_CODE_SIZE];
        if num_syms == 0 || table_bits > MAX_TABLE_BITS {
            return false;
        }

        self.num_syms = num_syms;

        let mut num_codes = [0u32; MAX_EXPECTED_CODE_SIZE + 1];

        for i in 0..num_syms {
            let c = code_sizes[i as usize];
            if c != 0 {
                num_codes[c as usize] += 1;
            }
        }

        let mut sorted_positions = [0u32; MAX_EXPECTED_CODE_SIZE + 1];

        let mut cur_code = 0u32;

        let mut total_used_syms = 0u32;
        let mut max_code_size = 0u32;
        let mut min_code_size = u32::MAX;

        for i in 1..=MAX_EXPECTED_CODE_SIZE {
            let n = num_codes[i];
            if n == 0 {
                self.max_codes[i - 1] = 0;
            } else {
                min_code_size = min_code_size.min(i as u32);
                max_code_size = max_code_size.max(i as u32);

                min_codes[i - 1] = cur_code;

                self.max_codes[i - 1] = cur_code + n - 1;
                self.max_codes[i - 1] = 1u32 + ((self.max_codes[i - 1] << (16u32 - (i as u32))) | ((1u32 << (16u32 - (i as u32))) - 1));

                self.val_ptrs[i - 1] = total_used_syms as i32;
                sorted_positions[i] = total_used_syms;

                cur_code += n;
                total_used_syms += n;
            }

            cur_code <<= 1;
        }

        self.total_used_syms = total_used_syms;

        if total_used_syms > self.cur_sorted_symbol_order_size {
            self.cur_sorted_symbol_order_size = total_used_syms;

            if !is_power_of_2(total_used_syms) {
                self.cur_sorted_symbol_order_size = num_syms.min(next_pow2(total_used_syms));
            }

            self.sorted_symbol_order = vec![0u16; self.cur_sorted_symbol_order_size as usize];
        }

        self.min_code_size = min_code_size as u8;
        self.max_code_size = max_code_size as u8;

        for i in 0..num_syms {
            let c = code_sizes[i as usize];
            if c != 0 {
                assert_ne!(num_codes[c as usize], 0);
                let sorted_pos = sorted_positions[c as usize];
                sorted_positions[c as usize] += 1;
                assert!(sorted_pos < total_used_syms);

                self.sorted_symbol_order[sorted_pos as usize] = i as u16;
            }
        }

        if table_bits < self.min_code_size as u32 {
            table_bits = 0;
        }
        self.table_bits = table_bits;

        if table_bits != 0 {
            let table_size = 1u32 << table_bits;
            if table_size > self.cur_lookup_size {
                self.cur_lookup_size = table_size;

                self.lookup = vec![0u32; table_size as usize];
            }

            self.lookup.fill(u32::MAX);

            for codesize in 1..=table_bits {
                if num_codes[codesize as usize] == 0 {
                    continue;
                }

                let fillsize = table_bits - codesize;
                let fillnum = 1u32 << fillsize;

                let min_code = min_codes[codesize as usize - 1];
                let max_code = self.get_unshifted_max_code(codesize as usize);
                let val_ptr = self.val_ptrs[codesize as usize - 1];

                for code in min_code..=max_code {
                    let sym_index = self.sorted_symbol_order[(val_ptr + (code as i32) - (min_code as i32)) as usize];
                    assert_eq!(code_sizes[sym_index as usize], codesize as u8);

                    for j in 0..fillnum {
                        let t = j + (code << fillsize);

                        assert!(t < (1u32 << table_bits));
                        assert_eq!(self.lookup[t as usize], u32::MAX);

                        self.lookup[t as usize] = sym_index as u32 | (codesize << 16);
                    }
                }
            }
        }

        for i in 0..MAX_EXPECTED_CODE_SIZE {
            self.val_ptrs[i] -= min_codes[i] as i32;
        }
        self.table_max_code = 0;
        self.decode_start_code_size = self.min_code_size as u32;

        if table_bits != 0 {
            let mut idx = table_bits;
            for i in (1..=table_bits).rev() {
                idx = i;
                if num_codes[i as usize] != 0 {
                    self.table_max_code = self.max_codes[i as usize - 1];
                    break;
                }
            }
            if idx >= 1 {
                self.decode_start_code_size = table_bits + 1;
                for j in (table_bits + 1)..max_code_size {
                    if num_codes[j as usize] != 0 {
                        self.decode_start_code_size = j;
                        break;
                    }
                }
            }
        }

        self.max_codes[MAX_EXPECTED_CODE_SIZE] = u32::MAX;
        self.val_ptrs[MAX_EXPECTED_CODE_SIZE] = 0xFFFFF;

        self.table_shift = 32u32 - self.table_bits;

        true
    }

    fn get_unshifted_max_code(&self, len: usize) -> u32 {
        assert!(len >= 1 && len <= MAX_EXPECTED_CODE_SIZE);
        let k = self.max_codes[len - 1];
        if k == 0 {
            u32::MAX
        } else {
            (k - 1) >> (16u32 - len as u32)
        }
    }

    fn clear(&mut self) {
        self.lookup = Vec::new();
        self.cur_lookup_size = 0;
        self.sorted_symbol_order = Vec::new();
        self.cur_sorted_symbol_order_size = 0;
    }
}