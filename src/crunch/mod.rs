/// Crunch WASM module bindings
/// TODO: rewrite this purely in Rust
use crate::logger::info;
use crate::utils::dom::create_data_url;
use crate::utils::time::now;
use bytes::{Buf, Bytes};
use js_sys::{Function, Promise, Reflect, Uint8Array};
use std::{include_bytes, include_str, format};
use anyhow::bail;
use lzma_rs::xz_decompress;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use wasm_bindgen_test::console_log;
use web_sys::window;
use crate::utils::js::imports::call4;

const WASM_XZ: &[u8] = include_bytes!("crunch_native.wasm.xz");
const JS: &str = include_str!("crunch_native.js");

pub struct CrunchLib {
    module: JsValue
}

impl CrunchLib {
    pub(crate) fn get() -> anyhow::Result<CrunchLib> {
        let cached_crnlib = Reflect::get(&window().unwrap(), &JsValue::from("__cached_crnlib")).unwrap();
        if !cached_crnlib.is_undefined() {
            return Ok(CrunchLib { module: cached_crnlib })
        }
        bail!("crunch has not been initialized")
    }

    pub(crate) async fn load() -> CrunchLib {
        let start = now();

        let mut res = Vec::new();
        xz_decompress(&mut WASM_XZ, &mut res).unwrap();
        let data_url = create_data_url(&res[..], "application/wasm");
        // replace the path in our js module
        let js = JS.replace("crunch_native.wasm", &format!("{data_url}"));
        let func = Function::new_no_args(&format!("{};return loadCrunch()", js));
        let module = JsFuture::from(Promise::from(func.call0(&JsValue::undefined()).unwrap())).await.unwrap();
        Reflect::set(&window().unwrap(), &JsValue::from("__cached_crnlib"), &module).unwrap();

        let elapsed = now() - start;
        info!("Loaded Crunch native library in {}ms", elapsed);
        CrunchLib { module }
    }

    fn get_objects(&self) -> (Function, Function, Uint8Array) {
        let malloc = Function::from(Reflect::get(&self.module, &JsValue::from_str("_malloc")).unwrap());
        let free = Function::from(Reflect::get(&self.module, &JsValue::from_str("_free")).unwrap());
        let heap = Uint8Array::from(Reflect::get(&self.module, &JsValue::from_str("HEAPU8")).unwrap());
        (malloc, free, heap)
    }

    fn unpack_crunch_generic(&self, data: &[u8], func: Function) -> Vec<u8> {
        let (malloc, free, heap) = self.get_objects();

        let result_ptr_ptr = malloc
            .call1(&JsValue::undefined(), &JsValue::from(4))
            .unwrap();  // 4-byte ptr
        let result_len_ptr = malloc
            .call1(&JsValue::undefined(), &JsValue::from(4))
            .unwrap();  // 4-byte ptr

        let data_ptr = malloc
            .call1(&JsValue::undefined(), &JsValue::from(data.len()))
            .unwrap();
        heap.set(&Uint8Array::from(data), data_ptr.as_f64().unwrap() as u32);

        call4(&func, &JsValue::undefined(), &data_ptr, &JsValue::from(data.len()), &result_ptr_ptr, &result_len_ptr).unwrap();

        let result_ptr_ptr = result_ptr_ptr.as_f64().unwrap() as u32;
        let result_len_ptr = result_len_ptr.as_f64().unwrap() as u32;
        let result_ptr = Bytes::from(heap.slice(result_ptr_ptr, result_ptr_ptr + 4).to_vec()).get_u32_le();
        let result_len_ptr_value = Bytes::from(heap.slice(result_len_ptr, result_len_ptr + 4).to_vec()).get_u32_le();
        let result_len = Bytes::from(heap.slice(result_len_ptr_value, result_len_ptr_value + 4).to_vec()).get_u32_le();
        let res = heap.slice(result_ptr, result_ptr + result_len).to_vec();

        free.call1(&JsValue::undefined(), &JsValue::from(data_ptr)).unwrap();

        free.call1(&JsValue::undefined(), &JsValue::from(result_ptr_ptr)).unwrap();
        free.call1(&JsValue::undefined(), &JsValue::from(result_len_ptr)).unwrap();
        free.call1(&JsValue::undefined(), &JsValue::from(result_ptr)).unwrap();

        res
    }

    pub fn unpack_crunch(&self, data: &[u8]) -> Vec<u8> {
        self.unpack_crunch_generic(data, Function::from(Reflect::get(&self.module, &JsValue::from_str("_UnpackCrunch")).unwrap()))
    }

    pub fn unpack_unity_crunch(&self, data: &[u8]) -> Vec<u8> {
        self.unpack_crunch_generic(data, Function::from(Reflect::get(&self.module, &JsValue::from_str("_UnpackUnityCrunch")).unwrap()))
    }
}
