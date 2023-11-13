use std::io::{BufReader, Cursor};
use std::panic;
use lz4_flex::{compress, decompress};
use lz4_flex::block::DecompressError;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn lz4_compress(data: &mut [u8]) -> Box<[u8]> {
    compress(data).into()
}

#[wasm_bindgen]
pub fn lz4_decompress(data: &mut [u8], out_size: usize) -> Result<Box<[u8]>, JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    match decompress(data, out_size) {
        Ok(v) => Ok(v.into()),
        Err(e) => Err(JsValue::from(e.to_string()))
    }
}
