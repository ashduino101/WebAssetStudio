use std::io::{Cursor, Seek, SeekFrom};
use bytes::{Buf, Bytes};
use bzip2_rs::decoder::{Decoder, ReadState, WriteState};
use image::{DynamicImage, ImageDecoder, ImageReader, RgbaImage};
use image::codecs::png::PngDecoder;

use crate::gamemaker::iff::IFFReader;
use crate::gamemaker::qoi::decode_qoi;
use crate::load_audio;
use crate::logger::warning;
use crate::logger::info;
use crate::utils::debug::load_image;

pub struct GameMakerFile {
}

impl GameMakerFile {
    pub fn new(data: &mut Bytes) -> GameMakerFile {
        let mut g = GameMakerFile {};
        g.parse(&mut Cursor::new(data));
        g
    }
}

impl IFFReader for GameMakerFile {
    fn handle_chunk(&mut self, chunk_id: &str, size: usize, data: &mut Cursor<&mut Bytes>) {
        match chunk_id {
            "AUDO" => {
                let num_samples = data.get_u32_le();
                let mut sample_offsets = Vec::new();
                for _ in 0..num_samples {
                    sample_offsets.push(data.get_u32_le());
                }
                for offset in sample_offsets {
                    data.seek(SeekFrom::Start(offset as u64)).expect("failed to seek");

                    let len = data.get_u32_le();
                    let audio = data.copy_to_bytes(len as usize);
                    load_audio(audio);
                }
            },
            "TXTR" => {
                let num_textures = data.get_u32_le();
                let mut texture_offsets = Vec::new();
                for _ in 0..num_textures {
                    texture_offsets.push(data.get_u32_le());
                }
                for offset in texture_offsets {
                    continue;
                    info!("loading image at {}", offset);
                    // TODO: versioning
                    data.seek(SeekFrom::Start(offset as u64)).expect("failed to seek");

                    let scaled = data.get_u32_le();
                    let generated_mips = data.get_u32_le();  // 2+
                    let data_length = data.get_u32_le();  // 2022.3+
                    let width = data.get_u32_le();  // 2022.9+
                    let height = data.get_u32_le();  // 2022.9+
                    let index = data.get_u32_le();  // 2022.9+
                    let ptr = data.get_u32_le();

                    data.seek(SeekFrom::Start(ptr as u64)).expect("failed to seek");
                    let magic = data.get_u32_le();
                    let image = if magic == 0x716f6966 {  // QOI, uncompressed
                        data.seek(SeekFrom::Current(-4)).expect("failed to seek");
                        decode_qoi(&mut data.copy_to_bytes(data_length as usize)).unwrap()
                    } else if magic == 0x716f7a32 {  // QOI + BZ2
                        data.get_u32_le();  // skip w/h
                        data.get_u32_le();  // skip uncompressed size
                        let mut decoder = Decoder::new();
                        let mut bzip_data = data.copy_to_bytes((data_length - 12) as usize);
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
                        data.seek(SeekFrom::Current(-4)).expect("failed to seek");
                        ImageReader::new(Cursor::new(data.copy_to_bytes(data_length as usize))).with_guessed_format().unwrap().decode().unwrap().into()
                    } else {
                        // TODO error handling
                        panic!("unknown format");
                    };

                    load_image(image);
                }
            }
            _ => {
                warning!("Unhandled chunk {} of size {}!", chunk_id, size);
            }
        }
    }
}
