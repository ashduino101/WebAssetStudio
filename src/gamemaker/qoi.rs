use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Write};
use bytes::{Buf, Bytes};
use image::{DynamicImage, Pixel, Rgba, RgbaImage};
use anyhow;
use num_traits::ops::overflowing::OverflowingAdd;

static MAGIC: u32 = 0x716f6966;  // "qoif"

#[derive(Debug)]
pub struct QOIFError {
    message: String
}

impl QOIFError {
    pub fn new(message: &str) -> QOIFError {
        QOIFError {
            message: message.to_owned()
        }
    }
}

impl Display for QOIFError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl Error for QOIFError {}

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

pub fn decode_qoi(data: &mut Bytes) -> anyhow::Result<RgbaImage> {
    let magic = data.get_u32_le();
    if magic != MAGIC {
        return Err(QOIFError::new("invalid QOIF magic").into())
    }

    let width = data.get_u16_le();
    let height = data.get_u16_le();
    let data_size = data.get_u32_le() as usize;

    let mut image_data = data.slice(0..data_size);
    data.advance(data_size);

    let mut run = 0;
    let mut r = 0;
    let mut g = 0;
    let mut b = 0;
    let mut a = 255u8;
    let mut data = vec![0u8; (width as usize) * (height as usize) * 4];
    let mut pos = 0usize;
    let mut index = vec![Rgba([0u8, 0, 0, 255]); 64];
    while image_data.has_remaining() {
        if run > 0 {
            run -= 1;
        } else if image_data.has_remaining() {
            let b1 = image_data.get_u8();

            if (b1 & QOI_MASK_2) == QOI_INDEX {
                let index_pos = b1 ^ QOI_INDEX;
                let val = index.get(index_pos as usize).unwrap().channels();  // cannot be more than the length anyway
                r = val[0];
                g = val[1];
                b = val[2];
                a = val[3];
            } else if (b1 & QOI_MASK_3) == QOI_RUN_8 {
                run = (b1 & 0x1f) as usize;
            } else if (b1 & QOI_MASK_3) == QOI_RUN_16 {
                let b2 = image_data.get_u8() as usize;
                run = ((((b1 as usize) & 0x1f) << 8) | b2) + 32;
            } else if (b1 & QOI_MASK_2) == QOI_DIFF_8 {
                let v = b1 as i32;
                r = r.wrapping_add((((v & 48) << 26 >> 30) & 0xff) as u8);
                g = g.wrapping_add((((v & 12) << 28 >> 22 >> 8) & 0xff) as u8);
                b = b.wrapping_add((((v & 3) << 30 >> 14 >> 16) & 0xff) as u8);
            } else if (b1 & QOI_MASK_3) == QOI_DIFF_16 {
                let b2 = image_data.get_u8() as i32;
                let v = ((b1 as i32) << 8) | b2;
                r = r.wrapping_add((((v & 7936) << 19 >> 27) & 0xff) as u8);
                g = g.wrapping_add((((v & 240) << 24 >> 20 >> 8) & 0xff) as u8);
                b = b.wrapping_add((((v & 15) << 28 >> 12 >> 16) & 0xff) as u8);
            } else if (b1 & QOI_MASK_4) == QOI_DIFF_24 {
                let b2 = image_data.get_u8() as i32;
                let b3 = image_data.get_u8() as i32;
                let v = ((b1 as i32) << 16) | (b2 << 8) | b3;
                r = r.wrapping_add((((v & 1015808) << 12 >> 27) & 0xff) as u8);
                g = g.wrapping_add((((v & 31744) << 17 >> 19 >> 8) & 0xff) as u8);
                b = b.wrapping_add((((v & 992) << 22 >> 11 >> 16) & 0xff) as u8);
                a = a.wrapping_add((((v & 31) << 27 >> 3 >> 24) & 0xff) as u8);
            } else if (b1 & QOI_MASK_4) == QOI_COLOR {
                if (b1 & 8) != 0 {
                    r = image_data.get_u8();
                }
                if (b1 & 4) != 0 {
                    g = image_data.get_u8();
                }
                if (b1 & 2) != 0 {
                    b = image_data.get_u8();
                }
                if (b1 & 1) != 0 {
                    a = image_data.get_u8();
                }
            }

            let index_pos = (r ^ g ^ b ^ a) & 63;
            index[index_pos as usize] = Rgba([r, g, b, a]);
        }

        data[pos] = r;
        data[pos + 1] = g;
        data[pos + 2] = b;
        data[pos + 3] = a;
        pos += 4;
    }

    Ok(RgbaImage::from_vec(width as u32, height as u32, data).ok_or_else(|| QOIFError::new("failed to fill whole buffer"))?)
}
