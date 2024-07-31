use std::fmt::Debug;
use web_sys;
use web_sys::{Document, Element};

pub struct Export {
    pub extension: String,
    pub data: Vec<u8>
}

pub trait Asset : Debug {
    fn make_html(&mut self, doc: &Document) -> Element;

    fn export(&mut self) -> Export;
}

macro_rules! impl_primitive {
    ($t:ident) => {
        impl Asset for $t {
            fn make_html(&mut self, doc: &Document) -> Element {
                let elem = doc.create_element("p").expect("failed to create element");
                elem.set_text_content(Some(&*self.to_string()));
                elem
            }

            fn export(&mut self) -> Export {
                Export { extension: "txt".to_owned(), data: self.to_string().into_bytes() }
            }
        }
    }
}

// Primitive, just in case

impl_primitive!(i8);
impl_primitive!(u8);
impl_primitive!(i16);
impl_primitive!(u16);
impl_primitive!(i32);
impl_primitive!(u32);
impl_primitive!(i64);
impl_primitive!(u64);
impl_primitive!(i128);
impl_primitive!(u128);
impl_primitive!(f32);
impl_primitive!(f64);

#[derive(Debug)]
pub struct Void {}

impl Asset for Void {
    fn make_html(&mut self, doc: &Document) -> Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some("<none>"));
        elem
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_owned(), data: "<void>".to_owned().into_bytes() }
    }
}

impl Asset for String {
    fn make_html(&mut self, doc: &Document) -> Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }

    fn export(&mut self) -> Export {
        Export { extension: "txt".to_owned(), data: self.clone().into_bytes() }
    }
}
