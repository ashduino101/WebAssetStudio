use std::io::{BufReader, Cursor};
use std::panic;
use lz4_flex::{compress, decompress};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn lz4_compress(data: &mut [u8]) -> Box<[u8]> {
    compress(data).into()
}

#[wasm_bindgen]
pub fn lz4_decompress(data: &mut [u8], out_size: usize) -> Box<[u8]> {
    decompress(data, out_size).expect("lz4_decompress").into()
}
