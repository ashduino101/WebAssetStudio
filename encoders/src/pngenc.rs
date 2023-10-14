use std::io::{Cursor, Read, Write};
use std::panic;
use png::Decoder;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn encode_png(width: u32, height: u32, data: &[u8]) -> Box<[u8]> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    if width == 0 || height == 0 {
        return [].into();
    }
    let mut w = Vec::new();
    let mut encoder  = png::Encoder::new(&mut w, width, height);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    encoder.set_compression(png::Compression::Fast);
    let mut writer = encoder.write_header().unwrap();
    let mut datavec = data[0..(width * height * 4) as usize].to_vec();
    datavec.extend(std::iter::repeat(0).take(((width * height * 4) - datavec.len() as u32) as usize));
    writer.write_image_data(&datavec).unwrap();
    writer.finish().unwrap();
    w.into()
}
