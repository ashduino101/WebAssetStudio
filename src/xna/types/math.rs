use bytes::{Buf, Bytes};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export, Void};
use crate::base::types::{Color32, Matrix4x4, MatrixRow, Plane, Quaternion, Vector2, Vector3, Vector4};
use crate::utils::buf::FromBytes;
use crate::xna::type_base::XNBType;
use crate::xna::xnb::TypeReader;

// For empty/unknown assets
impl XNBType for Void {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Self where Self: Sized {
        Void {}
    }
}

impl XNBType for Vector2 {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for Vector3 {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for Vector4 {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for MatrixRow {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

// TODO: is this row-column or column-row?
impl XNBType for Matrix4x4 {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for Quaternion {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for Color32 {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
    }
}

impl XNBType for Plane {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self
    where
        Self: Sized
    {
        <Self as FromBytes>::from_bytes(data)
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
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        parent.set_text_content(Some(&*format!("Rectangle({}, {}, {}, {})", self.x, self.y, self.width, self.height)));
        Ok(())
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
