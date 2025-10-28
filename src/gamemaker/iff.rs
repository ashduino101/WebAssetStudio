// Parser for the IFF-standard files that GameMaker uses.

use std::io::Cursor;
use bytes::{Buf, Bytes};
use crate::gamemaker::ctx::GameMakerContext;
// use crate::utils::buf::BufExt;

pub trait IFFReader {
    fn new(data: &mut Bytes) {}
    fn parse(&mut self, ctx: &mut GameMakerContext, data: &mut Bytes) {
        let magic = data.get_chars(4);
        let data_size = data.get_u32_le();
        while data.remaining() > 0 {
            let chunk_id = data.get_chars(4);
            let data_length = data.get_u32_le() as usize;
            self.handle_chunk(ctx, &chunk_id, data_length, &mut data.slice(0..data_length));
            data.advance(data_length);
        }
    }
    fn handle_chunk(&mut self, ctx: &mut GameMakerContext, chunk_id: &str, size: usize, data: &mut Bytes);
}
