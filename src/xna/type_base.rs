
use bytes::Bytes;
use crate::base::asset::Asset;
use crate::xna::xnb::TypeReader;

pub trait XNBType : Asset {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Self where Self: Sized;
}