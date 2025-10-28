use std::marker::PhantomData;
use bytes::{Buf, Bytes};
use crate::gamemaker::ctx::GameMakerContext;
use crate::utils::buf::FromBytes;

trait AsPtr: FromBytes + Default {}
impl<T: FromBytes + Default> AsPtr for T {}

#[derive(Debug, Clone, Default)]
pub(crate) struct Ptr<T: AsPtr> {
    pub(crate) ptr: usize,
    _pd: PhantomData<T>
}

impl<T: AsPtr> FromBytes for Ptr<T> {
    fn from_bytes(data: &mut Bytes) -> Self {
        Ptr {
            ptr: data.get_u32_le() as usize,
            _pd: Default::default()
        }
    }
}

impl<T: AsPtr> Ptr<T> {
    pub(crate) fn read_from(&self, ctx: &GameMakerContext) -> T {
        if self.ptr == 0 {
            return T::default()
        }
        T::from_bytes(&mut ctx.data().slice(self.ptr..))
    }
}

pub(crate) struct PtrList<T: AsPtr> {
    v: Vec<Ptr<T>>
}

impl<T: AsPtr> FromBytes for PtrList<T> {
    fn from_bytes(data: &mut Bytes) -> Self {
        let mut v = Vec::new();
        let n = data.get_u32_le();
        for _ in 0..n {
            v.push(Ptr::from_bytes(data));
        }
        PtrList { v }
    }
}

impl<T: AsPtr> PtrList<T> {
    pub(crate) fn read_all_from(&self, ctx: &GameMakerContext) -> Vec<T> {
        let mut v = Vec::new();
        for p in &self.v {
            v.push(T::from_bytes(&mut ctx.data().slice(p.ptr..)))
        }
        v
    }
}

pub(crate) trait GameMakerChunk {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self;
}

#[derive(Debug, Clone, Default)]
pub(crate) struct CString {
    inner: String
}

impl FromBytes for CString {
    fn from_bytes(data: &mut Bytes) -> Self {
        CString {
            inner: data.get_cstring()
        }
    }
}

impl CString {
    pub(crate) fn into_inner(self) -> String { self.inner }
}

