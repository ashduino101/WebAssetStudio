use std::io::{Cursor, Seek, SeekFrom};
use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use crate::gamemaker::iff::IFFReader;
use crate::load_audio;
use crate::logger::warning;

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
    fn handle_chunk(&mut self, chunk_id: &str, data: &mut Cursor<&mut Bytes>) {
        match chunk_id {
            "AUDO" => {
                let num_samples = data.get_u32_le();
                let mut sample_offsets = Vec::new();
                for _ in 0..num_samples {
                    sample_offsets.push(data.get_u32_le());
                }
                for offset in sample_offsets {
                    let start_pos = data.position();
                    data.seek(SeekFrom::Start(offset as u64)).expect("failed to seek");
                    let len = data.get_u32_le();
                    let audio = data.copy_to_bytes(len as usize);
                    load_audio(audio);
                    data.seek(SeekFrom::Start(start_pos)).expect("failed to seek");
                }
            },
            _ => {
                warning!("Unhandled chunk {}!", chunk_id);
            }
        }
    }
}
