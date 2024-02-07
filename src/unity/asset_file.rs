use bytes::{Bytes, Buf, BytesMut, BufMut};

#[derive(Debug)]
pub struct AssetFileHeader {
    metadata_size: u32,
    file_size: u32,
}

#[derive(Debug)]
pub struct AssetFile {
    header: AssetFileHeader
}

impl AssetFile {
    pub fn new(data: &mut Bytes) -> AssetFile {
        AssetFile::from_bytes(data)
    }

    fn from_bytes(data: &mut Bytes) -> AssetFile {
        let header = Self::parse_header(data);
        Self { header }
    }

    fn parse_header(data: &mut Bytes) -> AssetFileHeader {
        let metadata_size = data.get_u32();
        let file_size = data.get_u32();
        AssetFileHeader { metadata_size, file_size }
    }
}
