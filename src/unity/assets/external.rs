use bytes::{Buf, Bytes};
use crate::utils::buf::BufExt;

#[derive(Debug)]
pub struct External {
    pub guid: u128,
    pub r#type: i32,
    pub path: String
}

impl External {
    pub fn from_bytes(data: &mut Bytes, version: u32, little_endian: bool) -> External {
        if version >= 6 {
            data.get_cstring();  // empty
        };
        let guid = if version >= 5 {
            data.get_u128()
        } else { 0 };
        let r#type = if version >= 5 {
            data.get_i32_ordered(little_endian)
        } else { 0 };
        let path = data.get_cstring();
        External {
            guid,
            r#type,
            path
        }
    }
}
