use bytes::{Bytes, Buf};
use std::default::Default;
use std::hash::Hash;
use wasm_bindgen::prelude::*;
use crate::utils::{BufExt, FromBytes};

pub trait TypeDefFromBytes {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self;
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Vector2f {
    pub x: f32,
    pub y: f32
}

impl TypeDefFromBytes for Vector2f {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Vector2f {
            x: data.get_f32_le(),
            y: data.get_f32_le()
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Vector3f {
    pub x: f32,
    pub y: f32,
    pub z: f32
}

impl TypeDefFromBytes for Vector3f {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Vector3f {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Vector4f {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl TypeDefFromBytes for Vector4f {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Vector4f {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Quaternionf {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl TypeDefFromBytes for Quaternionf {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Quaternionf {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct ColorRGBA {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32
}

impl TypeDefFromBytes for ColorRGBA {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        ColorRGBA {
            r: data.get_f32_le(),
            g: data.get_f32_le(),
            b: data.get_f32_le(),
            a: data.get_f32_le()
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Matrix4x4f {
    #[wasm_bindgen(skip)]
    pub value: [[f32; 4]; 4]
}

impl TypeDefFromBytes for Matrix4x4f {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Matrix4x4f {
            value: [
                [
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le()
                ],
                [
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le()
                ],
                [
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le()
                ],
                [
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le(),
                    data.get_f32_le()
                ],
            ]
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct GUID {
    #[wasm_bindgen(skip)]
    pub value: [u8; 16]
}

impl TypeDefFromBytes for GUID {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        let d = &data.slice(0..16)[..];
        let mut v = [0u8; 16];
        v.copy_from_slice(d);
        let g = GUID { value: v };
        data.advance(16);
        g
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Hash128 {
    #[wasm_bindgen(skip)]
    pub value: [u8; 16]
}

impl TypeDefFromBytes for Hash128 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        let d = &data.slice(0..16)[..];
        let mut v = [0u8; 16];
        v.copy_from_slice(d);
        let h = Hash128 { value: v };
        data.advance(16);
        h
    }
}

#[derive(Debug, Default)]
pub struct TypelessData {
    pub length: u32,
    pub data: Bytes
}

impl TypeDefFromBytes for TypelessData {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        let len = data.get_u32_le() as usize;
        let val = data.slice(0..len);
        data.advance(len);
        TypelessData {length: len as u32, data: val }
    }
}

#[derive(Debug, Default)]
pub struct Pair<F, S> where F: TypeDefFromBytes, S: TypeDefFromBytes {
    pub first: F,
    pub second: S
}

impl<F, S> TypeDefFromBytes for Pair<F, S> where F: TypeDefFromBytes, S: TypeDefFromBytes {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Pair {
            first: F::from_bytes(data, ver),
            second: S::from_bytes(data, ver)
        }
    }
}

#[derive(Debug, Default)]
pub struct DeviceNone {

}

impl TypeDefFromBytes for DeviceNone {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        DeviceNone {}
    }
}

#[wasm_bindgen]
#[derive(Debug, Default)]
pub struct Object {

}

impl TypeDefFromBytes for Object {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        Object {}
    }
}

impl TypeDefFromBytes for bool {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_u8() != 0
    }
}

impl TypeDefFromBytes for i8 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_i8()
    }
}

impl TypeDefFromBytes for u8 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_u8()
    }
}

impl TypeDefFromBytes for i16 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_i16_le()
    }
}

impl TypeDefFromBytes for u16 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_u16_le()
    }
}

impl TypeDefFromBytes for i32 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_i32_le()
    }
}

impl TypeDefFromBytes for u32 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_u32_le()
    }
}

impl TypeDefFromBytes for f32 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_f32_le()
    }
}

impl TypeDefFromBytes for i64 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_i64_le()
    }
}

impl TypeDefFromBytes for u64 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_u64_le()
    }
}

impl TypeDefFromBytes for f64 {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_f64_le()
    }
}

impl TypeDefFromBytes for String {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        data.get_string()
    }
}

#[derive(Debug, Default)]
pub struct Map<K, V> where K: TypeDefFromBytes, V: TypeDefFromBytes {
    pub items: Vec<Pair<K, V>>
}

impl<K, V> TypeDefFromBytes for Map<K, V> where K: TypeDefFromBytes, V: TypeDefFromBytes {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        let num = data.get_u32_le();
        let mut v = Vec::<Pair<K, V>>::new();
        for _ in 0..num {
            v.push(Pair { first: K::from_bytes(data, ver), second: V::from_bytes(data, ver) });
        }
        Map { items: v }
    }
}

impl<T> TypeDefFromBytes for Vec<T> where T: TypeDefFromBytes {
    fn from_bytes(data: &mut Bytes, ver: u32) -> Self {
        let num = data.get_u32_le();
        let mut vec = Vec::<T>::new();
        for _ in 0..num {
            vec.push(T::from_bytes(data, ver));
        }
        vec
    }
}


