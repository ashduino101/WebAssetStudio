use bytes::{Buf, Bytes};
use crate::utils::buf::FromBytes;

#[derive(Debug)]
pub struct BlockFlags {
    pub compression_type: u8,
    pub is_streamed: bool
}

impl BlockFlags {
    pub fn from_bits(i: u16) -> BlockFlags {
        BlockFlags {
            compression_type: (&i & 0x3f) as u8,
            is_streamed: (&i & 0x40) == 0x40
        }
    }
}

#[derive(Debug)]
pub struct BlockInfo {
    pub compressed_size: usize,
    pub uncompressed_size: usize,
    pub flags: BlockFlags
}

impl BlockInfo {

}

impl FromBytes for BlockInfo {
    fn from_bytes(data: &mut Bytes) -> Self {
        BlockInfo {
            compressed_size: data.get_u32() as usize,
            uncompressed_size: data.get_u32() as usize,
            flags: BlockFlags::from_bits(data.get_u16())
        }
    }
}
