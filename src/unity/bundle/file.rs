use bytes::{Bytes, Buf, BytesMut, BufMut};
use crate::unity::bundle::block::{BlockFlags, BlockInfo};
use crate::unity::bundle::node::{Node, NodeFlags};
use crate::unity::bundle::storage::StorageInfo;
use crate::unity::compression::decompress;
use crate::utils::{BufExt, FromBytes, lz4_decompress};

#[derive(Debug)]
pub struct BundleFileHeader {
    pub magic: String,
    pub version: i32,
    pub unity_version: String,
    pub unity_revision: String,
    pub size: u64,
    pub compressed_block_info_size: u32,
    pub uncompressed_block_info_size: u32,
    pub flags: BundleFlags,
}

impl FromBytes for BundleFileHeader {
    fn from_bytes(data: &mut Bytes) -> Self {
        BundleFileHeader {
            magic: data.get_cstring(),
            version: data.get_i32(),
            unity_version: data.get_cstring(),
            unity_revision: data.get_cstring(),
            size: data.get_u64(),
            compressed_block_info_size: data.get_u32(),
            uncompressed_block_info_size: data.get_u32(),
            flags: BundleFlags::from_bits(data.get_u32())
        }
    }
}

#[derive(Debug)]
pub struct BundleFlags {
    pub compression_type: u8,
    pub has_dir_info: bool,
    pub block_info_at_end: bool,
    pub old_web_plugin_compat: bool,
    pub block_info_has_padding: bool
}

impl BundleFlags {
    pub fn from_bits(i: u32) -> BundleFlags {
        BundleFlags {
            compression_type: (&i & 0x3f) as u8,
            has_dir_info: (&i & 0x40) == 0x40,
            block_info_at_end: (&i & 0x80) == 0x80,
            old_web_plugin_compat: (&i & 0x100) == 0x100,
            block_info_has_padding: (&i & 0x200) == 0x200
        }
    }
}

#[derive(Debug)]
pub struct BundleFile {
    pub header: BundleFileHeader,
    pub storage: StorageInfo
}

impl BundleFile {
    pub fn new(data: &mut Bytes) -> BundleFile {
        BundleFile::from_bytes(data)
    }

    fn from_bytes(data: &mut Bytes) -> BundleFile {
        let header = Self::parse_header(data);
        let storage = Self::parse_storage_info(data, header.compressed_block_info_size,
                                               header.uncompressed_block_info_size, &header.flags);
        Self { header, storage }
    }

    fn parse_header(data: &mut Bytes) -> BundleFileHeader {
        let h = BundleFileHeader::from_bytes(data);
        if h.version >= 7 {
            data.align(h.size as usize, 16);
        }
        h
    }

    fn parse_storage_info(data: &mut Bytes, compressed_block_info_size: u32, uncompressed_block_info_size: u32, flags: &BundleFlags) -> StorageInfo {
        let mut decomp = decompress(
            data,
            flags.compression_type,
            compressed_block_info_size as usize,
            uncompressed_block_info_size as usize
        );
        let data_hash = decomp.slice(0..16);
        decomp.advance(16);
        let block_info_count = decomp.get_u32();
        let mut blocks = Vec::<BlockInfo>::new();
        for _ in 0..block_info_count {
            blocks.push(BlockInfo::from_bytes(&mut decomp));
        }
        let node_count = decomp.get_u32();
        let mut nodes = Vec::<Node>::new();
        for _ in 0..node_count {
            nodes.push(Node::from_bytes(&mut decomp));
        }
        StorageInfo {
            data_hash,
            blocks,
            nodes
        }
    }
}
