use bytes::{Buf, Bytes};

pub trait BufExt {
    fn get_raw(&mut self, nbytes: usize) -> Bytes;
    fn get_string(&mut self) -> String;
    fn get_string_ordered(&mut self, little_endian: bool) -> String;
    fn get_string_varint(&mut self) -> String;
    fn get_cstring(&mut self) -> String;
    fn get_chars(&mut self, cnt: usize) -> String;
    fn get_varint(&mut self) -> i64;
    fn align(&mut self, start_length: usize, i: u8);
    fn get_i16_ordered(&mut self, little_endian: bool) -> i16;
    fn get_u16_ordered(&mut self, little_endian: bool) -> u16;
    fn get_i32_ordered(&mut self, little_endian: bool) -> i32;
    fn get_u32_ordered(&mut self, little_endian: bool) -> u32;
    fn get_f32_ordered(&mut self, little_endian: bool) -> f32;
    fn get_i64_ordered(&mut self, little_endian: bool) -> i64;
    fn get_u64_ordered(&mut self, little_endian: bool) -> u64;
    fn get_f64_ordered(&mut self, little_endian: bool) -> f64;
}

impl BufExt for Bytes {
    fn get_raw(&mut self, nbytes: usize) -> Bytes {
        let sub = self.slice(0..nbytes);
        self.advance(nbytes);
        sub
    }

    fn get_string(&mut self) -> String {
        let len = self.get_u32_le() as usize;
        self.get_chars(len)
    }

    fn get_string_ordered(&mut self, little_endian: bool) -> String {
        let len = self.get_u32_ordered(little_endian) as usize;
        self.get_chars(len)
    }

    fn get_string_varint(&mut self) -> String {
        let len = self.get_varint() as usize;
        self.get_chars(len)
    }

    fn get_cstring(&mut self) -> String {
        let mut c = 1;
        let mut data = "".to_string();
        loop {
            c = self.get_u8();
            if c == 0 {
                break;
            }
            data.push(char::from(c));
        }
        data.to_string()
    }

    fn get_chars(&mut self, cnt: usize) -> String {
        let mut data = self.slice(0..cnt);
        self.advance(cnt);
        String::from_utf8(data.to_vec()).expect("invalid string")
    }

    fn get_varint(&mut self) -> i64 {
        let mut result: i64 = 0;  // limit to 64 bit
        let mut bits_read: usize = 0;
        let mut value;
        loop {
            value = self.get_u8();
            result |= ((value & 0x7f) << bits_read) as i64;
            bits_read += 7;
            if (value & 0x80) != 0x80 {
                break;
            }
        }
        result
    }

    fn align(&mut self, start_length: usize, i: u8) {
        let offset = start_length - self.len();
        let modulo = offset % (i as usize);
        if modulo != 0 {
            self.advance((i as usize) - modulo);
        }
    }

    fn get_i16_ordered(&mut self, little_endian: bool) -> i16 {
        if little_endian { self.get_i16_le() } else { self.get_i16() }
    }

    fn get_u16_ordered(&mut self, little_endian: bool) -> u16 {
        if little_endian { self.get_u16_le() } else { self.get_u16() }
    }

    fn get_i32_ordered(&mut self, little_endian: bool) -> i32 {
        if little_endian { self.get_i32_le() } else { self.get_i32() }
    }

    fn get_u32_ordered(&mut self, little_endian: bool) -> u32 {
        if little_endian { self.get_u32_le() } else { self.get_u32() }
    }

    fn get_f32_ordered(&mut self, little_endian: bool) -> f32 {
        if little_endian { self.get_f32_le() } else { self.get_f32() }
    }

    fn get_i64_ordered(&mut self, little_endian: bool) -> i64 {
        if little_endian { self.get_i64_le() } else { self.get_i64() }
    }

    fn get_u64_ordered(&mut self, little_endian: bool) -> u64 {
        if little_endian { self.get_u64_le() } else { self.get_u64() }
    }

    fn get_f64_ordered(&mut self, little_endian: bool) -> f64 {
        if little_endian { self.get_f64_le() } else { self.get_f64() }
    }
}

pub trait FromBytes {
    fn from_bytes(data: &mut Bytes) -> Self;
}
