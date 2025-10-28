use bytes::Bytes;
use crate::gamemaker::common::{CString, GameMakerChunk, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone)]
pub(crate) struct FeatureFlags {
    pub(crate) flags: Vec<String>
}

impl GameMakerChunk for FeatureFlags {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        FeatureFlags {
            flags: PtrList::<CString>::from_bytes(data).read_all_from(ctx).iter().map(|s| s.clone().into_inner()).collect(),
        }
    }
}