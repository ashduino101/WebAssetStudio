use bytes::Bytes;

pub(crate) struct GameMakerContext {
    base_data: Bytes
}

impl GameMakerContext {
    pub(crate) fn create(d: Bytes) -> Self {
        GameMakerContext { base_data: d }
    }

    pub(crate) fn data(&self) -> &Bytes {
        &self.base_data
    }
}
