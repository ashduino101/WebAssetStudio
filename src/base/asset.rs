use std::fmt::Debug;

pub trait Asset : Debug {

}

// Primitive, just in case

impl Asset for i8 {

}

impl Asset for u8 {

}

impl Asset for bool {

}

impl Asset for char {

}

impl Asset for i16 {

}

impl Asset for u16 {

}

impl Asset for i32 {

}

impl Asset for u32 {

}

impl Asset for f32 {

}

impl Asset for i64 {

}

impl Asset for u64 {

}

impl Asset for f64 {

}

#[derive(Debug)]
pub struct Void {}

impl Asset for Void {}

impl Asset for String {

}
