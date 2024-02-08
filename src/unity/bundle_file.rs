use bytes::{Bytes, Buf, BytesMut, BufMut};
use crate::unity::compression::decompress;
use crate::utils::{BufExt, lz4_decompress};

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
pub struct BlockFlags {
    pub compression_type: u8,
    pub is_streamed: bool
}

impl BlockFlags {
    pub fn from_bits(i: u16) -> BlockFlags {
        BlockFlags {
            compression_type: (&i & 0x3f) as u8,
            is_streamed: (&i & 0x40) == 0x40
        }
    }
}

#[derive(Debug)]
pub struct BlockInfo {
    pub compressed_size: usize,
    pub uncompressed_size: usize,
    pub flags: BlockFlags
}

impl BlockInfo {

}

#[derive(Debug)]
pub struct NodeFlags {
    // TODO
}

impl NodeFlags {
    pub fn from_bits(i: u32) -> NodeFlags {
        NodeFlags {
            // TODO
        }
    }
}

#[derive(Debug)]
pub struct Node {
    pub offset: usize,
    pub size: usize,
    pub flags: NodeFlags,
    pub path: String
}

#[derive(Debug)]
pub struct StorageInfo {
    pub blocks: Vec<BlockInfo>,
    pub nodes: Vec<Node>,
    pub data_hash: Bytes,
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
        let h = BundleFileHeader {
            magic: data.get_cstring(),
            version: data.get_i32(),
            unity_version: data.get_cstring(),
            unity_revision: data.get_cstring(),
            size: data.get_u64(),
            compressed_block_info_size: data.get_u32(),
            uncompressed_block_info_size: data.get_u32(),
            flags: BundleFlags::from_bits(data.get_u32())
        };
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
            blocks.push(BlockInfo {
                compressed_size: decomp.get_u32() as usize,
                uncompressed_size: decomp.get_u32() as usize,
                flags: BlockFlags::from_bits(decomp.get_u16())
            });
        }
        let node_count = decomp.get_u32();
        let mut nodes = Vec::<Node>::new();
        for _ in 0..node_count {
            nodes.push(Node {
                offset: decomp.get_u64() as usize,
                size: decomp.get_u64() as usize,
                flags: NodeFlags::from_bits(decomp.get_u32()),
                path: decomp.get_cstring()
            });
        }
        StorageInfo {
            data_hash,
            blocks,
            nodes
        }
    }
}
