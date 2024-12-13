use bytes::{Buf, Bytes};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export, Void};
use crate::base::types::{Color32, Matrix4x4, MatrixRow, Plane, Quaternion, Vector2, Vector3, Vector4};
use crate::xna::type_base::XNBType;
use crate::xna::xnb::TypeReader;

// For empty/unknown assets
impl XNBType for Void {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Self where Self: Sized {
        Void {}
    }
}

impl XNBType for Vector2 {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Vector2 {
        Vector2 {
            x: data.get_f32_le(),
            y: data.get_f32_le()
        }
    }
}

impl XNBType for Vector3 {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Vector3 {
        Vector3 {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le()
        }
    }
}

impl XNBType for Vector4 {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Vector4 {
        Vector4 {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}

impl XNBType for MatrixRow {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> MatrixRow {
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
    fn from_bytes(data: &mut Bytes, r: &Vec<TypeReader>) -> Self where Self: Sized {
        Matrix4x4 {
            row1: MatrixRow::from_bytes(data, r),
            row2: MatrixRow::from_bytes(data, r),
            row3: MatrixRow::from_bytes(data, r),
            row4: MatrixRow::from_bytes(data, r)
        }
    }
}

impl XNBType for Quaternion {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Quaternion {
        Quaternion {
            x: data.get_f32_le(),
            y: data.get_f32_le(),
            z: data.get_f32_le(),
            w: data.get_f32_le()
        }
    }
}

impl XNBType for Color32 {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Color32 {
        Color32 {
            red: data.get_u8(),
            green: data.get_u8(),
            blue: data.get_u8(),
            alpha: data.get_u8()
        }
    }
}

impl XNBType for Plane {
    fn from_bytes(data: &mut Bytes, r: &Vec<TypeReader>) -> Plane {
        Plane {
            normal: Vector3::from_bytes(data, r),
            d: data.get_f32_le()
        }
    }
}

#[derive(Debug)]
pub struct Rectangle {
    x: i32,
    y: i32,
    width: i32,
    height: i32
}

impl Asset for Rectangle {
    fn make_html(&mut self, doc: &Document) -> Element {
        let elem = doc.create_element("p").expect("failed to create element");
        elem.set_text_content(Some(&*format!("Rectangle({}, {}, {}, {})", self.x, self.y, self.width, self.height)));
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "txt".to_string(),
            data: format!("({}, {}, {}, {})", self.x, self.y, self.width, self.height).into_bytes()
        }
    }
}

impl XNBType for Rectangle {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Rectangle {
        Rectangle {
            x: data.get_i32_le(),
            y: data.get_i32_le(),
            width: data.get_i32_le(),
            height: data.get_i32_le(),
        }
    }
}
