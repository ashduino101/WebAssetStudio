extern crate num;

use std::fmt::{Debug, Formatter};
use bytes::Bytes;
use web_sys::{Document, Element};
use crate::base::asset::Asset;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;
use crate::utils::tex::pngenc::encode_png;
use crate::utils::tex::texdec::{decode, get_mipmap_byte_size, get_mipmap_offset_and_size, TextureFormat};


#[derive(Debug)]
pub struct Texture2DWrapper {
    pub(crate) width: i32,
    pub(crate) height: i32,
    pub(crate) num_mips: i32,
    pub(crate) num_images: i32,
    dimensions: i32,
    format: TextureFormat,
    data: Bytes
}

impl Asset for Texture2DWrapper {
    fn make_html(&mut self, doc: &Document) -> Element {
        doc.create_element("div").expect("dummy")
    }
}

impl ClassWrapper for Texture2DWrapper {
}

impl Texture2DWrapper {
    pub fn from_value(value: ValueType) -> Result<Self, ObjectError> {
        Ok(Texture2DWrapper {
            width: value.get("m_Width")?.as_i32()?,
            height: value.get("m_Height")?.as_i32()?,
            num_mips: value.get("m_MipCount")?.as_i32()?,
            num_images: value.get("m_ImageCount")?.as_i32()?,
            dimensions: value.get("m_TextureDimension").unwrap_or(&ValueType::Int32(2)).as_i32()?,
            format: num::FromPrimitive::from_i32(value.get("m_TextureFormat")?.as_i32()?).ok_or(ObjectError {})?,
            data: value.get("image data")?.as_bytes()?
        })
    }

    pub fn get_image(&self, index: i32) -> Box<[u8]> {
        decode(
            self.format.clone(),
            &mut self.data.clone().slice(
                get_mipmap_offset_and_size(index, self.format.clone(), self.width, self.height).0 as usize..
            ),
            self.width as usize,
            self.height as usize,
            false
        )
    }
}
