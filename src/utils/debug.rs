use std::io::Cursor;
use bytes::Bytes;
use image::{ImageFormat, RgbaImage};
use wasm_bindgen::JsCast;
use web_sys::HtmlElement;
use crate::utils::dom::{create_data_url, create_element};

pub fn load_image(image: RgbaImage) {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");
    let elem = document.create_element("img").expect("failed to create element");
    let mut data = Vec::new();
    image.write_to(&mut Cursor::new(&mut data), ImageFormat::Png).unwrap();
    elem.set_attribute("src", &create_data_url(&data[..], "image/png")).expect("set_attribute");
    body.append_child(&elem).expect("append_child");
}

pub fn load_audio(data: Bytes) {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");
    let elem = document.create_element("audio").expect("failed to create element");
    // FIXME: idk what audio format this function is used for
    elem.set_attribute("src", &create_data_url(&data[..], "audio/*")).expect("set_attribute");
    elem.set_attribute("controls", "").expect("set_attribute");
    body.append_child(&elem).expect("append_child");
}

pub fn download_file(data: &[u8], filename: &str) {
    let url = create_data_url(data, "application/octet-stream");
    let a = create_element("a");
    a.set_attribute("href", &url).unwrap();
    a.set_attribute("download", filename).unwrap();
    web_sys::window().unwrap().document().unwrap().body().unwrap().append_child(&a).unwrap();
    a.dyn_into::<HtmlElement>().unwrap().click();
}
