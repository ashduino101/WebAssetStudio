use bytes::{Buf, Bytes};
use crate::base::asset::{Void};
use crate::base::types::{Matrix4x4, MatrixRow, Quaternion, Vector2, Vector3, Vector4};
use crate::xna::type_base::XNBType;

// For empty/unknown assets
impl XNBType for Void {
    fn from_bytes(data: &mut Bytes) -> Self where Self: Sized {
        Void {}
    }
}

impl XNBType for Vector2 {
    fn from_bytes(data: &mut Bytes) -> Vector2 {
        Vector2 {
            x: data.get_f32_le(),
            y: data.get_f32_le()
        }
    }
}

impl XNBType for Vector3 {
    fn from_bytes(data: &mut Bytes) -> Vector3 {
        Vector3 {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le()
        }
    }
}

impl XNBType for Vector4 {
    fn from_bytes(data: &mut Bytes) -> Vector4 {
        Vector4 {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}

impl XNBType for MatrixRow {
    fn from_bytes(data: &mut Bytes) -> MatrixRow {
        MatrixRow {
            val1: data.get_f32_le(),
            val2: data.get_f32_le(),
            val3: data.get_f32_le(),
            val4: data.get_f32_le()
        }
    }
}

// TODO: is this row-column or column-row?
impl XNBType for Matrix4x4 {
    fn from_bytes(data: &mut Bytes) -> Self where Self: Sized {
        Matrix4x4 {
            row1: MatrixRow::from_bytes(data),
            row2: MatrixRow::from_bytes(data),
            row3: MatrixRow::from_bytes(data),
            row4: MatrixRow::from_bytes(data)
        }
    }
}

impl XNBType for Quaternion {
    fn from_bytes(data: &mut Bytes) -> Quaternion {
        Quaternion {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}
