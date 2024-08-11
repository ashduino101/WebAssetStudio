use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use crate::directx::types::{SymbolClass, SymbolType};
use crate::errors::ParseError;

fn get_string(blob: &Bytes, offset: u32) -> String {
    if offset == 0 {
        return "".to_owned();
    }
    blob.slice(offset as usize..).get_string().trim_matches(char::from(0)).into()
}


#[derive(Debug, Clone)]
pub(crate) struct EffectState {
    type_: u32,
    value: EffectValue
}

impl EffectState {
    pub(crate) fn from_bytes(data: &mut Bytes, blob: &Bytes, objects: &mut Vec<EffectValue>) -> EffectState {
        let state_type = data.get_u32_le();
        data.get_u32_le();  // unknown
        let state_type_offset = data.get_u32_le();
        let state_value_offset = data.get_u32_le();

        let value = EffectValue::from_bytes(state_type_offset, state_value_offset, blob, objects);

        EffectState {
            type_: state_type,
            value
        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct Sampler {
    states: Vec<EffectState>
}


#[derive(Debug, Clone)]
pub(crate) enum EffectValueData {
    Sampler(Sampler),
    Matrix(Vec<Vec<f32>>),
    Data(Bytes),
    None,
    Unknown
}

/// An effect value, should be read from the blob data
#[derive(Debug, Clone)]
pub(crate) struct EffectValue {
    type_: SymbolType,
    value_class: SymbolClass,
    name: String,
    semantic: String,
    num_elements: u32,
    data: EffectValueData
}

impl EffectValue {
    pub(crate) fn from_bytes(type_offset: u32, value_offset: u32, blob: &Bytes, objects: &mut Vec<EffectValue>) -> EffectValue {
        let mut type_data = blob.slice(type_offset as usize..);
        let mut value_data = blob.slice(value_offset as usize..);
        let type_ = SymbolType::from_value(type_data.get_u32_le());
        let value_class = SymbolClass::from_value(type_data.get_u32_le());
        let name = get_string(blob, type_data.get_u32_le());
        let semantic = get_string(blob, type_data.get_u32_le());
        let num_elements = type_data.get_u32_le();

        let data = match value_class {
            SymbolClass::Scalar | SymbolClass::Vector |
            SymbolClass::MatrixRows | SymbolClass::MatrixColumns => {
                let column_count = type_data.get_u32_le();
                let row_count = type_data.get_u32_le();

                let mut matrix = Vec::new();
                for _ in 0..column_count {
                    let mut row = Vec::new();
                    for _ in 0..row_count {
                        row.push(value_data.get_f32_le());
                    }
                    matrix.push(row);
                }

                EffectValueData::Matrix(matrix)
            },
            SymbolClass::Object => {
                match type_ {
                    SymbolType::Sampler | SymbolType::Sampler1D |
                    SymbolType::Sampler2D | SymbolType::Sampler3D |
                    SymbolType::SamplerCube => {
                        let num_states = value_data.get_u32_le();

                        let mut states = Vec::new();
                        for _ in 0..num_states {
                            let state = EffectState::from_bytes(&mut value_data, blob, objects);
                            states.push(state);
                        }

                        EffectValueData::Sampler(Sampler {
                            states
                        })
                    },
                    _ => {
                        let num_objects = if num_elements == 0 { 1 } else { num_elements };

                        for _ in 0..num_objects {
                            objects[value_data.get_u32_le() as usize].type_ = type_;
                        }

                        // EffectValueData::Data(dat)
                        EffectValueData::None
                    }
                }
            },
            SymbolClass::Struct => {
                let num_members = type_data.get_u32_le();

                for _ in 0..num_members {
                    let param_type = type_data.get_u32_le();
                    let param_class = type_data.get_u32_le();
                    let member_name = get_string(blob, type_data.get_u32_le());

                    let elements = type_data.get_u32_le();
                    let columns = type_data.get_u32_le();
                    let rows = type_data.get_u32_le();
                }

                todo!()
            },
            _ => EffectValueData::Unknown
        };

        EffectValue {
            type_,
            value_class,
            name,
            semantic,
            num_elements,
            data
        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectAnnotation {
    value: EffectValue
}

impl EffectAnnotation {
    pub(crate) fn from_bytes(data: &mut Bytes, blob: &Bytes, objects: &mut Vec<EffectValue>) -> EffectAnnotation {
        let type_offset = data.get_u32_le();
        let value_offset = data.get_u32_le();
        EffectAnnotation {
            value: EffectValue::from_bytes(type_offset, value_offset, blob, objects)
        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectParam {
    value: EffectValue,
    flags: u32,
    annotations: Vec<EffectAnnotation>
}

impl EffectParam {
    pub(crate) fn from_bytes(data: &mut Bytes, blob: &Bytes, objects: &mut Vec<EffectValue>) -> Result<EffectParam, ParseError> {
        let value = EffectValue::from_bytes(data.get_u32_le(), data.get_u32_le(), blob, objects);
        let flags = data.get_u32_le();
        let num_annotations = data.get_u32_le();

        let mut annotations = Vec::new();
        for _ in 0..num_annotations {
            annotations.push(EffectAnnotation::from_bytes(data, blob, objects));
        }

        Ok(EffectParam {
            value,
            flags,
            annotations
        })
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectPass {
    name: String,
    annotations: Vec<EffectAnnotation>,
    states: Vec<EffectState>
}

impl EffectPass {
    pub(crate) fn from_bytes(data: &mut Bytes, blob: &Bytes, objects: &mut Vec<EffectValue>) -> EffectPass {
        let name = get_string(blob, data.get_u32_le());
        let num_annotations = data.get_u32_le();
        let num_states = data.get_u32_le();

        let mut annotations = Vec::new();
        for _ in 0..num_annotations {
            annotations.push(EffectAnnotation::from_bytes(data, blob, objects));
        }

        let mut states = Vec::new();
        for _ in 0..num_states {
            states.push(EffectState::from_bytes(data, blob, objects))
        }

        EffectPass {
            name,
            annotations,
            states
        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectTechnique {
    name: String,
    annotations: Vec<EffectAnnotation>,
    passes: Vec<EffectPass>
}

impl EffectTechnique {
    pub(crate) fn from_bytes(data: &mut Bytes, blob: &Bytes, objects: &mut Vec<EffectValue>) -> EffectTechnique {
        let name = get_string(blob, data.get_u32_le());
        let num_annotations = data.get_u32_le();
        let num_passes = data.get_u32_le();

        let mut annotations = Vec::new();
        for _ in 0..num_annotations {
            annotations.push(EffectAnnotation::from_bytes(data, blob, objects));
        }

        let mut passes = Vec::new();
        for _ in 0..num_passes {
            passes.push(EffectPass::from_bytes(data, blob, objects));
        }

        EffectTechnique {
            name,
            annotations,
            passes
        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectSmallObject {

}

impl EffectSmallObject {
    pub(crate) fn from_bytes(data: &mut Bytes, objects: &Vec<EffectValue>) -> EffectSmallObject {
        let index = data.get_u32_le();
        let length = data.get_u32_le() as usize;

        let dat = data.slice(0..length);
        data.advance(length);

        console_log!("{} {:?}", index, dat);

        EffectSmallObject {

        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct EffectLargeObject {

}

impl EffectLargeObject {
    pub(crate) fn from_bytes(data: &mut Bytes, objects: &Vec<EffectValue>) -> EffectLargeObject {
        let technique = data.get_i32_le();
        let index = data.get_u32_le();
        data.get_u32_le();  // FIXME: unknown
        let state = data.get_u32_le();
        let type_ = data.get_u32_le();
        let length = data.get_u32_le() as usize;

        let dat = data.slice(0..length);
        data.advance(length);

        console_log!("{} {} {} {} {:?}", technique, index, state, type_, dat);

        EffectLargeObject {

        }
    }
}


#[derive(Debug, Clone)]
pub(crate) struct FXEffect {
    params: Vec<EffectParam>,
    techniques: Vec<EffectTechnique>,
}

impl FXEffect {
    pub fn from_bytes(data: &mut Bytes) -> Result<FXEffect, ParseError> {
        let mut magic = data.get_u32_le();
        if magic == 0xbcf00bcf {  // XNA4 shader
            let xna_header_len = data.get_u32_le() - 8;
            data.advance(xna_header_len as usize);  // no idea, probably useless
            magic = data.get_u32_le();
        }
        if magic != 0xfeff0901 {  // DX 9.1 shader
            return Err(ParseError::new("Not a DirectX 9.1 shader"))
        }

        let blob_length = data.get_u32_le() as usize;
        let blob_data = data.slice(0..blob_length);
        data.advance(blob_length);

        let num_params = data.get_u32_le();
        let num_techniques = data.get_u32_le();
        data.get_u32_le();  // TODO: unknown
        let num_objects = data.get_u32_le();

        let mut objects = vec![EffectValue {
            type_: SymbolType::Invalid,
            value_class: SymbolClass::Invalid,
            name: "".to_string(),
            semantic: "".to_string(),
            num_elements: 0,
            data: EffectValueData::None
        }; num_objects as usize];

        // Parameters
        let mut params = Vec::new();
        for _ in 0..num_params {
            params.push(EffectParam::from_bytes(data, &blob_data, &mut objects)?)
        }

        // Techniques
        let mut techniques = Vec::new();
        for _ in 0..num_techniques {
            techniques.push(EffectTechnique::from_bytes(data, &blob_data, &mut objects))
        }

        let num_small_objects = data.get_u32_le();
        let num_large_objects = data.get_u32_le();

        let mut small_objects = Vec::new();
        for _ in 0..num_small_objects {
            small_objects.push(EffectSmallObject::from_bytes(data, &objects));
        }

        let mut large_objects = Vec::new();
        for _ in 0..num_large_objects {
            large_objects.push(EffectLargeObject::from_bytes(data, &objects));
        }

        console_log!("{} {:?}", objects.len(), objects);

        Ok(FXEffect {
            params,
            techniques
        })
    }
}
