use bytes::{Bytes, Buf, BytesMut, BufMut};

#[derive(Debug)]
pub struct BundleFileHeader {
    magic: String
}

#[derive(Debug)]
pub struct BundleFile {
    header: BundleFileHeader
}

impl BundleFile {
    pub fn new(data: &mut Bytes) -> BundleFile {
        BundleFile::from_bytes(data)
    }

    fn from_bytes(data: &mut Bytes) -> BundleFile {
        let header = Self::parse_header(data);
        Self { header }
    }

    fn parse_header(data: &mut Bytes) -> BundleFileHeader {

        BundleFileHeader {

        }
    }
}
