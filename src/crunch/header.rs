use bytes::{Buf, Bytes};
use crate::crunch::palette::Palette;

#[derive(Debug, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub(crate) enum CrunchFormat {
    DXT1,
    DXT3,
    DXT5,
    // Various DXT5 derivatives
    DXT5CCxY,  // Luma-chroma
    DXT5xGxR,  // Swizzled 2-component
    DXT5xGBR,  // Swizzled 3-component
    DXT5AGBR,  // Swizzled 4-component

    // ATI 3DC and X360 DXN
    DXNXY,
    DXNYX,

    // DXT5 alpha blocks only
    DXT5A,

    ETC1,
    ETC2,
    ETC2A,
    ETC1S,
    ETC2AS,

    Invalid
}

impl CrunchFormat {
    pub(crate) fn from_bytes(data: &mut Bytes) -> CrunchFormat {
        let v = data.get_u8();
        match v {
            0 => CrunchFormat::DXT1,
            1 => CrunchFormat::DXT3,
            2 => CrunchFormat::DXT5,

            3 => CrunchFormat::DXT5CCxY,
            4 => CrunchFormat::DXT5xGxR,
            5 => CrunchFormat::DXT5xGBR,
            6 => CrunchFormat::DXT5AGBR,

            7 => CrunchFormat::DXNXY,
            8 => CrunchFormat::DXNYX,

            9 => CrunchFormat::DXT5A,

            10 => CrunchFormat::ETC1,
            11 => CrunchFormat::ETC2,
            12 => CrunchFormat::ETC2A,
            13 => CrunchFormat::ETC1S,
            14 => CrunchFormat::ETC2AS,
            _ => CrunchFormat::Invalid
        }
    }
}

#[derive(Debug, Clone)]
pub(crate) struct CrunchHeader {
    header_size: u16,
    header_crc16: u16,
    data_size: u32,
    data_crc16: u16,
    width: u16,
    height: u16,
    levels: u8,
    faces: u8,
    pub(crate) format: CrunchFormat,
    flags: u16,
    reserved: u32,
    userdata0: u32,
    userdata1: u32,
    pub(crate) color_endpoints: Palette,
    color_selectors: Palette,
    pub(crate) alpha_endpoints: Palette,
    alpha_selectors: Palette,
    pub(crate) tables_size: u16,
    pub(crate) tables_offset: u32, // u24
    levels_offsets: Vec<u32>
}

impl CrunchHeader {
    pub fn from_bytes(data: &mut Bytes) -> CrunchHeader {
        let magic = data.get_chars(2);
        assert_eq!(&magic, "Hx");
        let mut h = CrunchHeader {
            header_size: data.get_u16(),
            header_crc16: data.get_u16(),
            data_size: data.get_u32(),
            data_crc16: data.get_u16(),
            width: data.get_u16(),
            height: data.get_u16(),
            levels: data.get_u8(),
            faces: data.get_u8(),
            format: CrunchFormat::from_bytes(data),
            flags: data.get_u16(),
            reserved: data.get_u32(),
            userdata0: data.get_u32(),
            userdata1: data.get_u32(),
            color_endpoints: Palette::from_bytes(data),
            color_selectors: Palette::from_bytes(data),
            alpha_endpoints: Palette::from_bytes(data),
            alpha_selectors: Palette::from_bytes(data),
            tables_size: data.get_u16(),
            tables_offset: ((data.get_u16() as u32) << 8) | (data.get_u8() as u32),
            levels_offsets: Vec::new()
        };
        for _ in 0..h.levels {
            h.levels_offsets.push(data.get_u32());
        }
        h
    }

    pub fn bytes_per_block(&self) -> u8 {
        if self.format == CrunchFormat::DXT1 || self.format == CrunchFormat::DXT5A {
            8
        } else {
            16
        }
    }
}
