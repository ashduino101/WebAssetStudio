use crate::logger::info;
use crate::utils::dom::create_data_url;
use crate::utils::time::now;
use js_sys::{Function, Reflect, Uint8Array};
use lzma_rs::xz_decompress;
use wasm_bindgen::prelude::*;

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
