use bytes::{Buf, Bytes};
use lz4_flex::{compress, decompress};
use lz4_flex::block::DecompressError;
use std::char;
use std::error::Error;
use std::io::ErrorKind;
use std::string::FromUtf8Error;

pub trait BufExt {
    fn get_string(&mut self) -> String;
    fn get_string_varint(&mut self) -> String;
    fn get_cstring(&mut self) -> String;
    fn get_chars(&mut self, cnt: usize) -> String;
    fn get_varint(&mut self) -> i64;
    fn align(&mut self, start_length: usize, i: u8);
}

impl BufExt for Bytes {
    fn get_string(&mut self) -> String {
        let len = self.get_u32_le() as usize;
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
}


pub fn lz4_decompress(data: &[u8], out_size: usize) -> Result<Bytes, String> {
    match decompress(data, out_size) {
        Ok(v) => Ok(Bytes::from(v)),
        Err(e) => Err(e.to_string())
    }
}


pub trait FromBytes {
    fn from_bytes(data: &mut Bytes) -> Self;
}
