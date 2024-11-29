use bytes::Bytes;
use js_sys::{ArrayBuffer, Function, Promise, Uint8Array};
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use web_sys::File;

pub async fn read_file(file: File) -> Result<Bytes, std::io::Error> {
    // FIXME: this is probably the easiest way to do this, but can we do it purely with web-sys?
    let func = Function::new_with_args("file", r#"
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onloadend = () => {
            resolve(new Uint8Array(reader.result));
        }
        reader.readAsArrayBuffer(file);
    });
    "#);
    let res = JsFuture::from(Promise::from(func.call1(&JsValue::undefined(), &file).unwrap())).await.unwrap();
    let buf = Uint8Array::from(res);
    Ok(buf.to_vec().into())
}