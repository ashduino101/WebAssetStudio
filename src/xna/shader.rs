use std::sync::{Mutex, OnceLock};
use js_sys::{ArrayBuffer, DataView, Float32Array, Float64Array, Function, Int16Array, Int32Array, Int8Array, Object, Reflect, Uint16Array, Uint32Array, Uint8Array, WebAssembly};
use lzma_rs::xz_decompress;
use serde_derive::Deserialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture};
use wasm_bindgen_test::console_log;
use crate::logger::info;
use crate::utils::dom::create_data_url;
use crate::utils::time::now;
// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(a: &str);
// }
//
// macro_rules! console_log {
//     ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
// }

const WASM_XZ: &[u8] = include_bytes!("mojoshader.wasm.xz");
const JS: &str = include_str!("mojoshader.js");

// #[derive(Deserialize)]
// pub struct ParseError {
//     error: String,
//     position: i32,
//     filename: String
// }
//
// #[derive(Deserialize)]
// pub struct EffectState {
//     r#type: i32,
//     value: EffectValue
// }
//
// #[derive(Deserialize)]
// pub struct EffectPass {
//     name: String,
//     states: Vec<EffectState>,
//     annotations: Vec<EffectValue>
// }
//
// #[derive(Deserialize)]
// pub struct EffectTechnique {
//     name: String,
//     passes: Vec<EffectPass>,
//     annotations: Vec<EffectValue>
// }
//
// #[derive(Deserialize)]
// pub struct ShaderObject {
//     is_preshader: bool,
//     technique: u32,
//     pass: u32,
//     preshader: Option<Preshader>,
//     shader: Option<Shader>
// }
//
// #[derive(Deserialize)]
// #[serde(tag = "type", rename_all = "lowercase")]
// pub enum EffectObject {
//     Void {},
//     Bool { value: bool },
//     Int { value: i32 },
//     Float { value: f32 },
//     String { value: String },
//     Texture {},
//     Texture1D {},
//     Texture2D {},
//     Texture3D {},
//     TextureCube {},
//     Sampler {},
//     Sampler1D {},
//     Sampler2D {},
//     Sampler3D {},
//     SamplerCube {},
//     PixelShader { value: ShaderObject },
//     VertexShader { value: ShaderObject },
// }
//
// #[derive(Deserialize)]
// pub struct EffectParam {
//     value: EffectValue,
//     annotations: Vec<EffectValue>
// }
//
// #[derive(Deserialize)]
// pub struct EffectValue {
//     name: String,
//     semantic: String,
//     r#type: TypeInfo,
//     num_values: i32,
//     values: Vec<EffectValueData>
// }
//
// #[derive(Deserialize)]
// pub struct Effect {
//     objects: Vec<EffectObject>,
//     params: Vec<EffectParam>,
//     techniques: Vec<EffectTechnique>,
//     errors: Vec<ParseError>
// }

pub struct MojoShader {
    module: JsValue
}

impl MojoShader {
    pub fn parse(&self, shader: &[u8], profile: &str) -> String {
        let malloc = Function::from(Reflect::get(&self.module, &JsValue::from_str("_malloc")).unwrap());
        let free = Function::from(Reflect::get(&self.module, &JsValue::from_str("_free")).unwrap());
        let parse = Function::from(Reflect::get(&self.module, &JsValue::from_str("_parse")).unwrap());
        let heap = Uint8Array::from(Reflect::get(&self.module, &JsValue::from_str("HEAPU8")).unwrap());

        let profile_ptr = malloc
            .call1(&JsValue::undefined(), &JsValue::from(profile.len() + 1))
            .unwrap();
        let profile_ptr_u32 = profile_ptr.as_f64().unwrap() as u32;
        heap.set_index(profile_ptr_u32 + (profile.len() as u32), 0);
        let mut i = 0;
        for c in profile.chars() {
            heap.set_index(profile_ptr_u32 + i, c as u8);
            i += 1;
        }
        let data_ptr = malloc
            .call1(&JsValue::undefined(), &JsValue::from(shader.len()))
            .unwrap();
        heap.set(&Uint8Array::from(shader), data_ptr.as_f64().unwrap() as u32);

        let ptr = parse.call3(&JsValue::undefined(), &data_ptr, &JsValue::from(shader.len()), &profile_ptr).unwrap().as_f64().unwrap() as u32;
        let mut s = "".to_owned();
        let mut b = 0xff;
        let mut i = 0;
        loop {
            b = heap.get_index(ptr + i);
            if b == 0 {
                break;
            }
            s.push(char::from(b));
            i += 1;
        }

        s
  //       let shader_arr = Uint8Array::from(shader);
  //       let func = Function::new_with_args("Module, shader, profile", r#"
  // function setCharPtr(str) {
  //   let dat = new TextEncoder().encode(str);
  //   let mem = Module._malloc(dat.length + 1);
  //   for (let i = 0; i < dat.length; i++) {
  //     Module.HEAPU8[mem + i] = dat[i];
  //   }
  //   Module.HEAPU8[mem + dat.length] = 0;
  //   return mem;
  // }
  // function setDataPtr(data) {
  //   let mem = Module._malloc(data.length);
  //   Module.HEAPU8.set(data, mem);
  //   return mem;
  // }
  // function getCharPtr(ptr) {
  //   if (ptr === 0) {
  //     return null;
  //   }
  //   let i = 0;
  //   let b = 0xff;
  //   let r = '';
  //   while (b !== 0) {
  //     b = Module.HEAPU8[ptr + i];
  //     if (b !== 0) {
  //       r += String.fromCharCode(b);
  //     }
  //     i++;
  //   }
  //   return r;
  // }
  //     let prof = setCharPtr(profile);
  //     let buf = setDataPtr(shader);
  //     console.log('args:', buf, shader.length, prof);
  //     let res = Module._parse(buf, shader.length, prof);
  //     if (res != 0) {
  //       console.log(JSON.parse(getCharPtr(res)));
  //     }
  //       "#);
  //       func.call3(&JsValue::undefined(), &self.module, &shader_arr, &JsValue::from_str(profile)).unwrap();
    }
}

pub fn get_mojoshader() -> MojoShader {
    let start = now();
    let mut res = Vec::new();
    xz_decompress(&mut WASM_XZ, &mut res).unwrap();
    let data_url = create_data_url(&res[..], "application/wasm");
    // replace the path in our js module
    let js = JS.replace("\"mojoshader.wasm\"", &format!("\"{data_url}\""));
    let func = Function::new_no_args(&format!("{};return Module;", js));
    let module = func.call0(&JsValue::undefined()).unwrap();

    let module = MojoShader { module };

    let elapsed = now() - start;
    info!("Loaded MojoShader in {} ms", elapsed);
    module
}

// const TEST: &[u8] = include_bytes!("../../test.fx");
//
// async fn load() -> Result<(), JsValue> {
//     console_error_panic_hook::set_once();
//
//     let imports = Object::new();
//     let env = Object::new();
//
//     Reflect::set(&env, &"__assert_fail".into(), &Function::new_with_args(&"val", "")).unwrap();
//     Reflect::set(&env, &"emscripten_asm_const_int".into(), &Function::new_with_args(&"code, sig, args", "")).unwrap();
//     Reflect::set(&env, &"emscripten_memcpy_js".into(), &Function::new_with_args(&"val", "console.log('mcpyjs')")).unwrap();
//     Reflect::set(&env, &"emscripten_memcpy_big".into(), &Function::new_with_args(&"val", "console.log('mcpy')")).unwrap();
//     Reflect::set(&env, &"emscripten_resize_heap".into(), &Function::new_with_args(&"val", "console.log('rh')")).unwrap();
//     Reflect::set(&env, &"STACKTOP".into(), &JsValue::from(0)).unwrap();
//     Reflect::set(&env, &"STACK_MAX".into(), &JsValue::from(65536)).unwrap();
//     Reflect::set(&env, &"abortStackOverflow".into(), &Function::new_with_args(&"val", "")).unwrap();
//     Reflect::set(&env, &"memoryBase".into(), &JsValue::from(0)).unwrap();
//     Reflect::set(&env, &"tableBase".into(), &JsValue::from(0)).unwrap();
//     Reflect::set(&env, &"proc_exit".into(), &Function::new_with_args(&"val", "")).unwrap();
//     Reflect::set(&env, &"fd_close".into(), &Function::new_with_args(&"val", "")).unwrap();
//     Reflect::set(&env, &"fd_write".into(), &Function::new_with_args(&"val", "")).unwrap();
//     Reflect::set(&env, &"fd_seek".into(), &Function::new_with_args(&"val", "")).unwrap();
//
//     Reflect::set(&imports, &"env".into(), &env).unwrap();
//     Reflect::set(&imports, &"wasi_snapshot_preview1".into(), &env).unwrap();
//
//     let module = JsFuture::from(WebAssembly::instantiate_buffer(WASM, &imports)).await?;
//     let instance: WebAssembly::Instance = Reflect::get(&module, &"instance".into())?.dyn_into()?;
//
//     let exports = instance.exports();
//
//     let do_parse = Reflect::get(exports.as_ref(), &"do_parse".into())?
//         .dyn_into::<Function>()
//         .expect("cannot load do_parse fn");
//
//     let memory = Reflect::get(exports.as_ref(), &"memory".into())?
//         .dyn_into::<JsValue>()
//         .expect("cannot load memory");
//     let membuf: ArrayBuffer = Reflect::get(&memory, &"buffer".into())?.dyn_into()?;
//
//     let heap_u8 = Uint8Array::new(&membuf);
//     let heap_i8 = Int8Array::new(&membuf);
//     let heap_u16 = Uint16Array::new(&membuf);
//     let heap_i16 = Int16Array::new(&membuf);
//     let heap_u32 = Uint32Array::new(&membuf);
//     let heap_i32 = Int32Array::new(&membuf);
//     let heap_f32 = Float32Array::new(&membuf);
//     let heap_f64 = Float64Array::new(&membuf);
//     Function::new_with_args("data", "window.HEAPU8 = data;").call1(&JsValue::undefined(), &heap_u8).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAP8 = data;").call1(&JsValue::undefined(), &heap_i8).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAPU16 = data;").call1(&JsValue::undefined(), &heap_u16).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAP16 = data;").call1(&JsValue::undefined(), &heap_i16).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAPU32 = data;").call1(&JsValue::undefined(), &heap_u32).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAP32 = data;").call1(&JsValue::undefined(), &heap_i32).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAPF32 = data;").call1(&JsValue::undefined(), &heap_f32).expect("heap constructor");
//     Function::new_with_args("data", "window.HEAPF64 = data;").call1(&JsValue::undefined(), &heap_f64).expect("heap constructor");
//
//     let wasm_table = Reflect::get(exports.as_ref(), &"__indirect_function_table".into())?
//         .dyn_into::<JsValue>()
//         .expect("cannot load wasm table");
//
//     let on_init = Reflect::get(exports.as_ref(), &"__wasm_call_ctors".into())?
//         .dyn_into::<Function>()
//         .expect("cannot load oninit function");
//
//     let malloc = Reflect::get(exports.as_ref(), &"malloc".into())?
//         .dyn_into::<Function>()
//         .expect("cannot load malloc");
//
//     let free = Reflect::get(exports.as_ref(), &"free".into())?
//         .dyn_into::<Function>()
//         .expect("cannot load free");
//
//     on_init.call1(&JsValue::undefined(), &module).expect("init call");
//
//     let prof = malloc.call1(&JsValue::undefined(), &JsValue::from(5)).unwrap();
//     heap_u8.set(&Uint8Array::from(&[104u8, 108, 115, 108, 0][..]), unsafe {prof.as_f64().unwrap().to_int_unchecked()});
//     let dat = malloc.call1(&JsValue::undefined(), &JsValue::from(TEST.len())).unwrap();
//     let ua = Uint8Array::from(TEST);
//     heap_u8.set(&ua, unsafe {dat.as_f64().unwrap().to_int_unchecked()});
//     let res = do_parse.call3(&JsValue::undefined(), &dat, &JsValue::from(TEST.len()), &prof).unwrap();
//     let res_ptr: u32 = unsafe {res.as_f64().unwrap().to_int_unchecked()};
//
//     // console_log!("res {:?}", res_ptr);
//
//     let view = DataView::new(&membuf.slice(res_ptr), 0, (256 * 65536 - res_ptr) as usize);
//     let num_objects = view.get_uint32_endian(0, true);
//     // console_log!("{}", num_objects);
//     for i in 0..num_objects {
//         let obj_ptr = view.get_uint32_endian((i * 4 + 4) as usize, true);
//         // console_log!("{}", obj_ptr);
//     }
//
//
//     Ok(())
// }

// #[wasm_bindgen(start)]
// fn run() {
//     spawn_local(async {
//         load().await.unwrap();
//     });
// }
