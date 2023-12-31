use std::cmp::{max, min};
use std::io::Write;
use std::mem::swap;
use wasm_bindgen::prelude::*;
extern crate console_error_panic_hook;
use std::panic;
use crate::fp16::fp16_ieee_to_fp32_value;
use texture2ddecoder;
use texture2ddecoder::{decode_astc as decode_astc_, decode_atc_rgb4_block, decode_atc_rgba8_block, decode_bc1_block, decode_bc3_block, decode_bc4_block, decode_bc5_block, decode_bc6_block, decode_bc7_block, decode_eacr_block, decode_eacr_signed_block, decode_eacrg_block, decode_eacrg_signed_block, decode_etc1_block, decode_etc2_a8_block, decode_etc2_rgb_block, decode_etc2_rgba1_block, decode_etc2_rgba8_block, decode_pvrtc as decode_pvrtc_};
use wasm_bindgen_test::console_log;

#[wasm_bindgen]
pub fn swap_bytes_xbox(data: &mut [u8]) {
    for i in 0..(data.len() / 2) {
        let b = data[i * 2];
        data[i * 2] = data[i * 2 + 1];
        data[i * 2 + 1] = b;
    }
}

#[wasm_bindgen]
pub fn bgr2rgb(data: &mut [u8]) {
    for i in 0..(data.len() / 4) {
        let o = i * 4;
        let b: u8 = data[o];
        let g: u8 = data[o + 1];
        let r: u8 = data[o + 2];
        let a: u8 = data[o + 3];
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = a;
    }
}

pub fn copy_block_buffer(
    bx: usize,
    by: usize,
    w: usize,
    h: usize,
    bw: usize,
    bh: usize,
    buffer: &[u32],
    image: &mut [u32],
) {
    let x: usize = bw * bx;
    let copy_width: usize = if bw * (bx + 1) > w { w - bw * bx } else { bw };

    let y_0 = by * bh;
    let copy_height: usize = if bh * (by + 1) > h { h - y_0 } else { bh };
    let mut buffer_offset = 0;

    for y in y_0..y_0 + copy_height {
        let image_offset = y * w + x;
        image[image_offset..image_offset + copy_width]
            .copy_from_slice(&buffer[buffer_offset..buffer_offset + copy_width]);

        buffer_offset += bw;
    }
}

fn encode_data(data: Vec<u32>) -> Vec<u8> {
    let mut outdata = Vec::new();
    for i in 0..data.len() {
        outdata.write_all(&data[i as usize].to_le_bytes()).expect("dxt1");
    }
    outdata
}

#[wasm_bindgen]
pub fn decode_a8(data: &mut [u8]) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..data.len() {
        out.write_all(&[0, 0, 0, data[i]]).expect("a8");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_argb4444(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            (data[(i * 2) as usize] & 0xf0) >> 4,
            data[(i * 2 + 1) as usize] & 0x0f,
            (data[(i * 2 + 1) as usize] & 0xf0) >> 4,
            data[(i * 2) as usize] & 0x0f
        ]).expect("argb4444");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgb24(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            data[(i * 3) as usize],
            data[(i * 3 + 1) as usize],
            data[(i * 3 + 2) as usize],
            0xff
        ]).expect("rgb24");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_argb32(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            data[(i * 4 + 3) as usize],
            data[(i * 4) as usize],
            data[(i * 4 + 1) as usize],
            data[(i * 4 + 2) as usize]
        ]).expect("argb32");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgb565(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let d: u32 = ((data[(i * 2 + 1) as usize] as u32) << 8) | (data[(i * 2) as usize] as u32);
        out.write_all(&[
            ((d >> 8 & 0xf8) | (d >> 13)) as u8,
            ((d >> 3 & 0xfc) | (d >> 9 & 3)) as u8,
            ((d << 3) | (d >> 2 & 7)) as u8,
            0xff
        ]).expect("rgb565");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_bgr565(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut outdata = decode_rgb565(data, width, height);
    bgr2rgb(&mut outdata);
    outdata
}

#[wasm_bindgen]
pub fn decode_r16(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) as usize {
        out.write_all(&[
            (((((data[i * 2 + 1] as u32) << 8) | (data[i * 2] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            0,
            0,
            0xff
        ]).expect("r16");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgba4444(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            data[(i * 2) as usize] & 0x0f,
            (data[(i * 2) as usize] & 0xf0) >> 4,
            data[(i * 2 + 1) as usize] & 0x0f,
            (data[(i * 2 + 1) as usize] & 0xf0) >> 4
        ]).expect("rgba4444");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_bgra4444(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut outdata = decode_rgba4444(data, width, height);
    bgr2rgb(&mut outdata);
    outdata
}

#[wasm_bindgen]
pub fn decode_rgba5551(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let color = u16::from_le_bytes([data[i * 2], data[i * 2 + 1]]);
        out.write_all(&[
            ((color & 0x001F) << 3) as u8,
            ((color & 0x03E0) >> 2) as u8,
            ((color & 0x7C00) >> 7) as u8,
            (if (color & 0x8000) == 0x8000 {0xff} else {0x00}) as u8
        ]).expect("rgba5551");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_bgra5551(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let color = u16::from_le_bytes([data[i * 2], data[i * 2 + 1]]);
        out.write_all(&[
            ((color & 0x7C00) >> 7) as u8,
            ((color & 0x03E0) >> 2) as u8,
            ((color & 0x001F) << 3) as u8,
            (if (color & 0x8000) == 0x8000 {0xff} else {0x00}) as u8
        ]).expect("bgra5551");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgba1010102(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let color = u32::from_le_bytes([data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]);
        out.write_all(&[
            ((color & 0x3FF00000) >> 20) as u8,
            ((color & 0x000FFC00) >> 10) as u8,
            (color & 0x000003FF) as u8,
            (color & 0xC0000000) as u8
        ]).expect("rgba1010102");
    }
    out.into()
}



#[wasm_bindgen]
pub fn decode_bgra32(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) as usize {
        out.write_all(&[
            data[i * 4 + 2],
            data[i * 4 + 1],
            data[i * 4],
            data[i * 4 + 3]
        ]).expect("bgra32");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rhalf(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let d = ((data[i * 2 + 1] as u16) << 8) | (data[i * 2] as u16);
        out.write_all(&[
            (fp16_ieee_to_fp32_value(d) * 255.0) as u8,
            0,
            0,
            0xff
        ]).expect("rhalf");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rghalf(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let r = ((data[i * 4 + 1] as u16) << 8) | (data[i * 4] as u16);
        let g = ((data[i * 4 + 3] as u16) << 8) | (data[i * 4 + 2] as u16);
        out.write_all(&[
            (fp16_ieee_to_fp32_value(r) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(g) * 255.0) as u8,
            0,
            0xff
        ]).expect("rghalf");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgbhalf(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let r = ((data[i * 6 + 1] as u16) << 8) | (data[i * 6] as u16);
        let g = ((data[i * 6 + 3] as u16) << 8) | (data[i * 6 + 2] as u16);
        let b = ((data[i * 6 + 5] as u16) << 8) | (data[i * 6 + 4] as u16);
        out.write_all(&[
            (fp16_ieee_to_fp32_value(r) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(g) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(b) * 255.0) as u8,
        ]).expect("rgbhalf");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgbahalf(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        let r = ((data[i * 8 + 1] as u16) << 8) | (data[i * 8] as u16);
        let g = ((data[i * 8 + 3] as u16) << 8) | (data[i * 8 + 2] as u16);
        let b = ((data[i * 8 + 5] as u16) << 8) | (data[i * 8 + 4] as u16);
        let a = ((data[i * 8 + 7] as u16) << 8) | (data[i * 8 + 6] as u16);
        out.write_all(&[
            (fp16_ieee_to_fp32_value(r) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(g) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(b) * 255.0) as u8,
            (fp16_ieee_to_fp32_value(a) * 255.0) as u8,
        ]).expect("rgbahalf");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rfloat(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            f32::from_le_bytes([data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]) as u8,
            0,
            0,
            0xff
        ]).expect("rfloat");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgfloat(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            f32::from_le_bytes([data[i * 8], data[i * 8 + 1], data[i * 8 + 2], data[i * 8 + 3]]) as u8,
            f32::from_le_bytes([data[i * 8 + 4], data[i * 8 + 5], data[i * 8 + 6], data[i * 8 + 7]]) as u8,
            0,
            0xff
        ]).expect("rgfloat");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgbfloat(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            f32::from_le_bytes([data[i * 12], data[i * 12 + 1], data[i * 12 + 2], data[i * 12 + 3]]) as u8,
            f32::from_le_bytes([data[i * 12 + 4], data[i * 12 + 5], data[i * 12 + 6], data[i * 12 + 7]]) as u8,
            f32::from_le_bytes([data[i * 12 + 8], data[i * 12 + 9], data[i * 12 + 10], data[i * 12 + 11]]) as u8,
        ]).expect("rgbfloat");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgbafloat(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            f32::from_le_bytes([data[i * 16], data[i * 16 + 1], data[i * 16 + 2], data[i * 16 + 3]]) as u8,
            f32::from_le_bytes([data[i * 16 + 4], data[i * 16 + 5], data[i * 16 + 6], data[i * 16 + 7]]) as u8,
            f32::from_le_bytes([data[i * 16 + 8], data[i * 16 + 9], data[i * 16 + 10], data[i * 16 + 11]]) as u8,
            f32::from_le_bytes([data[i * 16 + 12], data[i * 16 + 13], data[i * 16 + 14], data[i * 16 + 15]]) as u8,
        ]).expect("rgbafloat");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_yuy2(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    let mut p = 0;
    let mut o = 0;
    for _ in 0..height {
        for _ in 0..(width / 2) {
            let y0 = data[p];
            let u0 = data[p + 1];
            let y1 = data[p + 2];
            let v0 = data[p + 3];
            p += 4;
            let mut c = (y0 - 16) as u32;
            let d = (u0 - 128) as u32;
            let e = (v0 - 128) as u32;
            let b0 = (298 * c + 516 * d + 128) >> 8;
            let g0 = (298 * c - 100 * d - 208 * e + 128) >> 8;
            let r0 = (298 * c + 409 * e + 128) >> 8;
            c = (y1 - 16) as u32;
            let b1 = (298 * c + 516 * d + 128) >> 8;
            let g1 = (298 * c - 100 * d - 208 * e + 128) >> 8;
            let r1 = (298 * c + 409 * e + 128) >> 8;
            out[o] = r0 as u8;
            out[o + 1] = g0 as u8;
            out[o + 2] = b0 as u8;
            out[o + 3] = 0xff;
            o += 4;
            out[o] = r1 as u8;
            out[o + 1] = g1 as u8;
            out[o + 2] = b1 as u8;
            out[o + 3] = 0xff;
            o += 4;
        }
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgb9e5float(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    for i in 0..(width * height) {
        let n = u32::from_le_bytes([data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]);
        let scale = n >> 27 & 0x1f;
        let scalef = 2f32.powf((scale - 24) as f32);
        let b = (n >> 18 & 0x1ff) as f32;
        let g = (n >> 9 & 0x1ff) as f32;
        let r = (n & 0x1ff) as f32;
        out[i * 4] = (r * scalef * 255.0).floor() as u8;
        out[i * 4 + 1] = (g * scalef * 255.0).floor() as u8;
        out[i * 4 + 2] = (b * scalef * 255.0).floor() as u8;
        out[i * 4 + 3] = 0xff;
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rg16(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    for i in 0..(width * height) {
        out[i * 4] = data[i * 2];
        out[i * 4 + 1] = data[i * 2 + 1];
        out[i * 4 + 2] = 0;
        out[i * 4 + 3] = 0xff;
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_r8(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    for i in 0..(width * height) {
        out[i * 4] = data[i];
        out[i * 4 + 1] = 0;
        out[i * 4 + 2] = 0;
        out[i * 4 + 3] = 0xff;
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_l8(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    for i in 0..(width * height) {
        out[i * 4] = data[i];
        out[i * 4 + 1] = data[i];
        out[i * 4 + 2] = data[i];
        out[i * 4 + 3] = 0xff;
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_la16(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    out.resize(width * height * 4, 0);
    for i in 0..(width * height) {
        out[i * 4] = data[i * 2];
        out[i * 4 + 1] = data[i * 2];
        out[i * 4 + 2] = data[i * 2];
        out[i * 4 + 3] = data[i * 2 + 1];
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rg32(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            (((((data[i * 4 + 1] as u32) << 8) | (data[i * 4] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 4 + 3] as u32) << 8) | (data[i * 4 + 2] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            0,
            0xff
        ]).expect("rg32");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgb48(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            (((((data[i * 6 + 1] as u32) << 8) | (data[i * 6] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 6 + 3] as u32) << 8) | (data[i * 6 + 2] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 6 + 5] as u32) << 8) | (data[i * 6 + 4] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            0xff
        ]).expect("r16");
    }
    out.into()
}

#[wasm_bindgen]
pub fn decode_rgba64(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..(width * height) {
        out.write_all(&[
            (((((data[i * 8 + 1] as u32) << 8) | (data[i * 8] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 8 + 3] as u32) << 8) | (data[i * 8 + 2] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 8 + 5] as u32) << 8) | (data[i * 8 + 4] as u32)) as u32 * 255 + 32895) >> 16) as u8,
            (((((data[i * 8 + 7] as u32) << 8) | (data[i * 8 + 6] as u32)) as u32 * 255 + 32895) >> 16) as u8,
        ]).expect("r16");
    }
    out.into()
}

fn decode_generic_blocky(data: &mut [u8], width: usize, height: usize, func: impl Fn(&[u8], &mut [u32]), stride: usize) -> Box<[u8]> {
    let mut i = 0;
    let mut out: Vec<u32> = Vec::new();
    out.resize((width * height) as usize, 0);
    for by in 0..(((height + 3) / 4) as usize) {
        for bx in 0..(((width + 3) / 4) as usize) {
            let mut outblk = [0u32; 16];
            func(&data[i..i + stride], &mut outblk);
            copy_block_buffer(bx, by, width, height, 4, 4, &outblk, &mut out);
            i += stride;
        }
    }
    encode_data(out).into()
}

#[wasm_bindgen]
pub fn decode_dxt1(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc1_block, 8)
}

fn decode_bc2_block(data: &[u8], outbuf: &mut [u32]) {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let mut alpha = [0xffu32; 16];
    for row in 0..4 {
        let a0 = (data[row * 2] >> 4) * 16;
        let a1 = (data[row * 2] & 0b1111) * 16;
        let a2 = (data[row * 2 + 1] >> 4) * 16;
        let a3 = (data[row * 2 + 1] & 0b1111) * 16;

        alpha[row * 4] = a0 as u32;
        alpha[row * 4 + 1] = a1 as u32;
        alpha[row * 4 + 2] = a2 as u32;
        alpha[row * 4 + 3] = a3 as u32;
    }

    let mut colors = [0u32; 16];
    decode_bc1_block(&data[8..], &mut colors);
    for (i, c) in colors.iter().enumerate() {
        outbuf[i] = c & 0x00ffffff | (alpha[i] << 24);
    }
}

#[wasm_bindgen]
pub fn decode_dxt3(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc2_block, 16)
}

#[wasm_bindgen]
pub fn decode_dxt5(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc3_block, 16)
}

#[wasm_bindgen]
pub fn decode_pvrtc(data: &mut [u8], width: usize, height: usize, is2bpp: bool) -> Box<[u8]> {
    let mut out: Vec<u32> = Vec::new();
    out.resize((width * height) as usize, 0);
    decode_pvrtc_(&data, width, height, &mut out, is2bpp).expect("pvrtc");
    encode_data(out).into()
}

#[wasm_bindgen]
pub fn decode_etc1(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc1_block, 8)
}

#[wasm_bindgen]
pub fn decode_etc2(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgb_block, 8)
}

#[wasm_bindgen]
pub fn decode_etc2_a1(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgba1_block, 8)
}

#[wasm_bindgen]
pub fn decode_etc2_a8(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgba8_block, 16)
}

#[wasm_bindgen]
pub fn decode_eacr(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacr_block, 8)
}

#[wasm_bindgen]
pub fn decode_eacr_signed(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacr_signed_block, 8)
}

#[wasm_bindgen]
pub fn decode_eacrg(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacrg_block, 16)
}

#[wasm_bindgen]
pub fn decode_eacrg_signed(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacrg_signed_block, 16)
}

#[wasm_bindgen]
pub fn decode_bc4(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc4_block, 8)
}

#[wasm_bindgen]
pub fn decode_bc5(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc5_block, 16)
}

#[wasm_bindgen]
pub fn decode_bc6h(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, |data: &[u8], outbuf: &mut [u32]| decode_bc6_block(data, outbuf, false), 16)
}

#[wasm_bindgen]
pub fn decode_bc7(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc7_block, 16)
}

#[wasm_bindgen]
pub fn decode_atc_rgb4(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_atc_rgb4_block, 8)
}

#[wasm_bindgen]
pub fn decode_atc_rgba8(data: &mut [u8], width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_atc_rgba8_block, 16)
}

#[wasm_bindgen]
pub fn decode_astc(data: &mut [u8], width: usize, height: usize, block_width: usize, block_height: usize) -> Box<[u8]> {
    let mut out: Vec<u32> = Vec::new();
    out.resize((width * height) as usize, 0);
    decode_astc_(&data, width, height, block_width, block_height, &mut out).expect("pvrtc");
    encode_data(out).into()
}

pub fn get_format_pixel_size(format: &str) -> i32 {
    match format {
        "Alpha8" => 1,
        "ARGB4444" => 2,
        "RGB24" => 3,
        "RGBA32" => 4,
        "RGB565" => 2,
        "RGBA4444" => 2,
        "RGBA5551" => 2,
        "BGRA32" => 4,

        "RHalf" => 2,
        "RGHalf" => 4,
        "RGBHalf" => 6,
        "RGBAHalf" => 8,

        "RFloat" => 4,
        "RGFloat" => 8,
        "RGBFloat" => 12,
        "RGBAFloat" => 16,

        "YUY2" => 2,

        "RGB9e5Float" => 4,

        "BC6H" => 1,
        "BC7" => 1,
        "BC4" => 1,
        "BC5" => 1,

        "DXT1" => 1,
        "DXT3" => 1,
        "DXT5" => 1,

        "PVRTC_RGB2" | "PVRTC_RGBA2" => 1,
        "PVRTC_RGB4" | "PVRTC_RGBA4" => 1,

        "ATC_RGB4" => 1,
        "ATC_RGBA8" => 1,

        "EAC_R" => 1,
        "EAC_R_SIGNED" => 1,
        "EAC_RG" => 1,
        "EAC_RG_SIGNED" => 1,

        "ETC_RGB4" | "ETC_RGB4_3DS" => 1,
        "ETC2_RGB" => 1,
        "ETC2_RGBA1" => 1,
        "ETC2_RGBA8" | "ETC2_RGBA8_3DS" => 1,

        "ASTC_RGB_4x4" | "ASTC_RGBA_4x4" | "ASTC_HDR_4x4" => 1,
        "ASTC_RGB_5x5" | "ASTC_RGBA_5x5" | "ASTC_HDR_5x5" => 1,
        "ASTC_RGB_6x6" | "ASTC_RGBA_6x6" | "ASTC_HDR_6x6" => 1,
        "ASTC_RGB_8x8" | "ASTC_RGBA_8x8" | "ASTC_HDR_8x8" => 1,
        "ASTC_RGB_10x10" | "ASTC_RGBA_10x10" | "ASTC_HDR_10x10" => 1,
        "ASTC_RGB_12x12" | "ASTC_RGBA_12x12" | "ASTC_HDR_12x12" => 1,

        "L8" => 1,
        "LA16" => 2,

        "R8" => 1,
        "R16" => 2,
        "RG16" => 2,
        "RG32" => 4,
        "RGB48" => 6,
        "RGBA64" => 8,
        _ => 0
    }
}

pub fn get_format_min_pixel_size(format: &str) -> (i32, i32) {
    match format {
        "DXT1" | "DXT3" | "DXT5" | "BC4" | "BC5" | "BC6H" | "BC7" |
        "ETC2_RGB" | "ETC2_RGBA8" | "ETC2_RGBA1" |
        "ASTC_RGB_4x4" | "ASTC_HDR_4x4" | "ASTC_RGB_8x8" | "ASTC_HDR_8x8" => (4, 4),
        _ => (1, 1)
    }
}

pub fn get_format_pixel_rshift(format: &str) -> i32 {
    match format {
        "ASTC_RGB_8x8" | "ASTC_HDR_8x8" => 2,
        "DXT1" | "BC4" | "ETC2_RGB" | "ETC2_RGBA8" | "ETC2_RGBA1" => 1,
        _ => 0
    }
}

#[wasm_bindgen]
pub fn get_format_block_size(format: &str) -> i32 {
    match format {
        "DXT1" | "DXT3" | "DXT5" | "BC4" | "BC5" | "BC6H" | "BC7" |
        "ETC2_RGB" | "ETC2_RGBA8" | "ETC2_RGBA1" |
        "ASTC_RGB_4x4" | "ASTC_HDR_4x4" => 4,
        "ASTC_RGB_8x8" | "ASTC_HDR_8x8" => 8,
        _ => 1
    }
}

#[wasm_bindgen]
pub struct MipMapOffsetAndSize(pub i32, pub i32, pub i32);

#[wasm_bindgen]
pub fn get_mipmap_offset_and_size(mipmap: i32, format: &str, width: i32, height: i32) -> MipMapOffsetAndSize {
    let mut w = width;
    let mut h = height;
    let mut ofs = 0;

    let pixel_size = get_format_pixel_size(&format);
    let pixel_rshift = get_format_pixel_rshift(&format);
    let block = get_format_block_size(&format);
    let (minw, minh) = get_format_min_pixel_size(&format);

    for _ in 0..mipmap {
        let bw: i32 = if w % block != 0 {w + (block - w % block)} else {w};
        let bh: i32 = if h % block != 0 {h + (block - h % block)} else {h};

        let mut s = bw * bh;

        s *= pixel_size;
        s >>= pixel_rshift;
        ofs += s;
        w = max(minw, w >> 1);
        h = max(minh, h >> 1);
    }

    return MipMapOffsetAndSize(ofs, w, h);
}

#[wasm_bindgen]
pub fn get_mipmap_byte_size(mipmap: i32, format: &str, width: i32, height: i32) -> i32 {
    let os1 = get_mipmap_offset_and_size(mipmap, format, width, height);
    let os2 = get_mipmap_offset_and_size(mipmap + 1, format, width, height);
    return os2.0 - os1.0;
}

#[wasm_bindgen]
/// Decodes a texture of arbitrary format.
/// Crunched textures must be unpacked before decoding.
///
/// # Arguments
///
/// * `format` - A string holding the texture format (e.g. "RGBA32")
/// * `data` - An array of bytes holding the compressed image data to decode
/// * `width` - The overall width of the image
/// * `height` - The overall height of the image
/// * `is_xbox` - If the platform is XBox 360 -- used to determine if bytes should be swapped
///
/// # Returns
///
/// * A box containing the decompressed (raw) image data.
pub fn decode(format: &str, data: &mut [u8], width: usize, height: usize, is_xbox: bool) -> Box<[u8]> {
    if data.len() == 0 {return [].into()}
    match format {
        "Alpha8" => decode_a8(data),
        "ARGB4444" => {
            if is_xbox { swap_bytes_xbox(data) };
            decode_argb4444(data, width, height)
        },
        "RGB24" => decode_rgb24(data, width, height),
        "RGBA32" => data.to_vec().into(),
        "RGB565" => {
            if is_xbox { swap_bytes_xbox(data) };
            decode_rgb565(data, width, height)
        },
        "RGBA4444" => decode_rgba4444(data, width, height),
        "RGBA5551" => decode_rgba5551(data, width, height),
        "BGRA32" => decode_bgra32(data, width, height),

        "RHalf" => decode_rhalf(data, width, height),
        "RGHalf" => decode_rghalf(data, width, height),
        "RGBHalf" => decode_rgbhalf(data, width, height),
        "RGBAHalf" => decode_rgbahalf(data, width, height),

        "RFloat" => decode_rfloat(data, width, height),
        "RGFloat" => decode_rgfloat(data, width, height),
        "RGBFloat" => decode_rgbfloat(data, width, height),
        "RGBAFloat" => decode_rgbafloat(data, width, height),

        "YUY2" => decode_yuy2(data, width, height),

        "RGB9e5Float" => decode_rgb9e5float(data, width, height),

        "BC6H" => decode_bc6h(data, width, height),
        "BC7" => decode_bc7(data, width, height),
        "BC4" => decode_bc4(data, width, height),
        "BC5" => decode_bc5(data, width, height),

        "DXT1" => {
            if is_xbox { swap_bytes_xbox(data) };
            decode_dxt1(data, width, height)
        },
        "DXT3" => {
            decode_dxt3(data, width, height)
        },
        "DXT5" => {
            if is_xbox { swap_bytes_xbox(data) };
            decode_dxt5(data, width, height)
        },
        "DXT1Crunched" => decode_dxt1(data, width, height),
        "DXT5Crunched" => decode_dxt5(data, width, height),

        "PVRTC_RGB2" | "PVRTC_RGBA2" => decode_pvrtc(data, width, height, true),
        "PVRTC_RGB4" | "PVRTC_RGBA4" => decode_pvrtc(data, width, height, false),

        "ATC_RGB4" => decode_atc_rgb4(data, width, height),
        "ATC_RGBA8" => decode_atc_rgba8(data, width, height),

        "EAC_R" => decode_eacr(data, width, height),
        "EAC_R_SIGNED" => decode_eacr_signed(data, width, height),
        "EAC_RG" => decode_eacrg(data, width, height),
        "EAC_RG_SIGNED" => decode_eacrg_signed(data, width, height),

        "ETC_RGB4" | "ETC_RGB4_3DS" => decode_etc1(data, width, height),
        "ETC2_RGB" => decode_etc2(data, width, height),
        "ETC2_RGBA1" => decode_etc2_a1(data, width, height),
        "ETC2_RGBA8" | "ETC2_RGBA8_3DS" => decode_etc2_a8(data, width, height),
        "ETC_RGB4Crunched" => decode_etc1(data, width, height),
        "ETC_RGBA8Crunched" => decode_etc2_a8(data, width, height),

        "ASTC_RGB_4x4" | "ASTC_RGBA_4x4" | "ASTC_HDR_4x4" => decode_astc(data, width, height, 4, 4),
        "ASTC_RGB_5x5" | "ASTC_RGBA_5x5" | "ASTC_HDR_5x5" => decode_astc(data, width, height, 5, 5),
        "ASTC_RGB_6x6" | "ASTC_RGBA_6x6" | "ASTC_HDR_6x6" => decode_astc(data, width, height, 6, 6),
        "ASTC_RGB_8x8" | "ASTC_RGBA_8x8" | "ASTC_HDR_8x8" => decode_astc(data, width, height, 8, 8),
        "ASTC_RGB_10x10" | "ASTC_RGBA_10x10" | "ASTC_HDR_10x10" => decode_astc(data, width, height, 10, 10),
        "ASTC_RGB_12x12" | "ASTC_RGBA_12x12" | "ASTC_HDR_12x12" => decode_astc(data, width, height, 12, 12),

        "L8" => decode_l8(data, width, height),
        "LA16" => decode_la16(data, width, height),

        "R8" => decode_r8(data, width, height),
        "R16" => decode_r16(data, width, height),
        "RG16" => decode_rg16(data, width, height),
        "RG32" => decode_rg32(data, width, height),
        "RGB48" => decode_rgb48(data, width, height),
        "RGBA64" => decode_rgba64(data, width, height),
        _ => [].into()
    }
}
