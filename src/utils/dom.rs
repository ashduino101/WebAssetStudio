use wasm_bindgen::JsValue;
use web_sys;
use js_sys;
use js_sys::{Array, Uint8Array};
use web_sys::{Blob, Element, Url};
use crate::utils::tex::pngenc::encode_png;

pub fn create_data_url(data: &[u8]) -> String {
    let arr = Uint8Array::new_with_length(data.len() as u32);
    arr.copy_from(&data);
    let parts = Array::new_with_length(1);
    parts.set(0, JsValue::from(arr));
    let blob = Blob::new_with_u8_array_sequence(&JsValue::from(parts)).expect("failed to create blob");
    Url::create_object_url_with_blob(&blob).expect("failed to create object url")
}

pub fn create_img(rgba: &[u8], width: usize, height: usize, flip: bool) -> String {
    let png = encode_png(width as u32, height as u32, rgba, flip);
    create_data_url(&png)
}

pub fn create_element(tag: &str) -> Element {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("no document available");
    document.create_element(tag).expect(&format!("failed to create element \"{}\"", tag))
}

pub fn get_element_by_id(id: &str) -> Option<Element> {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("no document available");
    document.get_element_by_id(id)
}
