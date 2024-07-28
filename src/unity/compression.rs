use bytes::{Bytes};
use wasm_bindgen_test::console_log;

use crate::utils::compress::lz4_decompress;

pub fn decompress(data: &mut Bytes, compression_type: u8, compressed_size: usize, uncompressed_size: usize) -> Bytes {
    let comp_block = data.slice(0..compressed_size);
    match compression_type {
        0 => Bytes::from(comp_block),
        1 => panic!("lzma not supported"),  // TODO lzma
        2 => lz4_decompress(&comp_block[..], uncompressed_size as usize).expect("could not decompress lz4"),
        3 => lz4_decompress(&comp_block[..], uncompressed_size as usize).expect("could not decompress lz4hc"),
        _ => panic!("unsupported compression method")
    }
}