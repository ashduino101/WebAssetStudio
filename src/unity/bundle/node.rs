use bytes::{Buf, Bytes};
use crate::utils::buf::{BufExt, FromBytes};
use bitflags::{bitflags, Flags};

bitflags! {
    #[derive(Debug, Copy, Clone)]
    pub struct NodeFlags: u32 {
        const IsAsset = 0b00000100;
    }
}

#[derive(Debug)]
pub struct Node {
    pub offset: usize,
    pub size: usize,
    pub flags: NodeFlags,
    pub path: String
}

impl FromBytes for Node {
    fn from_bytes(data: &mut Bytes) -> Node {
        Node {
            offset: data.get_u64() as usize,
            size: data.get_u64() as usize,
            flags: NodeFlags::from_bits_retain(data.get_u32()),
            path: data.get_cstring()
        }
    }
}
