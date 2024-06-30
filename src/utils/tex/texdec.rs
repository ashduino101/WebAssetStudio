use std::cmp::{max};
use std::io::Write;


extern crate console_error_panic_hook;

use bytes::Bytes;
use crate::utils::fp16::fp16_ieee_to_fp32_value;
use texture2ddecoder;
use texture2ddecoder::{decode_astc as decode_astc_, decode_atc_rgb4_block, decode_atc_rgba8_block, decode_bc1_block, decode_bc3_block, decode_bc4_block, decode_bc5_block, decode_bc6_block, decode_bc7_block, decode_eacr_block, decode_eacr_signed_block, decode_eacrg_block, decode_eacrg_signed_block, decode_etc1_block, decode_etc2_rgb_block, decode_etc2_rgba1_block, decode_etc2_rgba8_block, decode_pvrtc as decode_pvrtc_};


// For Unity by default, but can also be used with match/case for other formats
#[derive(FromPrimitive, Debug, Copy, Clone)]
pub enum TextureFormat {
    Alpha8 = 1,
    ARGB4444 = 2,
    RGB24 = 3,
    RGBA32 = 4,
    ARGB32 = 5,
    ARGBFloat = 6,
    RGB565 = 7,
    BGR24 = 8,
    R16 = 9,
    DXT1 = 10,
    DXT3 = 11,
    DXT5 = 12,
    RGBA4444 = 13,
    BGRA32 = 14,
    RHalf = 15,
    RGHalf = 16,
    RGBAHalf = 17,
    RFloat = 18,
    RGFloat = 19,
    RGBAFloat = 20,
    YUY2 = 21,
    RGB9e5Float = 22,
    RGBFloat = 23,
    BC6H = 24,
    BC7 = 25,
    BC4 = 26,
    BC5 = 27,
    DXT1Crunched = 28,
    DXT5Crunched = 29,
    PVRTCRGB2 = 30,
    PVRTCRGBA2 = 31,
    PVRTCRGB4 = 32,
    PVRTCRGBA4 = 33,
    ETCRGB4 = 34,
    ATCRGB4 = 35,
    ATCRGBA8 = 36,
    EACR = 41,
    EACRSigned = 42,
    EACRG = 43,
    EACRGSigned = 44,
    ETC2RGB = 45,
    ETC2RGBA1 = 46,
    ETC2RGBA8 = 47,
    ASTCRGB4x4 = 48,
    ASTCRGB5x5 = 49,
    ASTCRGB6x6 = 50,
    ASTCRGB8x8 = 51,
    ASTCRGB10x10 = 52,
    ASTCRGB12x12 = 53,
    ASTCRGBA4x4 = 54,
    ASTCRGBA5x5 = 55,
    ASTCRGBA6x6 = 56,
    ASTCRGBA8x8 = 57,
    ASTCRGBA10x10 = 58,
    ASTCRGBA12x12 = 59,
    ETCRGB43DS = 60,
    ETC2RGBA83DS = 61,
    RG16 = 62,
    R8 = 63,
    ETCRGB4Crunched = 64,
    ETC2RGBA8Crunched = 65,
    ASTCHDR4x4 = 66,
    ASTCHDR5x5 = 67,
    ASTCHDR6x6 = 68,
    ASTCHDR8x8 = 69,
    ASTCHDR10x10 = 70,
    ASTCHDR12x12 = 71,
    RG32 = 72,
    RGB48 = 73,
    RGBA64 = 74,
    RGBA5551,
    RGBHalf,
    L8,
    LA16
}

pub fn swap_bytes_xbox(data: &mut [u8]) {
    for i in 0..(data.len() / 2) {
        let b = data[i * 2];
        data[i * 2] = data[i * 2 + 1];
        data[i * 2 + 1] = b;
    }
}

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

pub fn decode_a8(data: &mut Bytes) -> Box<[u8]> {
    let mut out = Vec::new();
    for i in 0..data.len() {
        out.write_all(&[0, 0, 0, data[i]]).expect("a8");
    }
    out.into()
}

pub fn decode_argb4444(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgb24(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_argb32(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgb565(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_bgr565(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    let mut outdata = decode_rgb565(data, width, height);
    bgr2rgb(&mut outdata);
    outdata
}

pub fn decode_r16(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgba4444(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_bgra4444(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    let mut outdata = decode_rgba4444(data, width, height);
    bgr2rgb(&mut outdata);
    outdata
}

pub fn decode_rgba5551(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_bgra5551(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgba1010102(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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



pub fn decode_bgra32(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rhalf(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rghalf(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgbhalf(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgbahalf(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rfloat(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgfloat(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgbfloat(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgbafloat(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_yuy2(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgb9e5float(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rg16(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_r8(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_l8(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_la16(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rg32(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgb48(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

pub fn decode_rgba64(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
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

fn decode_generic_blocky(data: &mut Bytes, width: usize, height: usize, func: impl Fn(&[u8], &mut [u32]), stride: usize) -> Box<[u8]> {
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

pub fn decode_dxt1(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc1_block, 8)
}

fn decode_bc2_block(data: &[u8], outbuf: &mut [u32]) {
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

pub fn decode_dxt3(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc2_block, 16)
}

pub fn decode_dxt5(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc3_block, 16)
}

pub fn decode_pvrtc(data: &mut Bytes, width: usize, height: usize, is2bpp: bool) -> Box<[u8]> {
    let mut out: Vec<u32> = Vec::new();
    out.resize((width * height) as usize, 0);
    decode_pvrtc_(&data, width, height, &mut out, is2bpp).expect("pvrtc");
    encode_data(out).into()
}

pub fn decode_etc1(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc1_block, 8)
}

pub fn decode_etc2(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgb_block, 8)
}

pub fn decode_etc2_a1(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgba1_block, 8)
}

pub fn decode_etc2_a8(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_etc2_rgba8_block, 16)
}

pub fn decode_eacr(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacr_block, 8)
}

pub fn decode_eacr_signed(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacr_signed_block, 8)
}

pub fn decode_eacrg(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacrg_block, 16)
}

pub fn decode_eacrg_signed(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_eacrg_signed_block, 16)
}

pub fn decode_bc4(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc4_block, 8)
}

pub fn decode_bc5(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc5_block, 16)
}

pub fn decode_bc6h(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, |data: &[u8], outbuf: &mut [u32]| decode_bc6_block(data, outbuf, false), 16)
}

pub fn decode_bc7(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_bc7_block, 16)
}

pub fn decode_atc_rgb4(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_atc_rgb4_block, 8)
}

pub fn decode_atc_rgba8(data: &mut Bytes, width: usize, height: usize) -> Box<[u8]> {
    decode_generic_blocky(data, width, height, decode_atc_rgba8_block, 16)
}

pub fn decode_astc(data: &mut Bytes, width: usize, height: usize, block_width: usize, block_height: usize) -> Box<[u8]> {
    let mut out: Vec<u32> = Vec::new();
    out.resize((width * height) as usize, 0);
    decode_astc_(&data, width, height, block_width, block_height, &mut out).expect("pvrtc");
    encode_data(out).into()
}

pub fn get_format_pixel_size(format: TextureFormat) -> i32 {
    match format {
        TextureFormat::Alpha8 => 1,
        TextureFormat::ARGB4444 => 2,
        TextureFormat::RGB24 => 3,
        TextureFormat::RGBA32 => 4,
        TextureFormat::RGB565 => 2,
        TextureFormat::RGBA4444 => 2,
        TextureFormat::RGBA5551 => 2,
        TextureFormat::BGRA32 => 4,

        TextureFormat::RHalf => 2,
        TextureFormat::RGHalf => 4,
        TextureFormat::RGBHalf => 6,
        TextureFormat::RGBAHalf => 8,

        TextureFormat::RFloat => 4,
        TextureFormat::RGFloat => 8,
        TextureFormat::RGBFloat => 12,
        TextureFormat::RGBAFloat => 16,

        TextureFormat::YUY2 => 2,

        TextureFormat::RGB9e5Float => 4,

        TextureFormat::BC6H => 1,
        TextureFormat::BC7 => 1,
        TextureFormat::BC4 => 1,
        TextureFormat::BC5 => 1,

        TextureFormat::DXT1 => 1,
        TextureFormat::DXT3 => 1,
        TextureFormat::DXT5 => 1,

        TextureFormat::PVRTCRGB2 | TextureFormat::PVRTCRGBA2 => 1,
        TextureFormat::PVRTCRGB4 | TextureFormat::PVRTCRGBA4 => 1,

        TextureFormat::ATCRGB4 => 1,
        TextureFormat::ATCRGBA8 => 1,

        TextureFormat::EACR => 1,
        TextureFormat::EACRSigned => 1,
        TextureFormat::EACRG => 1,
        TextureFormat::EACRGSigned => 1,

        TextureFormat::ETCRGB4 | TextureFormat::ETCRGB43DS => 1,
        TextureFormat::ETC2RGB => 1,
        TextureFormat::ETC2RGBA1 => 1,
        TextureFormat::ETC2RGBA8 | TextureFormat::ETC2RGBA83DS => 1,

        TextureFormat::ASTCRGB4x4 | TextureFormat::ASTCRGBA4x4 | TextureFormat::ASTCHDR4x4 => 1,
        TextureFormat::ASTCRGB5x5 | TextureFormat::ASTCRGBA5x5 | TextureFormat::ASTCHDR5x5 => 1,
        TextureFormat::ASTCRGB6x6 | TextureFormat::ASTCRGBA6x6 | TextureFormat::ASTCHDR6x6 => 1,
        TextureFormat::ASTCRGB8x8 | TextureFormat::ASTCRGBA8x8 | TextureFormat::ASTCHDR8x8 => 1,
        TextureFormat::ASTCRGB10x10 | TextureFormat::ASTCRGBA10x10 | TextureFormat::ASTCHDR10x10 => 1,
        TextureFormat::ASTCRGB12x12 | TextureFormat::ASTCRGBA12x12 | TextureFormat::ASTCHDR12x12 => 1,

        TextureFormat::L8 => 1,
        TextureFormat::LA16 => 2,

        TextureFormat::R8 => 1,
        TextureFormat::R16 => 2,
        TextureFormat::RG16 => 2,
        TextureFormat::RG32 => 4,
        TextureFormat::RGB48 => 6,
        TextureFormat::RGBA64 => 8,
        _ => 0
    }
}

pub fn get_format_min_pixel_size(format: TextureFormat) -> (i32, i32) {
    match format {
        TextureFormat::DXT1 | TextureFormat::DXT3 | TextureFormat::DXT5 | TextureFormat::BC4 | TextureFormat::BC5 | TextureFormat::BC6H | TextureFormat::BC7 |
        TextureFormat::ETC2RGB | TextureFormat::ETC2RGBA8 | TextureFormat::ETC2RGBA1 |
        TextureFormat::ASTCRGB4x4 | TextureFormat::ASTCHDR4x4 | TextureFormat::ASTCRGB8x8 | TextureFormat::ASTCHDR8x8 => (4, 4),
        _ => (1, 1)
    }
}

pub fn get_format_pixel_rshift(format: TextureFormat) -> i32 {
    match format {
        TextureFormat::ASTCRGB8x8 | TextureFormat::ASTCHDR8x8 => 2,
        TextureFormat::DXT1 | TextureFormat::BC4 | TextureFormat::ETC2RGB | TextureFormat::ETC2RGBA8 | TextureFormat::ETC2RGBA1 => 1,
        _ => 0
    }
}

pub fn get_format_block_size(format: TextureFormat) -> i32 {
    match format {
        TextureFormat::DXT1 | TextureFormat::DXT3 | TextureFormat::DXT5 | TextureFormat::BC4 | TextureFormat::BC5 | TextureFormat::BC6H | TextureFormat::BC7 |
        TextureFormat::ETC2RGB | TextureFormat::ETC2RGBA8 | TextureFormat::ETC2RGBA1 |
        TextureFormat::ASTCRGB4x4 | TextureFormat::ASTCHDR4x4 => 4,
        TextureFormat::ASTCRGB8x8 | TextureFormat::ASTCHDR8x8 => 8,
        _ => 1
    }
}

pub struct MipMapOffsetAndSize(pub i32, pub i32, pub i32);

pub fn get_mipmap_offset_and_size(mipmap: i32, format: TextureFormat, width: i32, height: i32) -> MipMapOffsetAndSize {
    let mut w = width;
    let mut h = height;
    let mut ofs = 0;

    let pixel_size = get_format_pixel_size(format);
    let pixel_rshift = get_format_pixel_rshift(format);
    let block = get_format_block_size(format);
    let (minw, minh) = get_format_min_pixel_size(format);

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

pub fn get_mipmap_byte_size(mipmap: i32, format: TextureFormat, width: i32, height: i32) -> i32 {
    let os1 = get_mipmap_offset_and_size(mipmap, format, width, height);
    let os2 = get_mipmap_offset_and_size(mipmap + 1, format, width, height);
    return os2.0 - os1.0;
}

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
pub fn decode(format: TextureFormat, data: &mut Bytes, width: usize, height: usize, is_xbox: bool) -> Box<[u8]> {
    if data.len() == 0 {return [].into()}
    match format {
        TextureFormat::Alpha8 => decode_a8(data),
        TextureFormat::ARGB4444 => {
            // if is_xbox { swap_bytes_xbox(data) };
            decode_argb4444(data, width, height)
        },
        TextureFormat::RGB24 => decode_rgb24(data, width, height),
        TextureFormat::RGBA32 => data.to_vec().into(),
        TextureFormat::RGB565 => {
            // if is_xbox { swap_bytes_xbox(data) };
            decode_rgb565(data, width, height)
        },
        TextureFormat::RGBA4444 => decode_rgba4444(data, width, height),
        TextureFormat::RGBA5551 => decode_rgba5551(data, width, height),
        TextureFormat::BGRA32 => decode_bgra32(data, width, height),

        TextureFormat::RHalf => decode_rhalf(data, width, height),
        TextureFormat::RGHalf => decode_rghalf(data, width, height),
        TextureFormat::RGBHalf => decode_rgbhalf(data, width, height),
        TextureFormat::RGBAHalf => decode_rgbahalf(data, width, height),

        TextureFormat::RFloat => decode_rfloat(data, width, height),
        TextureFormat::RGFloat => decode_rgfloat(data, width, height),
        TextureFormat::RGBFloat => decode_rgbfloat(data, width, height),
        TextureFormat::RGBAFloat => decode_rgbafloat(data, width, height),

        TextureFormat::YUY2 => decode_yuy2(data, width, height),

        TextureFormat::RGB9e5Float => decode_rgb9e5float(data, width, height),

        TextureFormat::BC6H => decode_bc6h(data, width, height),
        TextureFormat::BC7 => decode_bc7(data, width, height),
        TextureFormat::BC4 => decode_bc4(data, width, height),
        TextureFormat::BC5 => decode_bc5(data, width, height),

        TextureFormat::DXT1 => {
            // if is_xbox { swap_bytes_xbox(data) };
            decode_dxt1(data, width, height)
        },
        TextureFormat::DXT3 => {
            decode_dxt3(data, width, height)
        },
        TextureFormat::DXT5 => {
            // if is_xbox { swap_bytes_xbox(data) };
            decode_dxt5(data, width, height)
        },
        TextureFormat::DXT1Crunched => decode_dxt1(data, width, height),
        TextureFormat::DXT5Crunched => decode_dxt5(data, width, height),

        TextureFormat::PVRTCRGB2 | TextureFormat::PVRTCRGBA2 => decode_pvrtc(data, width, height, true),
        TextureFormat::PVRTCRGB4 | TextureFormat::PVRTCRGBA4 => decode_pvrtc(data, width, height, false),

        TextureFormat::ATCRGB4 => decode_atc_rgb4(data, width, height),
        TextureFormat::ATCRGBA8 => decode_atc_rgba8(data, width, height),

        TextureFormat::EACR => decode_eacr(data, width, height),
        TextureFormat::EACRSigned => decode_eacr_signed(data, width, height),
        TextureFormat::EACRG => decode_eacrg(data, width, height),
        TextureFormat::EACRGSigned => decode_eacrg_signed(data, width, height),

        TextureFormat::ETCRGB4 | TextureFormat::ETCRGB43DS => decode_etc1(data, width, height),
        TextureFormat::ETC2RGB => decode_etc2(data, width, height),
        TextureFormat::ETC2RGBA1 => decode_etc2_a1(data, width, height),
        TextureFormat::ETC2RGBA8 | TextureFormat::ETC2RGBA83DS => decode_etc2_a8(data, width, height),
        // FIXME: crunch
        TextureFormat::ETCRGB4Crunched => decode_etc1(data, width, height),
        TextureFormat::ETC2RGBA8Crunched => decode_etc2_a8(data, width, height),

        TextureFormat::ASTCRGB4x4 | TextureFormat::ASTCRGBA4x4 | TextureFormat::ASTCHDR4x4 => decode_astc(data, width, height, 4, 4),
        TextureFormat::ASTCRGB5x5 | TextureFormat::ASTCRGBA5x5 | TextureFormat::ASTCHDR5x5 => decode_astc(data, width, height, 5, 5),
        TextureFormat::ASTCRGB6x6 | TextureFormat::ASTCRGBA6x6 | TextureFormat::ASTCHDR6x6 => decode_astc(data, width, height, 6, 6),
        TextureFormat::ASTCRGB8x8 | TextureFormat::ASTCRGBA8x8 | TextureFormat::ASTCHDR8x8 => decode_astc(data, width, height, 8, 8),
        TextureFormat::ASTCRGB10x10 | TextureFormat::ASTCRGBA10x10 | TextureFormat::ASTCHDR10x10 => decode_astc(data, width, height, 10, 10),
        TextureFormat::ASTCRGB12x12 | TextureFormat::ASTCRGBA12x12 | TextureFormat::ASTCHDR12x12 => decode_astc(data, width, height, 12, 12),

        TextureFormat::L8 => decode_l8(data, width, height),
        TextureFormat::LA16 => decode_la16(data, width, height),

        TextureFormat::R8 => decode_r8(data, width, height),
        TextureFormat::R16 => decode_r16(data, width, height),
        TextureFormat::RG16 => decode_rg16(data, width, height),
        TextureFormat::RG32 => decode_rg32(data, width, height),
        TextureFormat::RGB48 => decode_rgb48(data, width, height),
        TextureFormat::RGBA64 => decode_rgba64(data, width, height),
        _ => [].into()
    }
}
