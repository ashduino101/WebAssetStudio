use std::panic;
use std::panic::PanicInfo;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen]
    fn alert(msg: &str);
}


pub fn hook(info: &PanicInfo) {
    alert(&*info.to_string());
}


pub fn set_once() {
    panic::set_hook(Box::new(hook));
}