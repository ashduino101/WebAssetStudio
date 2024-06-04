use bytes::{Bytes, BytesMut, Buf, BufMut};
use lzxd::{Lzxd, WindowSize};

// https://github.com/FNA-XNA/FNA/blob/master/src/Content/ContentManager.cs
pub fn decompress_xnb(data: &mut Bytes) -> Bytes {
    let mut lzxd = Lzxd::new(WindowSize::KB64);

    let mut decompressed = BytesMut::new();

    while data.remaining() > 0 {
        let mut bs_hi = data.get_u8() as u16;
        let mut bs_lo = data.get_u8() as u16;
        let mut block_size = (bs_hi << 8) | bs_lo;
        let mut frame_size = 0x8000;

        if bs_hi == 0xff {
            bs_hi = bs_lo;
            bs_lo = data.get_u8() as u16;
            frame_size = (bs_hi << 8) | bs_lo;
            block_size = data.get_u16();
        }

        let block_size = block_size as usize;
        let frame_size = frame_size as usize;

        if block_size == 0 || frame_size == 0 {
            break;
        }

        let mut block = data.slice(0..block_size);
        data.advance(block_size);

        let res = lzxd.decompress_next(&mut block, frame_size).unwrap();
        decompressed.put(res);
    }

    decompressed.into()
}