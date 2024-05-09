
use js_sys::{ArrayBuffer, DataView, Float32Array, Float64Array, Function, Int16Array, Int32Array, Int8Array, Object, Reflect, Uint16Array, Uint32Array, Uint8Array, WebAssembly};
// use wasm_bindgen::__rt::IntoJsResult;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture};

// #[wasm_bindgen]
// extern "C" {
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(a: &str);
// }
//
// macro_rules! console_log {
//     ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
// }

const WASM: &[u8] = include_bytes!("../../thirdparty/mojoshader/dxdisassemble.wasm");
const TEST: &[u8] = include_bytes!("../../test.fxc");

async fn load() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();

    let imports = Object::new();
    let env = Object::new();

    Reflect::set(&env, &"__assert_fail".into(), &Function::new_with_args(&"val", "")).unwrap();
    Reflect::set(&env, &"emscripten_asm_const_int".into(), &Function::new_with_args(&"code, sig, args", "")).unwrap();
    Reflect::set(&env, &"emscripten_memcpy_js".into(), &Function::new_with_args(&"val", "console.log('mcpyjs')")).unwrap();
    Reflect::set(&env, &"emscripten_memcpy_big".into(), &Function::new_with_args(&"val", "console.log('mcpy')")).unwrap();
    Reflect::set(&env, &"emscripten_resize_heap".into(), &Function::new_with_args(&"val", "console.log('rh')")).unwrap();
    Reflect::set(&env, &"STACKTOP".into(), &JsValue::from(0)).unwrap();
    Reflect::set(&env, &"STACK_MAX".into(), &JsValue::from(65536)).unwrap();
    Reflect::set(&env, &"abortStackOverflow".into(), &Function::new_with_args(&"val", "")).unwrap();
    Reflect::set(&env, &"memoryBase".into(), &JsValue::from(0)).unwrap();
    Reflect::set(&env, &"tableBase".into(), &JsValue::from(0)).unwrap();
    Reflect::set(&env, &"proc_exit".into(), &Function::new_with_args(&"val", "")).unwrap();
    Reflect::set(&env, &"fd_close".into(), &Function::new_with_args(&"val", "")).unwrap();
    Reflect::set(&env, &"fd_write".into(), &Function::new_with_args(&"val", "")).unwrap();
    Reflect::set(&env, &"fd_seek".into(), &Function::new_with_args(&"val", "")).unwrap();

    Reflect::set(&imports, &"env".into(), &env).unwrap();
    Reflect::set(&imports, &"wasi_snapshot_preview1".into(), &env).unwrap();

    let module = JsFuture::from(WebAssembly::instantiate_buffer(WASM, &imports)).await?;
    let instance: WebAssembly::Instance = Reflect::get(&module, &"instance".into())?.dyn_into()?;

    let exports = instance.exports();

    let do_parse = Reflect::get(exports.as_ref(), &"do_parse".into())?
        .dyn_into::<Function>()
        .expect("cannot load do_parse fn");

    let memory = Reflect::get(exports.as_ref(), &"memory".into())?
        .dyn_into::<JsValue>()
        .expect("cannot load memory");
    let membuf: ArrayBuffer = Reflect::get(&memory, &"buffer".into())?.dyn_into()?;

    let heap_u8 = Uint8Array::new(&membuf);
    let heap_i8 = Int8Array::new(&membuf);
    let heap_u16 = Uint16Array::new(&membuf);
    let heap_i16 = Int16Array::new(&membuf);
    let heap_u32 = Uint32Array::new(&membuf);
    let heap_i32 = Int32Array::new(&membuf);
    let heap_f32 = Float32Array::new(&membuf);
    let heap_f64 = Float64Array::new(&membuf);
    Function::new_with_args("data", "window.HEAPU8 = data;").call1(&JsValue::undefined(), &heap_u8);
    Function::new_with_args("data", "window.HEAP8 = data;").call1(&JsValue::undefined(), &heap_i8);
    Function::new_with_args("data", "window.HEAPU16 = data;").call1(&JsValue::undefined(), &heap_u16);
    Function::new_with_args("data", "window.HEAP16 = data;").call1(&JsValue::undefined(), &heap_i16);
    Function::new_with_args("data", "window.HEAPU32 = data;").call1(&JsValue::undefined(), &heap_u32);
    Function::new_with_args("data", "window.HEAP32 = data;").call1(&JsValue::undefined(), &heap_i32);
    Function::new_with_args("data", "window.HEAPF32 = data;").call1(&JsValue::undefined(), &heap_f32);
    Function::new_with_args("data", "window.HEAPF64 = data;").call1(&JsValue::undefined(), &heap_f64);

    let wasm_table = Reflect::get(exports.as_ref(), &"__indirect_function_table".into())?
        .dyn_into::<JsValue>()
        .expect("cannot load wasm table");

    let on_init = Reflect::get(exports.as_ref(), &"__wasm_call_ctors".into())?
        .dyn_into::<Function>()
        .expect("cannot load oninit function");

    let malloc = Reflect::get(exports.as_ref(), &"malloc".into())?
        .dyn_into::<Function>()
        .expect("cannot load malloc");

    let free = Reflect::get(exports.as_ref(), &"free".into())?
        .dyn_into::<Function>()
        .expect("cannot load free");

    on_init.call1(&JsValue::undefined(), &module);

    let prof = malloc.call1(&JsValue::undefined(), &JsValue::from(5)).unwrap();
    heap_u8.set(&Uint8Array::from(&[104u8, 108, 115, 108, 0][..]), unsafe {prof.as_f64().unwrap().to_int_unchecked()});
    let dat = malloc.call1(&JsValue::undefined(), &JsValue::from(TEST.len())).unwrap();
    let ua = Uint8Array::from(TEST);
    heap_u8.set(&ua, unsafe {dat.as_f64().unwrap().to_int_unchecked()});
    let res = do_parse.call3(&JsValue::undefined(), &dat, &JsValue::from(TEST.len()), &prof).unwrap();
    let res_ptr: u32 = unsafe {res.as_f64().unwrap().to_int_unchecked()};

    // console_log!("res {:?}", res_ptr);

    let view = DataView::new(&membuf.slice(res_ptr), 0, (256 * 65536 - res_ptr) as usize);
    let num_objects = view.get_uint32_endian(0, true);
    // console_log!("{}", num_objects);
    for i in 0..num_objects {
        let obj_ptr = view.get_uint32_endian((i * 4 + 4) as usize, true);
        // console_log!("{}", obj_ptr);
    }


    Ok(())
}

// #[wasm_bindgen(start)]
// fn run() {
//     spawn_local(async {
//         load().await.unwrap();
//     });
// }
