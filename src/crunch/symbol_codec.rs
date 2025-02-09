use std::fmt::{Debug, Formatter};
use bytes::Bytes;
use crate::crunch::prefix_coding::DecoderTables;
use crate::crunch::utils::{ceil_log2i, total_bits};

const MAX_CODELENGTH_CODES: u32 = 21;

const SMALL_ZERO_RUN_CODE: u32 = 17;
const LARGE_ZERO_RUN_CODE: u32 = 18;
const SMALL_REPEAT_CODE: u32 = 19;
const LARGE_REPEAT_CODE: u32 = 20;

const MIN_SMALL_ZERO_RUN_SIZE: u32 = 3;
const MAX_SMALL_ZERO_RUN_SIZE: u32 = 10;
const MIN_LARGE_ZERO_RUN_SIZE: u32 = 11;
const MAX_LARGE_ZERO_RUN_SIZE: u32 = 138;

const SMALL_MIN_NON_ZERO_RUN_SIZE: u32 = 3;
const SMALL_MAX_NON_ZERO_RUN_SIZE: u32 = 6;
const LARGE_MIN_NON_ZERO_RUN_SIZE: u32 = 7;
const LARGE_MAX_NON_ZERO_RUN_SIZE: u32 = 70;

const SMALL_ZERO_RUN_EXTRA_BITS: u32 = 3;
const LARGE_ZERO_RUN_EXTRA_BITS: u32 = 7;
const SMALL_NON_ZERO_RUN_EXTRA_BITS: u32 = 2;
const LARGE_NON_ZERO_RUN_EXTRA_BITS: u32 = 6;

const MOST_PROBABLE_CODELENGTH_CODES: [u8; 21] = [
    SMALL_ZERO_RUN_CODE as u8, LARGE_ZERO_RUN_CODE as u8,
    SMALL_REPEAT_CODE as u8, LARGE_REPEAT_CODE as u8,

    0, 8,
    7, 9,
    6, 10,
    5, 11,
    4, 12,
    3, 13,
    2, 14,
    1, 15,
    16
];

#[derive(Debug, Clone)]
pub(crate) struct StaticHuffmanDataModel {
    total_syms: u32,
    code_sizes: Vec<u8>,
    decode_tables: DecoderTables
}

impl StaticHuffmanDataModel {
    pub(crate) fn clear(&mut self) {
        self.total_syms = 0;
        self.code_sizes.clear();
        self.decode_tables = DecoderTables::new();
    }

    pub(crate) fn new() -> StaticHuffmanDataModel {
        StaticHuffmanDataModel {
            total_syms: 0,
            code_sizes: vec![],
            decode_tables: DecoderTables::new(),
        }
    }

    pub(crate) fn init(&mut self, total_syms: u32, code_sizes: Vec<u8>, code_size_limit: u32) -> bool {
        assert!(total_syms >= 1 && total_syms <= 8192 && code_size_limit >= 1);

        let code_size_limit = code_size_limit.min(16);

        self.code_sizes.resize(total_syms as usize, 0);

        let mut min_code_size = u32::MAX;
        let mut max_code_size = 0u32;

        for i in 0..total_syms {
            let s = code_sizes[i as usize];
            self.code_sizes[i as usize] = s;
            min_code_size = min_code_size.min(s as u32);
            max_code_size = max_code_size.max(s as u32);
        }

        if max_code_size < 1 || max_code_size > 32 || min_code_size > code_size_limit {
            return false;
        }

        if max_code_size > code_size_limit {
            return false;
        }

        self.decode_tables = DecoderTables::new();

        if !self.decode_tables.init(self.total_syms, code_sizes, self.compute_decoder_table_bits()) {
            return false;
        }

        true
    }

    fn prepare_decoder_tables(&mut self) -> bool {
        let total_syms: u32 = self.code_sizes.len() as u32;

        assert!((total_syms >= 1) && (total_syms <= 8192));

        self.total_syms = total_syms;

        self.decode_tables.init(self.total_syms, self.code_sizes.clone(), self.compute_decoder_table_bits())
    }

    fn compute_decoder_table_bits(&self) -> u32 {
        let mut decoder_table_bits: u32 = 0;
        if self.total_syms > 16 {
            decoder_table_bits = (1 + ceil_log2i(self.total_syms)).min(11);
        }
        decoder_table_bits
    }
}

#[derive(Clone)]
pub(crate) struct SymbolCodec {
    decode_buf: Bytes,
    bit_length: usize,
    position: usize,
    bit_buf: u32,
    bit_count: u32,
}

// avoid formatting data
impl Debug for SymbolCodec {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SymbolCodec")
            .field("bit_length", &self.bit_length)
            .field("position", &self.position)
            .field("bit_buf", &self.bit_buf)
            .field("bit_count", &self.bit_count)
            .finish()
    }
}

impl SymbolCodec {
    pub(crate) fn new() -> SymbolCodec {
        SymbolCodec {
            decode_buf: Bytes::new(),
            bit_length: 0,
            position: 0,
            bit_buf: 0,
            bit_count: 0,
        }
    }

    pub(crate) fn decode_receive_static_data_model(&mut self, model: &mut StaticHuffmanDataModel) -> bool {
        let total_used_syms = self.decode_bits(total_bits(8192));

        if total_used_syms == 0 {
            model.clear();
            return true;
        }

        model.code_sizes.resize(total_used_syms as usize, 0);
        model.code_sizes.fill(0);

        let num_codelength_codes_to_send = self.decode_bits(5);
        if (num_codelength_codes_to_send < 1) || (num_codelength_codes_to_send > MAX_CODELENGTH_CODES) {
            return false;
        }

        let mut dm = StaticHuffmanDataModel::new();
        dm.code_sizes.resize(MAX_CODELENGTH_CODES as usize, 0);

        for i in 0..num_codelength_codes_to_send {
            dm.code_sizes[MOST_PROBABLE_CODELENGTH_CODES[i as usize] as usize] = self.decode_bits(3) as u8;
        }

        if !dm.prepare_decoder_tables() {
            return false;
        }

        let mut ofs = 0;
        while ofs < total_used_syms {
            let num_remaining = total_used_syms - ofs;

            let code = self.decode(&dm);
            if code <= 16 {
                model.code_sizes[ofs as usize] = code as u8;
                ofs += 1;
            } else if code == SMALL_ZERO_RUN_CODE {
                println!("SMALL_ZERO_RUN_CODE");
                let len = self.decode_bits(SMALL_ZERO_RUN_EXTRA_BITS) + MIN_SMALL_ZERO_RUN_SIZE;
                if len > num_remaining {
                    return false;
                }
                ofs += len;
            } else if (code == LARGE_ZERO_RUN_CODE) {
                println!("LARGE_ZERO_RUN_CODE");
                let len = self.decode_bits(LARGE_ZERO_RUN_EXTRA_BITS) + MIN_LARGE_ZERO_RUN_SIZE;
                if len > num_remaining {
                    return false;
                }
                ofs += len;
            } else if (code == SMALL_REPEAT_CODE) || (code == LARGE_REPEAT_CODE) {
                let mut len;
                if code == SMALL_REPEAT_CODE {
                    println!("SMALL_REPEAT_CODE");
                    len = self.decode_bits(SMALL_NON_ZERO_RUN_EXTRA_BITS) + SMALL_MIN_NON_ZERO_RUN_SIZE;
                } else {
                    println!("LARGE_REPEAT_CODE");
                    len = self.decode_bits(LARGE_NON_ZERO_RUN_EXTRA_BITS) + LARGE_MIN_NON_ZERO_RUN_SIZE;
                }

                println!("hi {len} {num_remaining} {ofs}");
                if (ofs == 0) || (len > num_remaining) {
                    return false;
                }
                let prev = model.code_sizes[ofs as usize - 1];
                if prev == 0 {
                    return false;
                }
                let end = ofs + len;
                while ofs < end {
                    model.code_sizes[ofs as usize] = prev;
                    ofs += 1;
                }
            } else {
                panic!("unknown code");
            }
        }

        if ofs != total_used_syms {
            return false;
        }

        model.prepare_decoder_tables()
    }

    pub(crate) fn start_decoding(&mut self, buf: Bytes, bit_length: usize) {
        self.decode_buf = buf;
        self.bit_length = bit_length;
    }

    pub(crate) fn get_bits_init(&mut self) {
        self.bit_buf = 0;
        self.bit_count = 0;
    }

    pub(crate) fn decode_bits(&mut self, num_bits: u32) -> u32 {
        let v = if num_bits == 0 {
            0
        } else if num_bits > 16 {
            let a = self.get_bits(num_bits - 16);
            let b = self.get_bits(16);
            (a << 16) | b
        } else {
            self.get_bits(num_bits)
        };
        println!("{v}");
        v
    }

    fn get_bits(&mut self, num_bits: u32) -> u32 {
        assert!(num_bits <= 32);
        while self.bit_count < num_bits {
            let mut c = 0u32;
            if self.position < self.decode_buf.len() {
                c = self.decode_buf[self.position] as u32;
            }
            self.bit_count += 8;
            self.position += 1;
            assert!((self.bit_count as usize) <= self.bit_length);
            self.bit_buf |= c << (32u32 - self.bit_count);
        }

        let result = self.bit_buf >> (32u32 - num_bits);
        self.bit_buf <<= num_bits;
        self.bit_count -= num_bits;
        result
    }

    pub(crate) fn decode(&mut self, model: &StaticHuffmanDataModel) -> u32 {
        let tables = &model.decode_tables;

        if self.bit_count < 24 {
            if self.bit_count < 16 {
                let mut c0 = 0;
                let mut c1 = 0;
                if self.position < self.decode_buf.len() {
                    c0 = self.decode_buf[self.position] as u32;
                    self.position += 1;
                }
                if self.position < self.decode_buf.len() {
                    c1 = self.decode_buf[self.position] as u32;
                    self.position += 1;
                }
                self.bit_count += 16;
                let c = (c0 << 8) | c1;
                self.bit_buf |= c << (32u32 - self.bit_count);
            }  else {
                let c = if self.position < self.decode_buf.len() { self.decode_buf[self.position] } else { 0 } as u32;
                self.bit_count += 8;
                self.bit_buf |= c << (32u32 - self.bit_count);
            }
        }

        let k = (self.bit_buf >> 16) + 1;
        let mut sym = 0;
        let mut len = 0;

        if k <= tables.table_max_code {
            let t = tables.lookup[(self.bit_buf >> (32u32 - tables.table_bits)) as usize];

            assert_ne!(t, u32::MAX);
            sym = t & (u16::MAX as u32);
            len = t >> 16;

            assert_eq!(model.code_sizes[sym as usize], len as u8);
        } else {
            len = tables.decode_start_code_size;

            loop {
                if k <= tables.max_codes[len as usize - 1] {
                    break;
                }
                len += 1;
            }

            let val_ptr = (tables.val_ptrs[len as usize - 1] + (self.bit_buf >> (32u32 - len)) as i32) as u32;

            assert!(val_ptr < model.total_syms);

            sym = tables.sorted_symbol_order[val_ptr as usize] as u32;
        }

        self.bit_buf <<= len;
        self.bit_count -= len;

        sym
    }

    pub(crate) fn stop_decoding(&self) -> u64 {
        self.position as u64
    }
}