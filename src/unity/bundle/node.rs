use bytes::{Buf, Bytes};
use crate::utils::buf::{BufExt, FromBytes};

#[derive(Debug)]
pub struct NodeFlags {
    // TODO
}

impl NodeFlags {
    pub fn from_bits(i: u32) -> NodeFlags {
        NodeFlags {
            // TODO
        }
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
            flags: NodeFlags::from_bits(data.get_u32()),
            path: data.get_cstring()
        }
    }
}
