//! Test suite for the Web and headless browsers.

// #![cfg(target_arch = "wasm32")]

mod web;

extern crate wasm_bindgen_test;
use include_dir::{include_dir, Dir};

// wasm_bindgen_test_configure!(run_in_browser);

const UNITYFS_DATA: Dir = include_dir!("tests/data/unityfs");
const XNB_DATA: Dir = include_dir!("tests/data/xnb");

#[cfg(test)]
mod tests {
    
    
    
    
    
    use bytes::Bytes;
    use webassetstudio::unity::bundle::file::BundleFile;
    // use webassetstudio::unity::classes::{Animator, MonoBehaviour, SkinnedMeshRenderer, TypeDefFromBytes};
    
    
    // use mojoshader;
    
    // use webassetstudio::utils::lzx_decompress;
    use webassetstudio::xna::xnb::XNBFile;
    
    use webassetstudio::directx::shader::FXShader;
    use crate::{UNITYFS_DATA, XNB_DATA};

    #[test]
    fn test_bundle() {
        for f in UNITYFS_DATA.files().filter(|f| !f.path().ends_with(".empty")) {
            let data = Vec::from(f.contents());
            let mut b = Bytes::from(data);
            let f = BundleFile::new(&mut b);
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
            let data = Vec::from(f.contents());
            let mut b = Bytes::from(data);
            XNBFile::new(&mut b);
        }
    }

    #[test]
    fn test_lzx() {
        // let mut data = Bytes::from_static(include_bytes!("data/misc/Bed.lzx"));


    }

    #[test]
    fn test_qoif() {
        // let d = decode_qoi(&mut Bytes::from_static(include_bytes!("../test3.qoif"))).unwrap();
        // d.save("test3.png").unwrap();
    }

    #[test]
    fn test_shader() {
        let fx = FXShader::from_bytes(&mut Bytes::from_static(include_bytes!("data/shader.dat")));
        println!("{:?}", fx);
    }

    // #[test]
    // fn test_msbind() {
    //     unsafe {
    //         println!("{:?}", mojoshader::changeset());
    //     }
    // }
}