use bytes::{Buf, Bytes};
use crate::utils::buf::BufExt;

#[derive(Debug)]
pub struct ObjectInfo {
    pub path_id: i64,
    pub offset: usize,
    pub size: usize,
    pub type_id: i32,
    pub class_id: u16,
    pub is_destroyed: bool,
    pub script_type_index: i16,
    pub is_stripped: bool,
}

impl ObjectInfo {
    pub fn from_bytes(data: &mut Bytes, version: u32, little_endian: bool, has_long_ids: bool, start_length: usize) -> ObjectInfo {
        let path_id = if has_long_ids {
            data.get_i64_ordered(little_endian)
        } else if version < 14 {
            data.get_i32_ordered(little_endian) as i64
        } else {
            data.align(start_length, 4);
            data.get_i64_ordered(little_endian)
        };

        let offset = if version >= 22 {
            data.get_u64_ordered(little_endian) as usize
        } else {
            data.get_u32_ordered(little_endian) as usize
        };
        let size = data.get_u32_ordered(little_endian) as usize;
        let type_id = data.get_i32_ordered(little_endian);
        let class_id = if version < 16 {
            data.get_u16_ordered(little_endian)
        } else { 0 };
        let is_destroyed = if version < 11 {
            data.get_u16_ordered(little_endian) != 0
        } else { false };
        let script_type_index = if version >= 11 && version < 17 {
            data.get_i16_ordered(little_endian)
        } else { -1i16 };
        let is_stripped = if version == 15 || version == 16 {
            data.get_u8() != 0
        } else { false };
        ObjectInfo {
            path_id,
            offset,
            size,
            type_id,
            class_id,
            is_destroyed,
            script_type_index,
            is_stripped
        }
    }
}
