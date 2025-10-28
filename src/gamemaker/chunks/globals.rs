use bytes::Bytes;
use crate::gamemaker::common::{GameMakerChunk, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone)]
pub(crate) struct Globals {
    pub(crate) code_indices: Vec<i32>
}

impl GameMakerChunk for Globals {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        Globals {
            code_indices: Vec::from_bytes(data)
        }
    }
}
