use std::io::Error;
use std::io::{Cursor, ErrorKind, Read};
use std::str;
use std::string::FromUtf8Error;
use byteorder::ReadBytesExt;

pub trait ReadExt: Read {
    fn read_chars(&mut self, count: usize) -> Result<String, Error> {
        let mut buf = vec![0; count];
        self.read_exact(buf.as_mut())?;
        match String::from_utf8(buf) {
            Ok(v) => Ok(v),
            Err(e) => Err(Error::new(ErrorKind::Other, e.to_string()))
        }
    }

    fn read_varint(&mut self) -> Result<i64, Error> {
        let mut result: i64 = 0;  // limit to 64 bit -- hopefully isn't an issue
        let mut bits_read: usize = 0;
        let mut value;
        loop {
            value = match self.read_u8() {
                Ok(v) => v,
                Err(_) => return Err(Error::new(ErrorKind::Other, "error while reading varint from stream"))
            };
            result |= ((value & 0x7f) << bits_read) as i64;
            bits_read += 7;
            if (value & 0x80) != 0x80 {
                break;
            }
        }
        Ok(result)
    }

    fn read_string(&mut self) -> Result<String, Error> {
        let len = self.read_varint()?;
        self.read_chars(len as usize)
    }
}

impl<R: Read + ?Sized> ReadExt for R {}
