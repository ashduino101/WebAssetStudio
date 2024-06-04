//! Test suite for the Web and headless browsers.

// #![cfg(target_arch = "wasm32")]

mod web;

extern crate wasm_bindgen_test;
use wasm_bindgen_test::*;
use include_dir::{include_dir, Dir};

// wasm_bindgen_test_configure!(run_in_browser);

const UNITYFS_DATA: Dir = include_dir!("tests/data/unityfs");
const XNB_DATA: Dir = include_dir!("tests/data/xnb");

#[cfg(test)]
mod tests {
    use std::convert::TryInto;
    use std::fs::File;
    use std::io::{Read, Write};
    use webassetstudio::unity::assets::file::AssetFile;
    use bytes::{Buf, BufMut, Bytes, BytesMut};
    use webassetstudio::unity::bundle::file::BundleFile;
    // use webassetstudio::unity::classes::{Animator, MonoBehaviour, SkinnedMeshRenderer, TypeDefFromBytes};
    use include_dir::{include_dir, Dir};
    use lzxd::{Lzxd, WindowSize};
    use webassetstudio::utils::compress::lzx_decompress;
    // use webassetstudio::utils::lzx_decompress;
    use webassetstudio::xna::xnb::XNBFile;
    use crate::{UNITYFS_DATA, XNB_DATA};

    #[test]
    fn test_bundle() {
        for f in UNITYFS_DATA.files().filter(|f| !f.path().ends_with(".empty")) {
            let mut data = Vec::from(f.contents());
            let mut b = Bytes::from(data);
            let mut f = BundleFile::new(&mut b);
        }
    }

    // #[test]
    // fn test_generated() {
    //     let mut data = Vec::from(include_bytes!("data/SkinnedMeshRenderer.dat"));
    //     let mut b = Bytes::from(data);
    //     let mut a = SkinnedMeshRenderer::from_bytes(&mut b, 180420201);
    //     println!("{:?}", a);
    // }

    #[test]
    fn test_xnb() {
        for f in XNB_DATA.files().filter(|f| !f.path().ends_with(".empty")) {
            let mut data = Vec::from(f.contents());
            let mut b = Bytes::from(data);
            let mut f = XNBFile::new(&mut b);
            println!("{:?}", f);
        }
    }

    #[test]
    fn test_lzx() {
        let mut data = Bytes::from_static(include_bytes!("data/misc/Bed.lzx"));


    }
}