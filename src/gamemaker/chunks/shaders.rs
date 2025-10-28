use bytes::{Buf, Bytes};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export, Void};
use crate::gamemaker::common::{CString, GameMakerChunk, Ptr, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::studio::components::text_editor::get_ace;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone, Default)]
pub(crate) struct Shaders {
    pub(crate) shaders: Vec<Shader>
}

impl GameMakerChunk for Shaders {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        Shaders {
            shaders: {
                let n = data.get_u32_le();
                let mut v = Vec::new();
                for _ in 0..n {
                    let ptr = Ptr::<Void>::from_bytes(data);
                    v.push(Shader::from_bytes(ctx, &mut ctx.data().slice(ptr.ptr..)));
                }
                v
            }
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Shader {
    pub(crate) key: String,
    r#type: u32,
    vertex_es: String,
    fragment_es: String,
    vertex: String,
    fragment: String,
    vertex_hlsl9: String,
    pixel_hlsl9: String,
    vs_attributes: Vec<String>,
    vertex_hlsl11: Option<ShaderHLSL11>,
    pixel_hlsl11: Option<ShaderHLSL11>,
    vertex_pssl: Ptr<Void>,
    pixel_pssl: Ptr<Void>,
    vertex_pssl_size: u32,
    pixel_pssl_size: u32,
}

impl GameMakerChunk for Shader {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        let key = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let r#type = data.get_u32_le() & 0x7fffffff;
        let vertex_es = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let fragment_es = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let vertex = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let fragment = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let vertex_hlsl9 = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let pixel_hlsl9 = Ptr::<CString>::from_bytes(data).read_from(ctx).into_inner();
        let vertex_hlsl11 = Ptr::<Void>::from_bytes(data);
        let pixel_hlsl11 = Ptr::<Void>::from_bytes(data);
        let vs_attributes = PtrList::<CString>::from_bytes(data).read_all_from(ctx).iter().map(|s| s.clone().into_inner()).collect();
        let version = data.get_u32_le();
        let mut vertex_pssl = Ptr::default();
        let mut pixel_pssl = Ptr::default();
        let mut vertex_pssl_size = 0;
        let mut pixel_pssl_size = 0;
        if version >= 2 {
            vertex_pssl = Ptr::<Void>::from_bytes(data);
            vertex_pssl_size = data.get_u32_le();
            pixel_pssl = Ptr::<Void>::from_bytes(data);
            pixel_pssl_size = data.get_u32_le();
        }
        let mut vertex_hlsl11_data = None;
        if vertex_hlsl11.ptr != 0 {
            vertex_hlsl11_data = Some(ShaderHLSL11::from_bytes(&mut ctx.data().slice(vertex_hlsl11.ptr..)));
        }
        let mut pixel_hlsl11_data = None;
        if pixel_hlsl11.ptr != 0 {
            pixel_hlsl11_data = Some(ShaderHLSL11::from_bytes(&mut ctx.data().slice(pixel_hlsl11.ptr..)));
        }
        Shader {
            key,
            r#type,
            vertex_es,
            fragment_es,
            vertex,
            fragment,
            vertex_hlsl9,
            pixel_hlsl9,
            vs_attributes,
            vertex_hlsl11: vertex_hlsl11_data,
            pixel_hlsl11: pixel_hlsl11_data,
            vertex_pssl,
            pixel_pssl,
            vertex_pssl_size,
            pixel_pssl_size,
        }
    }
}

impl Asset for Shader {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        let container = doc.create_element("div").unwrap();
        container.set_id("shader-src");
        parent.append_child(&container).unwrap();
        let ace = get_ace();
        let editor = ace.edit("shader-src");
        editor.set_mode("ace/mode/glsl");
        editor.set_theme("ace/theme/tomorrow_night");
        editor.set_value(&format!("// -- BEGIN VERTEX SHADER --\n\n{}\n\n// -- BEGIN FRAGMENT SHADER --\n\n{}\n", self.vertex, self.fragment));
        editor.set_readonly(true);
        editor.select_none();
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ShaderHLSL11 {
    constant_buffers: Vec<ConstantBuffer>,
    variables: Vec<Variable>,
    inputs: Vec<Input>,
    samplers: Vec<Sampler>,
    textures: Vec<Texture>,
    shader: Bytes
}

impl FromBytes for ShaderHLSL11 {
    fn from_bytes(data: &mut Bytes) -> Self {
        let buf = data.clone();
        let version = data.get_i32_le();
        let num_constant_buffers = data.get_i32_le();
        let num_variables = data.get_i32_le();
        let num_samplers = data.get_i32_le();
        let num_textures = data.get_i32_le();
        let num_inputs = data.get_i32_le();
        let shader_size = data.get_i32_le();
        let constant_buffers_ptr = data.get_i32_le();
        let variables_ptr = data.get_i32_le();
        let samplers_ptr = data.get_i32_le();
        let textures_ptr = data.get_i32_le();
        let inputs_ptr = data.get_i32_le();
        let shader_ptr = data.get_i32_le();

        let mut constant_buffers = Vec::new();
        let mut d = buf.slice(constant_buffers_ptr as usize..);
        for _ in 0..num_constant_buffers {
            constant_buffers.push(ConstantBuffer::from_bytes(&mut d));
        }
        let mut variables = Vec::new();
        let mut d = buf.slice(variables_ptr as usize..);
        for _ in 0..num_variables {
            variables.push(Variable::from_bytes(&mut d));
        }
        let mut inputs = Vec::new();
        let mut d = buf.slice(inputs_ptr as usize..);
        for _ in 0..num_inputs {
            inputs.push(Input::from_bytes(&mut d));
        }
        let mut samplers = Vec::new();
        let mut d = buf.slice(samplers_ptr as usize..);
        for _ in 0..num_samplers {
            samplers.push(Sampler::from_bytes(&mut d));
        }
        let mut textures = Vec::new();
        let mut d = buf.slice(textures_ptr as usize..);
        for _ in 0..num_textures {
            textures.push(Texture::from_bytes(&mut d));
        }

        let shader_code = buf.slice(shader_ptr as usize..(shader_ptr + shader_size) as usize);

        ShaderHLSL11 {
            constant_buffers,
            variables,
            inputs,
            samplers,
            textures,
            shader: shader_code,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ConstantBuffer {
    name_ptr: i32,
    bind_point: i32,
    bind_count: i32,
    variables: i32,
    size: i32,
}

impl FromBytes for ConstantBuffer {
    fn from_bytes(data: &mut Bytes) -> Self {
        ConstantBuffer {
            name_ptr: data.get_i32_le(),
            bind_point: data.get_i32_le(),
            bind_count: data.get_i32_le(),
            variables: data.get_i32_le(),
            size: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Variable {
    name_ptr: i32,
    semantic_index: i32,
    offset: i32,
    size: i32,
    r#type: VarType,
    columns: i32,
    rows: i32,
    elements: i32
}

impl FromBytes for Variable {
    fn from_bytes(data: &mut Bytes) -> Self {
        Variable {
            name_ptr: data.get_i32_le(),
            semantic_index: data.get_i32_le(),
            offset: data.get_i32_le(),
            size: data.get_i32_le(),
            r#type: VarType::from_bytes(data),
            columns: data.get_i32_le(),
            rows: data.get_i32_le(),
            elements: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) enum VarType {
    #[default]
    Void,
    Bool,
    Int,
    Uint,
    Byte,
    Float,
    Double
}

impl FromBytes for VarType {
    fn from_bytes(data: &mut Bytes) -> Self {
        let val = data.get_i32_le();
        match val {
            1 => VarType::Bool,
            2 => VarType::Int,
            3 => VarType::Uint,
            4 => VarType::Byte,
            5 => VarType::Float,
            6 => VarType::Double,
            _ => VarType::Void,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Input {
    name_ptr: i32,
    semantic_index: i32,
    register: i32,
    r#type: VarType,
    mask: i32
}

impl FromBytes for Input {
    fn from_bytes(data: &mut Bytes) -> Self {
        Input {
            name_ptr: data.get_i32_le(),
            semantic_index: data.get_i32_le(),
            register: data.get_i32_le(),
            r#type: VarType::from_bytes(data),
            mask: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Sampler {
    name_ptr: i32,
    bind_point: i32,
    bind_count: i32
}

impl FromBytes for Sampler {
    fn from_bytes(data: &mut Bytes) -> Self {
        Sampler {
            name_ptr: data.get_i32_le(),
            bind_point: data.get_i32_le(),
            bind_count: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Texture {
    name_ptr: i32,
    bind_point: i32,
    bind_count: i32,
}

impl FromBytes for Texture {
    fn from_bytes(data: &mut Bytes) -> Self {
        Texture {
            name_ptr: data.get_i32_le(),
            bind_point: data.get_i32_le(),
            bind_count: data.get_i32_le(),
        }
    }
}