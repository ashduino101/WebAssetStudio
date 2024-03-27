use std::fmt::Debug;
use web_sys;

pub trait Asset : Debug {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element;
}

// Primitive, just in case

impl Asset for i8 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for u8 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for bool {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for char {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for i16 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for u16 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for i32 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for u32 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for f32 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for i64 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for u64 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

impl Asset for f64 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}

#[derive(Debug)]
pub struct Void {}

impl Asset for Void {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some("<none>"));
        elem
    }
}

impl Asset for String {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("{}", self)));
        elem
    }
}
