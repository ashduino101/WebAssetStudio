use bytes::{Buf, Bytes};
use lz4_flex::{compress, decompress};
use lz4_flex::block::DecompressError;
use lzxd::{Lzxd, WindowSize};



pub fn lz4_decompress(data: &[u8], out_size: usize) -> Result<Bytes, String> {
    match decompress(data, out_size) {
        Ok(v) => Ok(Bytes::from(v)),
        Err(e) => Err(e.to_string())
    }
}

pub fn lzx_decompress(mut data: &[u8], out_size: usize) -> Vec<u8> {
    let mut lzxd = Lzxd::new(WindowSize::KB64);


    let res = lzxd.decompress_next(&mut data, out_size).unwrap();

    res.to_vec()
}