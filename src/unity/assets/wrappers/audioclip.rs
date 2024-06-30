use std::fmt::{Debug};
use bytes::Bytes;
use wasm_bindgen_test::console_log;
use web_sys::{Document, Element};
use crate::base::asset::Asset;
use crate::BundleFile;
use crate::fsb::bank::SoundBank;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;

use crate::utils::tex::texdec::{decode, get_mipmap_offset_and_size, TextureFormat};


#[derive(Debug)]
pub struct AudioClipWrapper {
    resource: ValueType
}

impl Asset for AudioClipWrapper {
    fn make_html(&mut self, doc: &Document) -> Element {
        doc.create_element("div").expect("dummy")
    }
}

impl ClassWrapper for AudioClipWrapper {
}

impl AudioClipWrapper {
    pub fn from_value(value: &ValueType) -> Result<Self, ObjectError> {
        Ok(AudioClipWrapper {
            resource: value.get("m_Resource")?.clone(),
        })
    }

    pub fn get_audio(&self, bundle: &BundleFile) -> Result<SoundBank, ObjectError> {
        let mut res = bundle.get_resource_data(
            self.resource.get("m_Source")?.as_string()?.as_str(),
            self.resource.get("m_Offset")?.as_offset()?,
            self.resource.get("m_Size")?.as_offset()?
        )?;
        let bank = SoundBank::new(&mut res);
        Ok(bank)
    }
}
