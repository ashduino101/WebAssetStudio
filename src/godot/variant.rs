use std::collections::HashMap;
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use crate::base::types::{Color128, IVector2, IVector3, IVector4, Matrix4x4, Plane, Quaternion, Rect2D, Vector2, Vector3, Vector4, AABB};
use crate::logger::info;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone)]
pub(crate) enum Object {
    Empty,
    ExternalResource { r#type: String, path: String },
    InternalResource(i32),
    ExternalResourceIndex(i32)
}

#[derive(Debug, Clone)]
pub(crate) enum Variant {
    Nil,
    Bool(bool),
    Int(i32),
    Float(f32),
    String(String),
    Vector2(Vector2),
    Rect2(Rect2D),
    Vector3(Vector3),
    Plane(Plane),
    Quaternion(Quaternion),
    AABB(AABB),
    Basis(Vector3, Vector3, Vector3),
    Transform3D { rows: (Vector3, Vector3, Vector3), origin: Vector3 },
    Transform2D(Vector2, Vector2, Vector2),
    Color(Color128),
    NodePath { names: Vec<String>, subnames: Vec<String>, absolute: bool },
    RID(i32),
    Object(Object),
    InputEvent,
    Dictionary(HashMap<String, Variant>),
    Array(Vec<Variant>),
    PackedByteArray(Bytes),
    PackedInt32Array(Vec<i32>),
    PackedFloat32Array(Vec<f32>),
    PackedStringArray(Vec<String>),
    PackedVector3Array(Vec<Vector3>),
    PackedColorArray(Vec<Color128>),
    PackedVector2Array(Vec<Vector2>),
    Int64(i64),
    Double(f64),
    Callable,  // ???
    Signal,  // ???
    StringName(String),
    IVector2(IVector2),
    IRect2 { position: IVector2, size: IVector2 },
    IVector3(IVector3),
    PackedInt64Array(Vec<i64>),
    PackedFloat64Array(Vec<f64>),
    Vector4(Vector4),
    IVector4(IVector4),
    Projection(Matrix4x4),
    PackedVector4Array(Vec<Vector4>)
}

pub(crate) fn get_string(data: &mut Bytes, string_table: &Vec<String>) -> Option<String> {
    let id = data.get_u32_le();
    if id & 0x80000000 != 0 {
        let len = id & 0x7fffffff;
        Some(data.get_chars(len as usize))
    } else {
        string_table.get(id as usize).map(|v| v.clone())
    }
}

impl Variant {
    fn get_id(&self) -> i32 {
        match self {
            Variant::Nil => 1,
            Variant::Bool(_) => 2,
            Variant::Int(_) => 3,
            Variant::Float(_) => 4,
            Variant::String(_) => 5,
            Variant::Vector2(_) => 10,
            Variant::Rect2(_) => 11,
            Variant::Vector3(_) => 12,
            Variant::Plane(_) => 13,
            Variant::Quaternion(_) => 14,
            Variant::AABB(_) => 15,
            Variant::Basis(_, _, _) => 16,
            Variant::Transform3D { .. } => 17,
            Variant::Transform2D(_, _, _) => 18,
            Variant::Color(_) => 20,
            Variant::NodePath { .. } => 22,
            Variant::RID(_) => 23,
            Variant::Object(_) => 24,
            Variant::InputEvent => 25,
            Variant::Dictionary(_) => 26,
            Variant::Array(_) => 30,
            Variant::PackedByteArray(_) => 31,
            Variant::PackedInt32Array(_) => 32,
            Variant::PackedFloat32Array(_) => 33,
            Variant::PackedStringArray(_) => 34,
            Variant::PackedVector3Array(_) => 35,
            Variant::PackedColorArray(_) => 36,
            Variant::PackedVector2Array(_) => 37,
            Variant::Int64(_) => 40,
            Variant::Double(_) => 41,
            Variant::Callable => 42,
            Variant::Signal => 43,
            Variant::StringName(_) => 44,
            Variant::IVector2(_) => 45,
            Variant::IRect2 { .. } => 46,
            Variant::IVector3(_) => 47,
            Variant::PackedInt64Array(_) => 48,
            Variant::PackedFloat64Array(_) => 49,
            Variant::Vector4(_) => 50,
            Variant::IVector4(_) => 51,
            Variant::Projection(_) => 52,
            Variant::PackedVector4Array(_) => 53
        }
    }

    pub(crate) fn from_bytes(data: &mut Bytes, format_version: i32, string_table: &Vec<String>) -> anyhow::Result<Variant> {
        Ok(match data.get_i32_le() {
            1 => { // Nil
                Variant::Nil
            },
            2 => { // Bool
                Variant::Bool(data.get_u32_le() != 0)
            },
            3 => { // Int
                Variant::Int(data.get_i32_le())
            },
            4 => { // Float
                Variant::Float(data.get_f32_le())
            },
            5 => { // String
                Variant::String(data.get_string())
            },
            10 => { // Vector2
                Variant::Vector2(Vector2::from_bytes(data))
            },
            11 => { // Rect2
                Variant::Rect2(Rect2D::from_bytes(data))
            },
            12 => { // Vector3
                Variant::Vector3(Vector3::from_bytes(data))
            },
            13 => { // Plane
                Variant::Plane(Plane::from_bytes(data))
            },
            14 => { // Quaternion
                Variant::Quaternion(Quaternion::from_bytes(data))
            },
            15 => { // AABB
                Variant::AABB(AABB::from_bytes(data))
            },
            16 => { // Basis
                Variant::Basis(
                    Vector3::from_bytes(data),
                    Vector3::from_bytes(data),
                    Vector3::from_bytes(data),
                )
            },
            17 => { // Transform3D
                Variant::Transform3D {
                    rows: (
                        Vector3::from_bytes(data),
                        Vector3::from_bytes(data),
                        Vector3::from_bytes(data)),
                    origin: Vector3::from_bytes(data),
                }

            },
            18 => { // Transform2D
                Variant::Transform2D(
                    Vector2::from_bytes(data),
                    Vector2::from_bytes(data),
                    Vector2::from_bytes(data))
            },
            20 => { // Color
                Variant::Color(Color128::from_bytes(data))
            },
            22 => { // NodePath
                let num_names = data.get_u16_le();
                let mut num_subnames = data.get_u16_le();
                let absolute = num_subnames & 0x8000 != 0;
                num_subnames &= 0x7fff;
                if format_version < 3 {  // FORMAT_VERSION_NO_NODEPATH_PROPERTY
                    num_subnames += 1;
                }
                let mut names = Vec::new();
                for _ in 0..num_names {
                    names.push(get_string(data, string_table).unwrap());
                }
                let mut subnames = Vec::new();
                for _ in 0..num_subnames {
                    subnames.push(get_string(data, string_table).unwrap());
                }
                Variant::NodePath {
                    names,
                    subnames,
                    absolute,
                }
            },
            23 => { // RID
                Variant::RID(data.get_i32_le())
            },
            24 => { // Object
                Variant::Object(match data.get_i32_le() {
                    0 => {  // Empty
                        Object::Empty
                    },
                    1 => {  // ExternalResource
                        Object::ExternalResource {
                            r#type: data.get_string(),
                            path: data.get_string(),
                        }
                    },
                    2 => {  // InternalResource
                        Object::InternalResource(data.get_i32_le())
                    },
                    3 => {  // ExternalResourceIndex
                        Object::ExternalResourceIndex(data.get_i32_le())
                    },
                    _ => Object::Empty
                })
            },
            25 => { // InputEvent
                Err(anyhow!("input event not supported"))?
                // Variant::InputEvent
            },
            26 => { // Dictionary
                let len = data.get_i32_le() & 0x7fffffff;
                let mut dict = HashMap::new();
                for _ in 0..len {
                    let key = Variant::from_bytes(data, format_version, string_table)?;
                    if let Variant::String(s) = key {
                        let value = Variant::from_bytes(data, format_version, string_table)?;
                        dict.insert(s, value);
                    } else {
                        return Err(anyhow!("dict keys must be strings"));
                    }
                }
                Variant::Dictionary(dict)
            },
            30 => { // Array
                let len = data.get_i32_le() & 0x7fffffff;
                let mut arr = Vec::new();
                for _ in 0..len {
                    arr.push(Variant::from_bytes(data, format_version, string_table)?);
                }
                Variant::Array(arr)
            },
            31 => { // PackedByteArray
                let len = data.get_u32_le() as usize;
                let val = data.slice(0..len);
                let extra = 4 - (len % 4);
                let pad = if extra < 4 { extra } else { 0 };
                data.advance(len + pad);
                Variant::PackedByteArray(val)
            },
            32 => { // PackedInt32Array
                Variant::PackedInt32Array(Vec::<i32>::from_bytes(data))
            },
            33 => { // PackedFloat32Array
                Variant::PackedFloat32Array(Vec::<f32>::from_bytes(data))
            },
            34 => { // PackedStringArray
                Variant::PackedStringArray(Vec::<String>::from_bytes(data))
            },
            35 => { // PackedVector3Array
                Variant::PackedVector3Array(Vec::<Vector3>::from_bytes(data))
            },
            36 => { // PackedColorArray
                Variant::PackedColorArray(Vec::<Color128>::from_bytes(data))
            },
            37 => { // PackedVector2Array
                Variant::PackedVector2Array(Vec::<Vector2>::from_bytes(data))
            },
            40 => { // Int64
                Variant::Int64(data.get_i64_le())
            },
            41 => { // Double
                Variant::Double(data.get_f64_le())
            },
            42 => { // Callable
                Err(anyhow!("callable not supported"))?
                // Variant::Callable
            },
            43 => { // Signal
                Err(anyhow!("signal not supported"))?
                // Variant::Signal
            },
            44 => { // StringName
                Variant::StringName(data.get_string())
            },
            45 => { // IVector2
                Variant::IVector2(IVector2::from_bytes(data))
            },
            46 => { // IRect2
                Variant::IRect2 {
                    position: IVector2::from_bytes(data),
                    size: IVector2::from_bytes(data),
                }
            },
            47 => { // IVector3
                Variant::IVector3(IVector3::from_bytes(data))
            },
            48 => { // PackedInt64Array
                Variant::PackedInt64Array(Vec::<i64>::from_bytes(data))
            },
            49 => { // PackedFloat64Array
                Variant::PackedFloat64Array(Vec::<f64>::from_bytes(data))
            },
            50 => { // Vector4
                Variant::Vector4(Vector4::from_bytes(data))
            },
            51 => { // IVector4
                Variant::IVector4(IVector4::from_bytes(data))
            },
            52 => { // Projection
                Variant::Projection(Matrix4x4::from_bytes(data))
            },
            53 => {  // PackedVector4Array
                Variant::PackedVector4Array(Vec::<Vector4>::from_bytes(data))
            },
            id => {
                Err(anyhow!("unknown variant type id {id}"))?
            }
        })
    }

    pub(crate) fn get(&self, prop: &str) -> Option<&Variant> {
        if let Variant::Dictionary(h) = self {
            h.get(prop)
        } else {
            None
        }
    }

    pub(crate) fn as_int32(&self) -> Option<i32> {
        if let Variant::Int(i) = self { Some(*i) } else { None }
    }

    pub(crate) fn as_float(&self) -> Option<f32> {
        if let Variant::Float(i) = self { Some(*i) } else { None }
    }

    pub(crate) fn as_double(&self) -> Option<f64> {
        if let Variant::Double(i) = self { Some(*i) } else { None }
    }

    pub(crate) fn as_int64(&self) -> Option<i64> {
        if let Variant::Int64(i) = self { Some(*i) } else { None }
    }

    pub(crate) fn as_bool(&self) -> Option<bool> {
        if let Variant::Bool(i) = self { Some(*i) } else { None }
    }

    pub(crate) fn as_byte_array(&self) -> Option<Bytes> {
        if let Variant::PackedByteArray(i) = self { Some(i.clone()) } else { None }
    }
}
