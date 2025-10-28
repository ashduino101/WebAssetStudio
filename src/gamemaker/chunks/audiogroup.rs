use bytes::Bytes;
use crate::gamemaker::common::{CString, GameMakerChunk, Ptr, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::utils::buf::FromBytes;

#[derive(Debug, Clone)]
pub(crate) struct AudioGroups {
    pub(crate) groups: Vec<String>
}

impl GameMakerChunk for AudioGroups {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        AudioGroups {
            groups: PtrList::<Ptr<CString>>::from_bytes(data).read_all_from(ctx).iter().map(|s| s.read_from(ctx).into_inner()).collect(),
        }
    }
}
