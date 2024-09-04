use bytes::{Buf, Bytes};
use crate::base::asset::{Asset, Export};
use crate::utils::buf::BufExt;
use crate::xna::type_base::XNBType;
use crate::xna::xnb::TypeReader;

#[derive(Debug)]
pub struct TimeSpan {
    ticks: i64
}

impl Asset for TimeSpan {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{} ticks", self.ticks)));
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: self.ticks.to_string().into_bytes()
        }
    }
}

impl XNBType for TimeSpan {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> TimeSpan {
        TimeSpan { ticks: data.get_i64_le() }
    }
}

#[derive(Debug)]
pub struct DateTime {
    value: i64
}

impl Asset for DateTime {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self.value)));
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: self.value.to_string().into_bytes()
        }
    }
}

impl XNBType for DateTime {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> DateTime {
        DateTime { value: data.get_i64() }
    }
}

#[derive(Debug)]
pub struct Decimal {
    raw: u128
}

impl Asset for Decimal {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("RAW: {}", self.raw)));  // TODO display properly
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: self.raw.to_string().into_bytes()
        }
    }
}

impl XNBType for Decimal {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Decimal {
        Decimal { raw: data.get_u128() }
    }
}

#[derive(Debug)]
pub struct ExternalReference {
    asset_name: String
}

impl Asset for ExternalReference {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Asset: {}", self.asset_name)));
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: self.asset_name.clone().into_bytes()
        }
    }
}

impl XNBType for ExternalReference {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> ExternalReference {
        ExternalReference { asset_name: data.get_string_varint() }
    }
}
