use bytes::{Buf, Bytes};
use wasm_bindgen::prelude::*;
use crate::utils::{BufExt, FromBytes};

const XNB_MAGIC: &str = "XNB";


#[derive(Debug, Clone)]
pub struct TypeReader {
    pub typename: String,
    pub version: i32
}

impl FromBytes for TypeReader {
    fn from_bytes(data: &mut Bytes) -> Self {
        TypeReader {
            typename: data.get_string_varint(),
            version: data.get_i32_le()
        }
    }
}

#[derive(Debug)]
pub struct XNBFile {
    pub version: u8,
    pub platform: String,
    pub is_hi_def: bool,
    pub is_compressed: bool,
    pub size: u32,
    pub uncompressed_size: u32,
    pub type_readers: Vec<TypeReader>
}

impl XNBFile {
    pub fn platform(&self) -> String {
        self.platform.to_string()
    }

    pub fn type_readers(&self) -> Box<[TypeReader]> {
        self.type_readers.clone().into()
    }

    pub fn new(data: &mut Bytes) -> Self {
        let mut magic = data.slice(0..3);
        data.advance(3);
        if magic.get_chars(3) != XNB_MAGIC {
            panic!("not an XNB file");
        };
        let platform = match data.get_u8() {
            119 => "Microsoft Windows",
            109 => "Windows Phone 7",
            120 => "Xbox 360",
            _ => "Unknown"
        }.to_string();
        let format_version = data.get_u8();
        let flags = data.get_u8();
        let size = data.get_u32_le();
        let is_hi_def = (flags & 0x01) == 0x01;
        let is_compressed = (flags & 0x80) == 0x80;
        let mut uncompressed_size = size;
        if is_compressed {
            uncompressed_size = data.get_u32_le();
        }
        let num_type_readers = data.get_varint();
        let mut type_readers = Vec::new();
        for _ in 0..num_type_readers {
            type_readers.push(TypeReader::from_bytes(data))
        }
        let num_shared_resources = data.get_varint();
        XNBFile {
            version: format_version,
            platform,
            is_hi_def,
            is_compressed,
            size,
            uncompressed_size,
            type_readers
        }
    }
}