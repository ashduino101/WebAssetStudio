// Common types used in multiple formats

use std::fmt::Debug;
use crate::base::asset::Asset;

#[derive(Debug, Copy, Clone)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32
}

impl Asset for Vector2 {

}


#[derive(Debug, Copy, Clone)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32
}

impl Asset for Vector3 {

}


#[derive(Debug, Copy, Clone)]
pub struct Vector4 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Asset for Vector4 {

}


#[derive(Debug, Copy, Clone)]
pub struct MatrixRow {
    pub val1: f32,
    pub val2: f32,
    pub val3: f32,
    pub val4: f32
}

impl Asset for MatrixRow {

}

#[derive(Debug, Copy, Clone)]
pub struct Matrix4x4 {
    pub row1: MatrixRow,
    pub row2: MatrixRow,
    pub row3: MatrixRow,
    pub row4: MatrixRow
}

impl Asset for Matrix4x4 {

}


#[derive(Debug, Copy, Clone)]
pub struct Quaternion {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32
}

impl Asset for Quaternion {

}


#[derive(Debug, Copy, Clone)]
pub struct Color32 {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
    pub alpha: u8
}

impl Asset for Color32 {

}


#[derive(Debug, Copy, Clone)]
pub struct Plane {
    pub normal: Vector3,
    pub d: f32
}

impl Asset for Plane {

}
