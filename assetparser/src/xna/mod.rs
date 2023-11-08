use std::collections::HashMap;
use std::convert::TryInto;
use std::io::{Cursor, Error, ErrorKind, Read};
use std::iter::Map;
use byteorder::{LittleEndian, ReadBytesExt};
use wasm_bindgen::convert::{IntoWasmAbi, WasmAbi};
use wasm_bindgen::describe::WasmDescribe;
use wasm_bindgen::prelude::*;
use js_sys::Array;
use crate::alert;
use crate::binary::ReadExt;

// welcome to several hours of dysphoria-induced dissociation through writing rust

const XNB_MAGIC: &str = "XNB";


#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct TypeReader {
    #[wasm_bindgen(skip)]
    pub typename: String,
    pub version: i32
}

#[wasm_bindgen]
impl TypeReader {
    pub fn new(typename: String, version: i32) -> Self {
        Self { typename, version }
    }

    #[wasm_bindgen(getter)]
    pub fn typename(&self) -> String {
        self.typename.to_string()
    }
}

#[wasm_bindgen]
pub struct XNB {
    pub version: u8,
    #[wasm_bindgen(skip)]
    pub platform: String,
    pub is_hi_def: bool,
    pub is_compressed: bool,
    pub size: u32,
    pub uncompressed_size: u32,
    #[wasm_bindgen(skip)]
    pub type_readers: Vec<TypeReader>
}

#[wasm_bindgen]
impl XNB {
    #[wasm_bindgen(getter)]
    pub fn platform(&self) -> String {
        self.platform.to_string()
    }

    #[wasm_bindgen(getter)]
    pub fn type_readers(&self) -> Box<[TypeReader]> {
        self.type_readers.clone().into()
    }
}


pub fn parse_xnb(data: Box<[u8]>) -> Result<XNB, Error> {
    let mut reader = Cursor::new(data);
    match reader.read_chars(3) {
        Ok(m) => {
            if m != XNB_MAGIC {
                return Err(Error::new(ErrorKind::Other, "Not an XNB file"));
            }
        },
        Err(_) => return Err(Error::new(ErrorKind::Other, "Unable to decode magic, invalid file"))
    }
    let platform = match reader.read_u8()? {
        119 => "Microsoft Windows",
        109 => "Windows Phone 7",
        120 => "Xbox 360",
        _ => "Unknown"
    }.to_string();
    let format_version = reader.read_u8()?;
    let flags = reader.read_u8()?;
    let size = reader.read_u32::<LittleEndian>()?;
    let is_hi_def = (flags & 0x01) == 0x01;
    let is_compressed = (flags & 0x80) == 0x80;
    let mut uncompressed_size = size;
    if is_compressed {
        uncompressed_size = reader.read_u32::<LittleEndian>()?;
    }
    let num_type_readers = reader.read_varint()?;
    let mut type_readers = Vec::new();
    for _ in 0..num_type_readers {
        let typename = reader.read_string()?;
        let version = reader.read_i32::<LittleEndian>()?;
        type_readers.push(TypeReader::new(typename, version))
    }
    Ok(XNB {
        version: format_version,
        platform,
        is_hi_def,
        is_compressed,
        size,
        uncompressed_size,
        type_readers
    })
}
