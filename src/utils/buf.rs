use std::fmt::Write;
use bytes::{Buf, BufMut, Bytes, BytesMut};

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

pub trait BufMutExt {
    fn put_string(&mut self, val: String);
    fn put_string_ordered(&mut self, val: String, little_endian: bool);
    fn put_string_varint(&mut self, val: String);
    fn put_cstring(&mut self, val: String);
    fn put_chars(&mut self, val: String);
    fn put_varint(&mut self, val: i64);
    fn align(&mut self, start_length: usize, i: u8);
    fn put_i16_ordered(&mut self, val: i16, little_endian: bool);
    fn put_u16_ordered(&mut self, val: u16, little_endian: bool);
    fn put_i32_ordered(&mut self, val: i32, little_endian: bool);
    fn put_u32_ordered(&mut self, val: u32, little_endian: bool);
    fn put_f32_ordered(&mut self, val: f32, little_endian: bool);
    fn put_i64_ordered(&mut self, val: i64, little_endian: bool);
    fn put_u64_ordered(&mut self, val: u64, little_endian: bool);
    fn put_f64_ordered(&mut self, val: f64, little_endian: bool);
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

impl BufMutExt for BytesMut {
    fn put_string(&mut self, val: String) {
        self.put_u32_le(val.len() as u32);
        self.put_chars(val);
    }

    fn put_string_ordered(&mut self, val: String, little_endian: bool) {
        self.put_u32_ordered(val.len() as u32, little_endian);
        self.put_chars(val);
    }

    fn put_string_varint(&mut self, val: String) {
        self.put_varint(val.len() as i64);
        self.put_chars(val);
    }

    fn put_cstring(&mut self, val: String) {
        self.put_chars(val);
        self.put_u8(0);
    }

    fn put_chars(&mut self, val: String) {
        self.write_str(&val).expect(&format!("invalid string {val}"));
    }

    fn put_varint(&mut self, val: i64) {
        todo!()
    }

    fn align(&mut self, start_length: usize, i: u8) {
        todo!()
    }

    fn put_i16_ordered(&mut self, val: i16, little_endian: bool) {
        todo!()
    }

    fn put_u16_ordered(&mut self, val: u16, little_endian: bool) {
        todo!()
    }

    fn put_i32_ordered(&mut self, val: i32, little_endian: bool) {
        todo!()
    }

    fn put_u32_ordered(&mut self, val: u32, little_endian: bool) {
        todo!()
    }

    fn put_f32_ordered(&mut self, val: f32, little_endian: bool) {
        todo!()
    }

    fn put_i64_ordered(&mut self, val: i64, little_endian: bool) {
        todo!()
    }

    fn put_u64_ordered(&mut self, val: u64, little_endian: bool) {
        todo!()
    }

    fn put_f64_ordered(&mut self, val: f64, little_endian: bool) {
        todo!()
    }
}

pub trait FromBytes {
    fn from_bytes(data: &mut Bytes) -> Self;
}
