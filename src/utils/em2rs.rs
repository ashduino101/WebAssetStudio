// Used for MojoShader and Crunch bindings.

use js_sys::{ArrayBuffer, Function, Object, Reflect, Uint8Array, WebAssembly};
// use wasm_bindgen::__rt::IntoJsResult;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture};

pub struct EmscriptenModule {
    env: Object,
    instance: WebAssembly::Instance,
    exports: Object,
    _malloc: Function,
    _free: Function,
    _heap: Uint8Array
}

impl EmscriptenModule {
    pub async fn from_raw(data: &[u8]) -> Result<EmscriptenModule, JsValue> {
        let imports = Object::new();
        let env = Object::new();

        Reflect::set(&env, &"__assert_fail".into(), &Function::new_with_args(&"val", "")).unwrap();
        Reflect::set(&env, &"emscripten_asm_const_int".into(), &Function::new_with_args(&"code, sig, args", "")).unwrap();
        Reflect::set(&env, &"emscripten_memcpy_js".into(), &Function::new_with_args(&"val", "console.log('mcpyjs')")).unwrap();
        Reflect::set(&env, &"emscripten_memcpy_big".into(), &Function::new_with_args(&"val", "console.warn('UNIMPLEMENTED: memcpy_big')")).unwrap();
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

        let module = JsFuture::from(WebAssembly::instantiate_buffer(data, &imports)).await?;
        let instance: WebAssembly::Instance = Reflect::get(&module, &"instance".into())?.dyn_into()?;

        let exports = instance.exports();

        let memory = Reflect::get(exports.as_ref(), &"memory".into())?
            .dyn_into::<JsValue>()
            .expect("cannot load internal memory");
        let membuf: ArrayBuffer = Reflect::get(&memory, &"buffer".into())?.dyn_into()?;

        let heap = Uint8Array::new(&membuf);

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

        Ok(Self {
            env,
            instance,
            exports,
            _malloc: malloc,
            _free: free,
            _heap: heap
        })
    }

    pub fn bind(&mut self, method: &str) -> Result<Function, JsValue> {
        Reflect::get(self.exports.as_ref(), &method.into())?
            .dyn_into::<Function>()
    }

    pub fn malloc(&mut self, nbytes: usize) -> Result<u32, JsValue> {
        let addr = self._malloc.call1(&JsValue::undefined(), &JsValue::from(nbytes))?;
        Ok(addr.as_f64().unwrap() as u32)
    }

    pub fn free(&mut self, ptr: u32) {
        self._malloc.call1(&JsValue::undefined(), &JsValue::from(ptr));
    }
}
