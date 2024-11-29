use bytes::{Buf, Bytes};
use crate::xna::type_base::XNBType;
use crate::xna::xnb::TypeReader;

pub mod graphics;
pub mod math;
pub mod media;
pub mod system;

impl XNBType for i32 {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Self {
        data.get_i32_le()
    }
}
