use std::fmt::{Debug};
use std::sync::{Arc, Mutex, MutexGuard};
use bytes::Bytes;
use rand::distributions::DistString;
use wasm_bindgen::JsCast;
use wasm_bindgen_test::console_log;
use web_sys::{Document, Element, HtmlImageElement};
use crate::base::asset::{Asset, Export};
use crate::base::asset::bundle::BundleFile;
use crate::UnityBundleFile;
use crate::crunch::CrunchLib;
use crate::logger::info;
use crate::studio::components::text_editor::get_ace;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;
use crate::utils::dom::create_img;
use crate::utils::tex::pngenc::encode_png;

use crate::utils::tex::decoder::{decode, get_mipmap_offset_and_size, TextureFormat};
use crate::utils::time::now;

#[derive(Debug)]
pub struct TextWrapper {
    pub(crate) text: String
}

impl Asset for TextWrapper {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        let editor = get_ace().create_on(parent);
        editor.set_readonly(true);
        editor.set_mode("ace/mode/glsl");
        editor.set_theme("ace/theme/tomorrow_night");
        editor.set_value(&self.text);
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export {
            extension: ".png".to_owned(),
            data: self.text.clone().into_bytes()
        }
    }
}

impl ClassWrapper for TextWrapper {
}

impl TextWrapper {
    pub fn from_value(value: &ValueType) -> Result<Self, ObjectError> {
        Ok(TextWrapper {
            text: value.get("m_Script")?.as_string()?
        })
    }
}
