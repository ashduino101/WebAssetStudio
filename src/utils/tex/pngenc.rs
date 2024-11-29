use std::io::{Read, Write};
use wasm_bindgen::{Clamped, JsValue};
use wasm_bindgen_futures::JsFuture;
use web_sys::{window, Blob, CanvasRenderingContext2d, ImageBitmap, ImageData, ImageEncodeOptions, OffscreenCanvas};

fn flip_v(width: usize, height: usize, data: &[u8]) -> Box<[u8]> {
    let mut out = Vec::new();
    for y in 0..height {
        for x in 0..width {
            let ry = height - y - 1;
            out.write_all(&[
                data[(ry * width + x) * 4],
                data[(ry * width + x) * 4 + 1],
                data[(ry * width + x) * 4 + 2],
                data[(ry * width + x) * 4 + 3]
            ]).expect("flip_v");
        }
    }
    out.into()
}

pub fn encode_png(width: u32, height: u32, data: &[u8], flip: bool) -> Box<[u8]> {
    if width == 0 || height == 0 {
        return [].into();
    }
    let mut w = Vec::new();
    let mut encoder  = png::Encoder::new(&mut w, width, height);
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    encoder.set_compression(png::Compression::Fast);
    let mut writer = encoder.write_header().unwrap();
    let mut datavec = (if flip {flip_v(width as usize, height as usize, &data)} else {data.into()})[0..(width * height * 4) as usize].to_vec();
    datavec.extend(std::iter::repeat(0).take(((width * height * 4) - datavec.len() as u32) as usize));
    writer.write_image_data(&datavec).unwrap();
    writer.finish().unwrap();
    w.into()
}

pub async fn encode_png_native(width: u32, height: u32, data: &[u8], flip: bool) -> Blob {
    let mut datavec = (if flip {flip_v(width as usize, height as usize, &data)} else {data.into()})[0..(width * height * 4) as usize].to_vec();
    datavec.extend(std::iter::repeat(0).take(((width * height * 4) - datavec.len() as u32) as usize));
    // let window = window().unwrap();
    let canvas = OffscreenCanvas::new(width, height).unwrap();
    let ctx = CanvasRenderingContext2d::from(JsValue::from(canvas.get_context("2d").unwrap().unwrap()));
    let arr = Clamped(data);
    let bmp = ImageData::new_with_u8_clamped_array_and_sh(arr, width, height).unwrap();
    ctx.put_image_data(&bmp, 0.0, 0.0).unwrap();
    let opts = ImageEncodeOptions::new();
    opts.set_type("image/png");
    Blob::from(JsFuture::from(canvas.convert_to_blob_with_options(&opts).unwrap()).await.unwrap())
}
