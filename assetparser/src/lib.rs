mod utils;
mod binary;
mod xna;

use wasm_bindgen::prelude::*;
use crate::xna::XNB;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn parse_xnb(data: &[u8]) -> XNB {
    xna::parse_xnb(data.into()).expect("a")
}
