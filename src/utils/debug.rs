use bytes::Bytes;
use crate::utils::dom::create_data_url;

pub fn load_audio(data: Bytes) {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");
    let elem = document.create_element("audio").expect("failed to create element");
    elem.set_attribute("src", &create_data_url(&data[..])).expect("set_attribute");
    elem.set_attribute("controls", "").expect("set_attribute");
    body.append_child(&elem).expect("append_child");
}