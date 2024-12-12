use std::io::Cursor;
use bytes::{Buf, Bytes};
use lzma_rs::decompress::{Options, UnpackedSize};
use lzma_rs::lzma_decompress_with_options;
use crate::utils::compress::lz4_decompress;

pub fn decompress(data: &mut Bytes, compression_type: u8, compressed_size: usize, uncompressed_size: usize) -> Bytes {
    let mut comp_block = data.slice(0..compressed_size);
    match compression_type {
        0 => Bytes::from(comp_block),
        1 => {
            let mut cur = Cursor::new(comp_block);
            let mut w = Cursor::new(Vec::new());
            lzma_decompress_with_options(&mut cur, &mut w, &Options {
                unpacked_size: UnpackedSize::UseProvided(Some(uncompressed_size as u64)),
                memlimit: None,
                allow_incomplete: false,
            }).unwrap();
            w.into_inner().into()
        },
        2 => lz4_decompress(&comp_block[..], uncompressed_size).unwrap(),
        3 => lz4_decompress(&comp_block[..], uncompressed_size).unwrap(),
        _ => panic!("unsupported compression method")
    }
}