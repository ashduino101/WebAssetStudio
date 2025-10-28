use std::io::Cursor;
use bytes::{Buf, Bytes};
use bzip2_rs::decoder::{Decoder, ReadState, WriteState};
use image::{ImageFormat, ImageReader, RgbaImage};
use wasm_bindgen::JsCast;
use web_sys::{Document, Element, HtmlImageElement};
use crate::base::asset::{Asset, Export, Void};
use crate::gamemaker::common::{GameMakerChunk, Ptr, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::gamemaker::qoi::decode_qoi;
use crate::logger::info;
use crate::utils::buf::FromBytes;
use crate::utils::debug::load_image;
use crate::utils::dom::{create_data_url, create_img};
use crate::utils::time::now;

pub(crate) struct TextureChunk {
    pub(crate) textures: Vec<Texture>
}

impl GameMakerChunk for TextureChunk {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        let mut c = TextureChunk {
            textures: PtrList::<Texture>::from_bytes(data).read_all_from(ctx)
        };
        for t in &mut c.textures {
            t.load(ctx);
        }
        c
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Texture {
    scaled: i32,
    generated_mips: i32,
    size: u32,
    width: u32,
    height: u32,
    local_id: i32,
    ptr: Ptr<Void>,
    data: Option<Bytes>
}

impl Texture {
    fn load(&mut self, ctx: &GameMakerContext) {
        self.data = Some(ctx.data().slice(self.ptr.ptr..self.ptr.ptr + self.size as usize));
    }
}

impl FromBytes for Texture {
    fn from_bytes(data: &mut Bytes) -> Self {
        let scaled = data.get_i32_le();
        let generated_mips = data.get_i32_le();  // 2+
        let size = data.get_u32_le();  // 2022.3+
        let width = data.get_u32_le();  // 2022.9+
        let height = data.get_u32_le();  // 2022.9+
        let local_id = data.get_i32_le();  // 2022.9+
        let ptr = Ptr::from_bytes(data);
        Texture {
            scaled,
            generated_mips,
            size,
            width,
            height,
            local_id,
            ptr,
            data: None,
        }
    }
}

impl Texture {
    fn make_image(&self) -> RgbaImage {
        let mut d = self.data.clone().unwrap();
        let magic = d.slice(0..4).get_u32_le();
        let image = if magic == 0x716f6966 {  // QOI, uncompressed
            decode_qoi(&mut d).unwrap()
        } else if magic == 0x716f7a32 {  // QOI + BZ2
            d.get_u32_le();  // skip magic
            d.get_u32_le();  // skip w/h
            d.get_u32_le();  // skip uncompressed size
            let mut decoder = Decoder::new();
            let mut bzip_data = d;
            let mut buf = [0; 1024];
            let mut output = Vec::new();
            loop {
                match decoder.read(&mut buf).unwrap() {
                    ReadState::NeedsWrite(space) => {
                        match decoder.write(&bzip_data).unwrap() {
                            WriteState::NeedsRead => unreachable!(),
                            WriteState::Written(written) => bzip_data.advance(written),
                        };
                    }
                    ReadState::Read(n) => {
                        output.extend_from_slice(&buf[..n]);
                    }
                    ReadState::Eof => {
                        break;
                    }
                }
            }
            decode_qoi(&mut Bytes::from(output)).unwrap()
        } else if magic == 0x474e5089 {  // PNG
            ImageReader::new(Cursor::new(d)).with_guessed_format().unwrap().decode().unwrap().into()
        } else {
            // TODO error handling
            panic!("unknown format");
        };

        let s = now();
        info!("decode took {}ms", now() - s);
        image
    }
}

impl Asset for Texture {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        let elem = doc.create_element("img").unwrap();
        let elem = elem.unchecked_into::<HtmlImageElement>();
        let start = now();
        elem.set_attribute("src", &create_img(&self.make_image().as_raw()[..], self.width as usize, self.height as usize, false)).unwrap();
        let mut style = elem.style();
        style.set_property("max-width", "100%").unwrap();
        style.set_property("max-height", "100%").unwrap();
        style.set_property("background", "repeating-conic-gradient(#ddd 0% 25%, #0000004d 0% 50%) 50% / 20px 20px").unwrap();
        style.set_property("position", "relative").unwrap();
        style.set_property("top", "50%").unwrap();
        style.set_property("left", "50%").unwrap();
        style.set_property("transform", "translate(-50%, -50%)").unwrap();
        style.set_property("display", "block").unwrap();
        info!("converted to native image in {}ms", now() - start);
        parent.append_child(&elem).unwrap();
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}
