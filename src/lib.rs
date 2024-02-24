extern crate core;

pub mod unity;
pub mod utils;
pub mod xna;
pub mod logger;
pub mod base;

use bytes::Bytes;
use wasm_bindgen::prelude::*;
use crate::logger::splash;
use crate::xna::xnb::XNBFile;

#[wasm_bindgen(start)]
fn main() {
    // Splash text
    splash();
}
