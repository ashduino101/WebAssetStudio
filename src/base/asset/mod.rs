pub mod provider;
pub mod types;
pub mod bundle;

use std::fmt::{Debug, Display};
use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use web_sys;
use web_sys::{Document, Element};
use crate::base::asset::types::AssetType;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone)]
pub struct AssetMetadata {
    pub name: String,
    pub asset_type: AssetType,
    pub id: String,
}

#[derive(Debug, Clone)]
pub struct Export {
    pub extension: String,
    pub data: Vec<u8>
}

pub trait Asset : Debug {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()>;

    fn export(&mut self) -> Export;
}

/// Used as a trait bound for a simple asset implementation
pub trait SimpleDisplayableAsset : Debug + Display {}

impl<T> Asset for T where T: SimpleDisplayableAsset {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        parent.set_text_content(Some(&*format!("{}", self)));
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: format!("{}", self).into_bytes()
        }
    }
}

#[derive(Debug, Clone)]
pub struct UnsupportedAsset {

}

impl Asset for UnsupportedAsset {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        let elem = doc.create_element("div").unwrap();
        elem.set_text_content(Some("No preview available"));
        elem.class_list().add_1("unsupported-asset").unwrap();
        parent.append_child(&elem).unwrap();
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_string(), data: Vec::from(b"Asset cannot be exported") }
    }
}

macro_rules! impl_primitive {
    ($t: ty, $($dfunc: tt)+) => {
        impl Asset for $t {
            fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
                parent.set_text_content(Some(&*self.to_string()));
                Ok(())
            }

            fn export(&mut self) -> Export {
                Export { extension: "txt".to_owned(), data: self.to_string().into_bytes() }
            }
        }

        impl FromBytes for $t {
            fn from_bytes(data: &mut Bytes) -> Self {
                data.$($dfunc)+()
            }
        }
    }
}

// Primitive, just in case
impl_primitive!(u8, get_u8);
impl_primitive!(i8, get_i8);
impl_primitive!(u16, get_u16_le);
impl_primitive!(i16, get_i16_le);
impl_primitive!(u32, get_u32_le);
impl_primitive!(i32, get_i32_le);
impl_primitive!(f32, get_f32_le);
impl_primitive!(u64, get_u64_le);
impl_primitive!(i64, get_i64_le);
impl_primitive!(f64, get_f64_le);

// Chars are annoying
impl Asset for char {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        parent.set_text_content(Some(&*self.to_string()));
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_owned(), data: self.to_string().into_bytes() }
    }
}

impl FromBytes for char {
    // i have no clue if this works
    fn from_bytes(data: &mut Bytes) -> Self {
        let mut b = data.get_u8() as u32;
        if (b & 0b11000000) == 0b11000000 {
            b |= (data.get_u8() as u32) << 8;
        }
        if (b & 0b11110000) == 0b11110000 {
            b |= (data.get_u8() as u32) << 16;
        }
        if (b & 0x11111000) == 0b11111000 {
            b |= (data.get_u8() as u32) << 24;
        }
        char::from_u32(b).unwrap()
    }
}


#[derive(Debug, Clone, Default)]
pub struct Void {}

impl Asset for Void {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        parent.set_text_content(Some("<none>"));
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_owned(), data: "<void>".to_owned().into_bytes() }
    }
}

impl Asset for String {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        parent.set_text_content(Some(&*format!("{}", self)));
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_owned(), data: self.clone().into_bytes() }
    }
}

impl FromBytes for Void {
    fn from_bytes(data: &mut Bytes) -> Self {
        Void {}
    }
}
