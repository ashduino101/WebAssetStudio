use std::io::{Cursor, Seek, SeekFrom};
use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use crate::gamemaker::iff::IFFReader;
use crate::logger::warning;

static MODULE_NAME: &str = "AudioGroup";

pub struct AudioGroup {
    pub(crate) samples: Vec<Bytes>
}

impl AudioGroup {
    pub fn new(data: &mut Bytes) -> AudioGroup {
        let mut g = AudioGroup { samples: Vec::new() };
        g.parse(&mut Cursor::new(data));
        g
    }
}

impl IFFReader for AudioGroup {
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
                    self.samples.push(data.copy_to_bytes(len as usize));
                    data.seek(SeekFrom::Start(start_pos)).expect("failed to seek");
                }
            },
            _ => {
                warning!("Unhandled chunk {}!", chunk_id);
            }
        }
    }
}
