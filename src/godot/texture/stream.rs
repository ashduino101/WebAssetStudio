use anyhow::anyhow;
use bytes::{Buf, Bytes};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::studio::components::asset_views::image::ImageView;
use crate::studio::components::base::WidgetComponent;
use crate::utils::dom::create_data_url;
use crate::utils::tex::decoder::{decode, TextureFormat};
use crate::utils::tex::pngenc::encode_png;

const FORMAT_MASK_IMAGE_FORMAT: u32 = (1 << 20) - 1;
const FORMAT_BIT_LOSSLESS: u32 = 1 << 20;
const FORMAT_BIT_LOSSY: u32 = 1 << 21;
const FORMAT_BIT_STREAM: u32 = 1 << 22;
const FORMAT_BIT_HAS_MIPMAPS: u32 = 1 << 23;
const FORMAT_BIT_DETECT_3D: u32 = 1 << 24;
const FORMAT_BIT_DETECT_SRGB: u32 = 1 << 25;  // legacy
const FORMAT_BIT_DETECT_NORMAL: u32 = 1 << 26;
const FORMAT_BIT_DETECT_ROUGHNESS: u32 = 1 << 27;  // CompressedTexture only

fn get_format(format: u32) -> anyhow::Result<TextureFormat> {
    Ok(match format {
        0 => TextureFormat::L8, // luminance
        1 => TextureFormat::LA16, // luminance-alpha
        2 => TextureFormat::R8,
        3 => TextureFormat::RG16,
        4 => TextureFormat::RGB24,
        5 => TextureFormat::RGBA32,
        6 => TextureFormat::RGBA4444,
        7 => TextureFormat::RGBA5551,
        8 => TextureFormat::RFloat, // float
        9 => TextureFormat::RGFloat,
        10 => TextureFormat::RGBFloat,
        11 => TextureFormat::RGBAFloat,
        12 => TextureFormat::RHalf,
        13 => TextureFormat::RGHalf,
        14 => TextureFormat::RGBHalf,
        15 => TextureFormat::RGBAHalf,
        16 => TextureFormat::RGB9e5Float,
        17 => TextureFormat::DXT1,
        18 => TextureFormat::DXT3,
        19 => TextureFormat::DXT5,
        20 => TextureFormat::BC4,
        21 => TextureFormat::BC5,
        22 => TextureFormat::BC6H,
        23 => TextureFormat::BPTCRGBF,  // unsupported
        24 => TextureFormat::BPTCRGBFU,  // unsupported
        25 => TextureFormat::ETCRGB4,
        26 => TextureFormat::ETC2R11,  // unsupported
        27 => TextureFormat::ETC2R11S,  // signed, NOT srgb. unsupported
        28 => TextureFormat::ETC2RG11,  // unsupported
        29 => TextureFormat::ETC2RG11S,  // unsupported
        30 => TextureFormat::ETC2RGB,
        31 => TextureFormat::ETC2RGBA8,
        32 => TextureFormat::ETC2RGBA1,
        33 => TextureFormat::ETC2RAASRG,  // unsupported
        34 => TextureFormat::DXT5RAASRG,  // unsupported
        35 => TextureFormat::ASTCRGB4x4,
        36 => TextureFormat::ASTCHDR4x4,
        37 => TextureFormat::ASTCRGB8x8,
        38 => TextureFormat::ASTCHDR8x8,
        _ => Err(anyhow!("unknown format {format}"))?
    })
}

#[derive(Debug, Clone)]
pub(crate) struct StreamTexMipMap {
    format: String,
    data: Bytes
}

#[derive(Debug, Clone)]
pub(crate) struct StreamTexture {
    width: usize,
    height: usize,
    custom_width: usize,
    custom_height: usize,
    flags: u32,
    mips: Vec<StreamTexMipMap>
}

impl StreamTexture {
    pub(crate) fn from_bytes(data: &mut Bytes) -> anyhow::Result<StreamTexture> {
        if data.get_chars(4) != "GDST" {
            return Err(anyhow!("not a Godot stream texture"));
        }
        let width = data.get_u16_le();
        let custom_width = data.get_u16_le();
        let height = data.get_u16_le();
        let custom_height = data.get_u16_le();

        let flags = data.get_u32_le();
        let data_format = data.get_u32_le();
        let mut mipmaps = 1;
        let images = if data_format & FORMAT_BIT_LOSSLESS != 0 || data_format & FORMAT_BIT_LOSSY != 0 {
            mipmaps = data.get_u32_le();
            let size = data.get_u32_le() as usize;
            let mut images = Vec::new();
            for _ in 0..mipmaps {
                let format = data.get_chars(4);
                let data = data.slice(0..size - 4);
                images.push(StreamTexMipMap { format, data });
            }
            images
        } else {
            let format = get_format(data_format)?;
            let size = data.get_u32_le() as usize;
            let data = decode(format, data, width as usize, height as usize, false);
            let png = encode_png(width as u32, height as u32, &data[..], false);
            vec![StreamTexMipMap {
                format: "PNG ".to_string(),
                data: Bytes::from(png),
            }]
        };
        Ok(StreamTexture {
            width: width as usize,
            height: height as usize,
            custom_width: custom_width as usize,
            custom_height: custom_height as usize,
            flags,
            mips: images,
        })
    }
}

impl Asset for StreamTexture {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        let view = ImageView::from_url_list(&self.mips.iter().map(|m| {
            create_data_url(&m.data[..], match m.format.as_str() {
                // TODO: not sure about these formats
                "PNG " => "image/png",
                "WEBP" => "image/webp",
                "JPEG" | "JPG " => "image/jpeg",
                _ => "application/octet-stream"
            })
        }).collect());
        view.render(parent);
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}
