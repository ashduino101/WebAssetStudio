use bytes::{Buf, Bytes};
use crate::base::asset::Asset;
use crate::utils::buf::BufExt;
use crate::xna::type_base::XNBType;

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
}

impl XNBType for TimeSpan {
    fn from_bytes(data: &mut Bytes) -> TimeSpan {
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
}

impl XNBType for DateTime {
    fn from_bytes(data: &mut Bytes) -> DateTime {
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
}

impl XNBType for Decimal {
    fn from_bytes(data: &mut Bytes) -> Decimal {
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
}

impl XNBType for ExternalReference {
    fn from_bytes(data: &mut Bytes) -> ExternalReference {
        ExternalReference { asset_name: data.get_string_varint() }
    }
}
