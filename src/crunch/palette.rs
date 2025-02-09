use bytes::{Buf, Bytes};

#[derive(Debug, Clone)]
pub(crate) struct Palette {
    pub(crate) offset: u32,
    pub(crate) size: u32,
    pub(crate) num: u16
}

impl Palette {
    pub fn from_bytes(data: &mut Bytes) -> Palette {
        Palette {
            offset: ((data.get_u16() as u32) << 8) | (data.get_u8() as u32),
            size: ((data.get_u16() as u32) << 8) | (data.get_u8() as u32),
            num: data.get_u16()
        }
    }
}
