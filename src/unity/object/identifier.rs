use bytes::Bytes;
use crate::utils::buf::BufExt;

#[derive(Debug)]
pub struct LocalObjectIdentifier {
    pub file_index: i32,
    pub identifier: i64
}

impl LocalObjectIdentifier {
    pub fn from_bytes(data: &mut Bytes, version: u32, little_endian: bool, start_length: usize) -> LocalObjectIdentifier {
        let file_index = data.get_i32_ordered(little_endian);
        let identifier = if version < 14 {
            data.get_i32_ordered(little_endian) as i64
        } else {
            data.align(start_length, 4);
            data.get_i64_ordered(little_endian)
        };
        LocalObjectIdentifier {
            file_index,
            identifier
        }
    }
}
