// Parser for the IFF-standard files that GameMaker uses.

use std::io::Cursor;
use bytes::{Buf, Bytes};
// use crate::utils::buf::BufExt;

pub trait IFFReader {
    fn new(data: &mut Bytes) {}
    fn parse(&mut self, data: &mut Cursor<&mut Bytes>) {
        let magic = data.get_chars(4);
        let data_size = data.get_u32_le();
        while data.remaining() > 0 {
            let chunk_id = data.get_chars(4);
            let data_length = data.get_u32_le() as usize;
            // Keep track of position in order to read
            // anything that was not read by the handler function
            let start_offset = data.position();
            self.handle_chunk(&chunk_id, data);
            let end_offset = data.position();
            data.advance(data_length - (end_offset - start_offset) as usize);
        }
    }
    fn handle_chunk(&mut self, chunk_id: &str, data: &mut Cursor<&mut Bytes>);
}
