// Encoder/decoder for QOI images.
// https://qoiformat.org/



use bytes::{Buf, BufMut, Bytes, BytesMut};
use wasm_bindgen_test::console_log;
use crate::create_img;
use crate::logger::{error};
use crate::utils::buf::BufMutExt;


static MODULE: &str = file!();

static QOI_OP_RGB: u8 = 0b11111110;
static QOI_OP_RGBA: u8 = 0b11111111;


#[derive(Debug, Copy, Clone)]
struct Pixel {
    r: u8,
    g: u8,
    b: u8,
    a: u8
}

static QOI_INDEX: u8 = 0x00;
static QOI_RUN_8: u8 = 0x40;
static QOI_RUN_16: u8 = 0x60;
static QOI_DIFF_8: u8 = 0x80;
static QOI_DIFF_16: u8 = 0xc0;
static QOI_DIFF_24: u8 = 0xe0;

static QOI_COLOR: u8 = 0xf0;
static QOI_MASK_2: u8 = 0xc0;
static QOI_MASK_3: u8 = 0xe0;
static QOI_MASK_4: u8 = 0xf0;


fn decode_qoi_data(data: &mut Bytes) {
    let mut run = 0;
    let r = 0u8;
    let g = 0u8;
    let b = 0u8;
    let a = 0u8;
    let index = vec![Pixel {r: 0, g: 0, b: 0, a: 255}; 64];
    while data.remaining() > 0 {
        if run > 0 {
            run -= 1;
        } else {
            let b1 = data.get_u8();

            if (b1 & QOI_MASK_2) == QOI_INDEX {
                
            }
        }
        
    }
}

/// Decodes a QOI image with a header added by GameMaker.
pub fn decode_qoi_gm(data: &mut Bytes) -> Result<(), anyhow::Error>{
    let magic = data.get_chars(4);
    if magic != "fioq" {
        error!("Invalid GameMaker QOI image (mismatched magic)!");
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid QOI header").into());
    }
    let width = data.get_u16_le();
    let height = data.get_u16_le();
    let data_size = data.get_u32_le();
    if data_size > data.remaining() as u32 {
        error!("Data size overflows buffer!");
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid QOI image").into());
    }
    // convert to a standard qoi image
    let mut intermediate = BytesMut::new();
    intermediate.put_chars("qoif".to_owned());
    intermediate.put_u32(width as u32);
    intermediate.put_u32(height as u32);
    intermediate.put_u8(4);  // RGBA
    intermediate.put_u8(0);  // sRGB
    intermediate.put(data.slice(0..data_size as usize));
    intermediate.put_slice(&[0u8, 0, 0, 0, 0, 0, 0, 1]);
    let decoded = qoi::decode_to_vec(&intermediate[..])?;
    console_log!("{:?}", create_img(&decoded.1[..], width as usize, height as usize));


    // let mut index = vec![0u32; 64];
    // let mut result = vec![0u32; (width * height * 4) as usize];
    // let mut i = 0;
    // for _ in 0..10 {
    //     let first_byte = data.get_u8();
    //     if first_byte == QOI_OP_RGB {
    //         let r = data.get_u8() as u32;
    //         let g = data.get_u8() as u32;
    //         let b = data.get_u8() as u32;
    //         let a = if i == 0 { 0xff } else { if let Some(sa) = result.get(i - 1) { sa & 0xff } else { 0xff } };
    //         index.insert(((r * 3 + g * 5 + b * 7 + a * 11) % 64) as usize, (r << 24) | (g << 16) | (b << 8) | 0xff);
    //     }
    // }

    Ok(())
}
