use std::fmt::Debug;
use bytes::Bytes;
use crate::base::asset::Asset;

pub trait XNBType : Asset {
    fn from_bytes(data: &mut Bytes) -> Self where Self: Sized;
}