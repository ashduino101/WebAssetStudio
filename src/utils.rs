use bytes::{Buf, Bytes};
use lz4_flex::{compress, decompress};
use lz4_flex::block::DecompressError;
use std::char;

pub trait BufExt {
    fn get_string(&mut self) -> String;
    fn get_cstring(&mut self) -> String;
    fn align(&mut self, start_length: usize, i: u8);
}

impl BufExt for Bytes {
    fn get_string(&mut self) -> String {
        let len = self.get_u32_le() as usize;
        let data = self.slice(0..len);
        self.advance(len);
        String::from_utf8(data.to_vec()).expect("failed to decode string")
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
