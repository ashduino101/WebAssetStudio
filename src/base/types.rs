// Common types used in multiple formats

use std::fmt::{Debug, Display, Formatter, Write};
use crate::base::asset::Asset;

#[derive(Debug, Copy, Clone)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32
}

impl Asset for Vector2 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Vector2({}, {})", self.x, self.y)));
        elem
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32
}

impl Asset for Vector3 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*self.to_string()));
        elem
    }
}

impl Display for Vector3 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Vector3({}, {}, {})", self.x, self.y, self.z))
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Vector4 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Asset for Vector4 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Vector4({}, {}, {}, {})", self.x, self.y, self.z, self.w)));
        elem
    }
}


#[derive(Debug, Copy, Clone)]
pub struct MatrixRow {
    pub val1: f32,
    pub val2: f32,
    pub val3: f32,
    pub val4: f32
}

impl Asset for MatrixRow {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*self.to_string()));
        elem
    }
}

impl Display for MatrixRow {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("[{}, {}, {}, {}]", self.val1, self.val2, self.val3, self.val4))
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Matrix4x4 {
    pub row1: MatrixRow,
    pub row2: MatrixRow,
    pub row3: MatrixRow,
    pub row4: MatrixRow
}

impl Asset for Matrix4x4 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*self.to_string()));
        elem
    }
}

impl Display for Matrix4x4 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("[{}, {}, {}, {}]", self.row1, self.row2, self.row3, self.row4))
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Quaternion {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Asset for Quaternion {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Quaternion({}, {}, {}, {})", self.x, self.y, self.z, self.w)));
        elem
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Color32 {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
    pub alpha: u8
}

impl Asset for Color32 {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Color({}, {}, {}, {})", self.red, self.green, self.blue, self.alpha)));
        elem
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Plane {
    pub normal: Vector3,
    pub d: f32
}

impl Asset for Plane {
    fn make_html(&mut self, doc: &web_sys::Document) -> web_sys::Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Plane({}, {})", self.normal, self.d)));
        elem
    }
}
