use std::fmt::{Debug, Formatter};
use bytes::{Buf, Bytes};
use crate::logger::info;
use crate::base::asset::{Asset, Export};
use crate::{create_img, XNBFile};
use crate::utils::buf::{FromBytes};
use crate::utils::tex::decoder::{decode, TextureFormat};
use crate::utils::tex::pngenc::encode_png;
use crate::utils::time::now;
use crate::xna::type_base::XNBType;
use crate::xna::xnb::TypeReader;
impl TextureFormat {
    fn from_bytes_xna(data: &mut Bytes) -> Self {
        match data.get_i32_le() {
            0 => TextureFormat::RGBA32,
            1 => TextureFormat::BGR565,
            2 => TextureFormat::BGRA5551,
            3 => TextureFormat::BGRA4444,
            4 => TextureFormat::DXT1,
            5 => TextureFormat::DXT3,
            6 => TextureFormat::DXT5,
            7 => TextureFormat::R16,  // ???
            8 => TextureFormat::RG32,  // ???
            9 => TextureFormat::RGBA1010102,
            10 => TextureFormat::RG32,
            11 => TextureFormat::RGBA64,
            12 => TextureFormat::Alpha8,
            13 => TextureFormat::RFloat,
            14 => TextureFormat::RGFloat,
            15 => TextureFormat::RGBAFloat,
            16 => TextureFormat::RHalf,
            17 => TextureFormat::RGHalf,
            18 => TextureFormat::RGBAHalf,
            19 => TextureFormat::RGBAHalf,  // TODO i have no idea
            _ => TextureFormat::RGBA32
        }
    }
}


pub struct Mip {
    data: Bytes
}

impl Mip {
    pub fn decode(data: &mut Bytes, format: &TextureFormat, w: usize, h: usize) -> Mip {
        Mip { data: Bytes::from(decode(*format, data, w, h, false)) }
    }
}

impl Debug for Mip {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str("Mip")
    }
}


#[derive(Debug)]
pub struct Texture2D {
    pub surface_format: TextureFormat,
    pub width: u32,
    pub height: u32,
    pub num_mips: u32,
    pub textures: Vec<Mip>
}

impl Asset for Texture2D {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("img").expect("failed to create element");
        let start = now();
        elem.set_attribute("src", &create_img(&self.textures[0].data, self.width as usize, self.height as usize, false)).expect("set_attribute");
        info!("converted to native image in {}ms", now() - start);
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "png".to_string(),
            data: encode_png(self.width, self.height, &self.textures[0].data[..], false).into()  // TODO: support exporting multiple mips
        }
    }
}

impl XNBType for Texture2D {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Texture2D {
        let surface_format = TextureFormat::from_bytes_xna(data);
        let width = data.get_u32_le();
        let height = data.get_u32_le();
        let num_mips = data.get_u32_le();
        let data_size = data.get_u32_le() as usize;
        let texture_data = data.copy_to_bytes(data_size);
        let mut textures = Vec::new();
        let start = now();
        for _ in 0..num_mips {
            textures.push(Mip::decode(&mut texture_data.slice(0..(texture_data.len() / num_mips as usize)), &surface_format, width as usize, height as usize))
        }
        info!("loaded texture in {}ms", now() - start);
        Texture2D {
            surface_format,
            width,
            height,
            num_mips,
            textures
        }
    }
}

#[derive(Debug)]
pub struct Effect {
    pub data: Bytes
}

impl Asset for Effect {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        doc.create_element("div").unwrap()  // TODO
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "fx".to_string(),
            data: vec![],
        }
    }
}

impl XNBType for Effect {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Effect {
        let size = data.get_u32_le() as usize;
        let effect = data.slice(0..size);
        data.advance(size);
        Effect {
            data: effect
        }
    }
}


#[derive(Debug)]
pub struct SpriteFont {
    pub texture: Box<dyn XNBType>,
    pub glyphs: Box<dyn XNBType>,
    pub cropping: Box<dyn XNBType>,
    pub character_map: Box<dyn XNBType>,
    pub vertical_line_spacing: i32,
    pub horizontal_spacing: f32,
    pub kerning: Box<dyn XNBType>,
    pub default_character: Option<char>
}

impl Asset for SpriteFont {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        self.texture.make_html(doc)
    }

    fn export(&mut self) -> Export {
        self.texture.export()
    }
}

impl XNBType for SpriteFont {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> SpriteFont {
        let texture = XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers);
        let glyphs = XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers);
        let cropping = XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers);
        let character_map = XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers);
        let vertical_line_spacing = data.get_i32_le();
        let horizontal_spacing = data.get_f32_le();
        let kerning = XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers);
        let default_character = if data.get_u8() != 0 { Some(char::from_bytes(data)) } else { None };
        SpriteFont {
            texture,
            glyphs,
            cropping,
            character_map,
            vertical_line_spacing,
            horizontal_spacing,
            kerning,
            default_character
        }
    }
}
