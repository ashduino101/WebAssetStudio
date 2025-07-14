// Common types used in multiple formats

use std::fmt::{Debug, Display, Formatter, Write};
use bytes::{Buf, Bytes};
use crate::base::asset::SimpleDisplayableAsset;
use crate::utils::buf::FromBytes;

#[derive(Debug, Copy, Clone)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32
}

impl Display for Vector2 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector2({}, {})", self.x, self.y))
    }
}

impl SimpleDisplayableAsset for Vector2 {}

impl FromBytes for Vector2 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32
}

impl Display for Vector3 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector3({}, {}, {})", self.x, self.y, self.z))
    }
}

impl SimpleDisplayableAsset for Vector3 {}

impl FromBytes for Vector3 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
        }
    }
}


#[derive(Debug, Copy, Clone)]
pub struct Vector4 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Display for Vector4 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector4({}, {}, {}, {})", self.x, self.y, self.z, self.w))
    }
}

impl SimpleDisplayableAsset for Vector4 {}

impl FromBytes for Vector4 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct MatrixRow {
    pub val1: f32,
    pub val2: f32,
    pub val3: f32,
    pub val4: f32
}

impl Display for MatrixRow {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("[{}, {}, {}, {}]", self.val1, self.val2, self.val3, self.val4))
    }
}

impl SimpleDisplayableAsset for MatrixRow {}

impl FromBytes for MatrixRow {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            val1: data.get_f32_le(),
            val2: data.get_f32_le(),
            val3: data.get_f32_le(),
            val4: data.get_f32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Matrix4x4 {
    pub row1: MatrixRow,
    pub row2: MatrixRow,
    pub row3: MatrixRow,
    pub row4: MatrixRow
}

impl Display for Matrix4x4 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("[{}, {}, {}, {}]", self.row1, self.row2, self.row3, self.row4))
    }
}

impl SimpleDisplayableAsset for Matrix4x4 {}

impl FromBytes for Matrix4x4 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            row1: MatrixRow::from_bytes(data),
            row2: MatrixRow::from_bytes(data),
            row3: MatrixRow::from_bytes(data),
            row4: MatrixRow::from_bytes(data),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Quaternion {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Display for Quaternion {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Quaternion({}, {}, {}, {})", self.x, self.y, self.z, self.w))
    }
}

impl SimpleDisplayableAsset for Quaternion {}

impl FromBytes for Quaternion {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Color32 {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
    pub alpha: u8
}

impl Display for Color32 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Rgba({}, {}, {}, {})", self.red, self.green, self.blue, self.alpha))
    }
}

impl SimpleDisplayableAsset for Color32 {}

impl FromBytes for Color32 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            red: data.get_u8(),
            green: data.get_u8(),
            blue: data.get_u8(),
            alpha: data.get_u8(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Color128 {
    pub red: f32,
    pub green: f32,
    pub blue: f32,
    pub alpha: f32
}

impl Display for Color128 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Rgba({}, {}, {}, {})", self.red, self.green, self.blue, self.alpha))
    }
}

impl SimpleDisplayableAsset for Color128 {}

impl FromBytes for Color128 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            red: data.get_f32(),
            green: data.get_f32(),
            blue: data.get_f32(),
            alpha: data.get_f32(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Plane {
    pub normal: Vector3,
    pub d: f32
}

impl Display for Plane {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Plane({}, {})", self.normal, self.d))
    }
}

impl SimpleDisplayableAsset for Plane {}

impl FromBytes for Plane {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            normal: Vector3::from_bytes(data),
            d: data.get_f32_le()
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct Rect2D {
    pub position: Vector2,
    pub size: Vector2
}

impl Display for Rect2D {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("Rect2D({}, {})", self.position, self.size))
    }
}

impl SimpleDisplayableAsset for Rect2D {}

impl FromBytes for Rect2D {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            position: Vector2::from_bytes(data),
            size: Vector2::from_bytes(data),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct AABB {
    pub position: Vector3,
    pub size: Vector3
}

impl Display for AABB {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&*format!("AABB({}, {})", self.position, self.size))
    }
}

impl SimpleDisplayableAsset for AABB {}

impl FromBytes for AABB {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            position: Vector3::from_bytes(data),
            size: Vector3::from_bytes(data),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct IVector2 {
    pub x: i32,
    pub y: i32
}

impl Display for IVector2 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector2i({}, {})", self.x, self.y))
    }
}

impl SimpleDisplayableAsset for IVector2 {}

impl FromBytes for IVector2 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_i32_le(),
            y: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct IVector3 {
    pub x: i32,
    pub y: i32,
    pub z: i32
}

impl Display for IVector3 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector3i({}, {}, {})", self.x, self.y, self.z))
    }
}

impl SimpleDisplayableAsset for IVector3 {}

impl FromBytes for IVector3 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_i32_le(),
            y: data.get_i32_le(),
            z: data.get_i32_le(),
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub struct IVector4 {
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub w: i32
}

impl Display for IVector4 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&format!("Vector4i({}, {}, {}, {})", self.x, self.y, self.z, self.w))
    }
}

impl SimpleDisplayableAsset for IVector4 {}

impl FromBytes for IVector4 {
    fn from_bytes(data: &mut Bytes) -> Self {
        Self {
            x: data.get_i32_le(),
            y: data.get_i32_le(),
            z: data.get_i32_le(),
            w: data.get_i32_le(),
        }
    }
}
