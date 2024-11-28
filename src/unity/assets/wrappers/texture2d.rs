extern crate num;

use std::fmt::{Debug};
use bytes::Bytes;
use wasm_bindgen_test::console_log;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::BundleFile;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;
use crate::utils::tex::pngenc::encode_png;

use crate::utils::tex::decoder::{decode, get_mipmap_offset_and_size, TextureFormat};


#[derive(Debug)]
pub struct Texture2DWrapper {
    pub(crate) width: i32,
    pub(crate) height: i32,
    pub(crate) num_mips: i32,
    pub(crate) num_images: i32,
    pub(crate) dimensions: i32,
    pub(crate) format: TextureFormat,
    data: Bytes
}

impl Asset for Texture2DWrapper {
    fn make_html(&mut self, doc: &Document) -> Element {
        doc.create_element("div").expect("dummy")
    }

    fn export(&mut self) -> Export {
        Export {
            extension: ".png".to_owned(),
            // TODO: export all mips
            data: encode_png(self.width as u32, self.height as u32, &self.get_image(0), false).into()
        }
    }
}

impl ClassWrapper for Texture2DWrapper {
}

impl Texture2DWrapper {
    pub fn from_value(value: &ValueType, bundle: Option<&BundleFile>) -> Result<Self, ObjectError> {
        Ok(Texture2DWrapper {
            width: value.get("m_Width")?.as_i32()?,
            height: value.get("m_Height")?.as_i32()?,
            num_mips: value.get("m_MipCount")?.as_i32()?,
            num_images: value.get("m_ImageCount")?.as_i32()?,
            dimensions: value.get("m_TextureDimension").unwrap_or(&ValueType::Int32(2)).as_i32()?,
            format: num::FromPrimitive::from_i32(value.get("m_TextureFormat")?.as_i32()?).ok_or(ObjectError {})?,
            data: {
                let stream = value.get("m_StreamData")?;
                let data = value.get("image data")?.as_bytes()?;
                if data.len() > 0 {
                    data
                } else {
                    if let Some(b) = bundle {
                        b.get_resource_data(
                            stream.get("path")?.as_string()?.as_str(),
                            stream.get("offset")?.as_offset()?,
                            stream.get("size")?.as_offset()?
                        )?
                    } else {
                        // FIXME error handling
                        panic!("texture contains streaming data but no bundle was provided");
                    }
                }
            }
        })
    }

    pub fn get_image(&self, index: i32) -> Vec<u8> {
        console_log!("{:?}", self.format);
        decode(
            self.format.clone(),
            &mut self.data.slice(
                get_mipmap_offset_and_size(index, self.format.clone(), self.width, self.height).0 as usize..
            ),
            self.width as usize,
            self.height as usize,
            false
        )
    }
}
