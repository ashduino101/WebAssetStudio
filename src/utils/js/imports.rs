use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(module = "/src/utils/js/call.js")]
extern "C" {
    #[wasm_bindgen(catch)]
    pub fn call4(
        this: &js_sys::Function,
        context: &JsValue,
        arg1: &JsValue,
        arg2: &JsValue,
        arg3: &JsValue,
        arg4: &JsValue,
    ) -> Result<JsValue, JsValue>;
}