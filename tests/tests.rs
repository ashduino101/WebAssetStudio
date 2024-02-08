//! Test suite for the Web and headless browsers.

// #![cfg(target_arch = "wasm32")]

mod web;

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;

// wasm_bindgen_test_configure!(run_in_browser);

#[cfg(test)]
mod tests {
    use std::fs::File;
    use std::io::{Read};
    use webassetstudio::unity::asset_file::AssetFile;
    use bytes::{Bytes};
    use webassetstudio::unity::bundle::file::BundleFile;

    #[test]
    fn test_bundle() {
        let mut data = Vec::from(include_bytes!("data/01.avtr"));
        let mut b = Bytes::from(data);
        let mut af = BundleFile::new(&mut b);
        println!("{:#?}", af);
    }
}