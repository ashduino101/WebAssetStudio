extern crate core;

pub mod unity;
pub mod utils;
pub mod xna;
pub mod logger;
pub mod base;
pub mod alert_hook;

use std::{panic, thread};
use std::panic::PanicInfo;
use bytes::Bytes;
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;
use crate::logger::splash;
use crate::unity::asset_file::AssetFile;
use crate::unity::bundle::file::BundleFile;
use crate::utils::dom::create_img;
use crate::xna::xnb::XNBFile;

#[wasm_bindgen(start)]
fn main() {
    // Fancy console splash text
    splash();

    // Register our custom panic hooks
    panic::set_hook(Box::new(|info: &PanicInfo| {
        console_error_panic_hook::hook(info);
        alert_hook::hook(info);
    }));

    // let mut dat = Bytes::from(Vec::from(include_bytes!("../tests/data/xnb/Background.xnb")));
    // let mut xnb = XNBFile::new(&mut dat);
    //
    // let window = web_sys::window().expect("no global `window` exists");
    // let document = window.document().expect("should have a document on window");
    // let body = document.body().expect("document should have a body");
    //
    // let elem = xnb.primary_asset.make_html(&document);
    // body.append_child(&elem);
    //
    // console_log!("{:?}", xnb);
    let mut dat = Bytes::from(Vec::from(include_bytes!("../test2.unity3d")));
    let mut f = BundleFile::new(&mut dat);

    console_log!("start decompress");
    let file = f.get_file(&f.list_files()[0]).expect("nonexistent file");
    console_log!("end decompress: {} bytes", file.len());
    // console_log!("{:?}", f.get_file(&f.list_files()[0]));
}
