use std::fmt::{Debug, Formatter};
use bytes::{Buf, Bytes};
use crate::base::asset::Asset;
use crate::create_img;
use crate::utils::buf::{BufExt, FromBytes};
use crate::xna::type_base::XNBType;

#[derive(Debug)]
pub enum SurfaceFormat {
    Color,
    BGR565,
    BGRA5551,
    BGRA4444,
    DXT1,
    DXT3,
    DXT5,
    NormalizedByte2,
    NormalizedByte4,
    RGBA1010102,
    RG32,
    RGBA64,
    Alpha8,
    Single,
    Vector2,
    Vector4,
    HalfSingle,
    HalfVector2,
    HalfVector4,
    HDRBlendable
}

impl FromBytes for SurfaceFormat {
    fn from_bytes(data: &mut Bytes) -> Self {
        match data.get_i32_le() {
            0 => SurfaceFormat::Color,
            1 => SurfaceFormat::BGR565,
            2 => SurfaceFormat::BGRA5551,
            3 => SurfaceFormat::BGRA4444,
            4 => SurfaceFormat::DXT1,
            5 => SurfaceFormat::DXT3,
            6 => SurfaceFormat::DXT5,
            7 => SurfaceFormat::NormalizedByte2,
            8 => SurfaceFormat::NormalizedByte4,
            9 => SurfaceFormat::RGBA1010102,
            10 => SurfaceFormat::RG32,
            11 => SurfaceFormat::RGBA64,
            12 => SurfaceFormat::Alpha8,
            13 => SurfaceFormat::Single,
            14 => SurfaceFormat::Vector2,
            15 => SurfaceFormat::Vector4,
            16 => SurfaceFormat::HalfSingle,
            17 => SurfaceFormat::HalfVector2,
            18 => SurfaceFormat::HalfVector4,
            19 => SurfaceFormat::HDRBlendable,
            _ => SurfaceFormat::Color
        }
    }
}


pub struct Mip {
    data: Bytes
}

impl Mip {
    pub fn decode(data: &mut Bytes) -> Mip {
        // TODO
        Mip { data: data.clone() }
    }
}

impl Debug for Mip {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str("Mip")
    }
}


#[derive(Debug)]
pub struct Texture2D {
    pub surface_format: SurfaceFormat,
    pub width: u32,
    pub height: u32,
    pub num_mips: u32,
    pub textures: Vec<Mip>
}

impl Asset for Texture2D {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("img").expect("failed to create element");
        elem.set_attribute("src", &create_img(&self.textures[0].data, self.width as usize, self.height as usize));
        elem
    }
}

impl XNBType for Texture2D {
    fn from_bytes(data: &mut Bytes) -> Texture2D {
        let surface_format = SurfaceFormat::from_bytes(data);
        let width = data.get_u32_le();
        let height = data.get_u32_le();
        let num_mips = data.get_u32_le();
        let data_size = data.get_u32_le() as usize;
        let mut texture_data = data.get_raw(data_size);
        let mut textures = Vec::new();
        for i in 0..num_mips {
            textures.push(Mip::decode(&mut texture_data.slice(0..(texture_data.len() / num_mips as usize))))
        }
        Texture2D {
            surface_format,
            width,
            height,
            num_mips,
            textures
        }
    }
}
