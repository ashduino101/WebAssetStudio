use bytes::{Bytes, Buf, BytesMut, BufMut};
use crate::utils::{BufExt, lz4_decompress};

#[derive(Debug)]
pub struct BundleFileHeader {
    magic: String,
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
    compression_type: u8,
    has_dir_info: bool,
    block_info_at_end: bool,
    old_web_plugin_compat: bool,
    block_info_has_padding: bool
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
    compression_type: u8,
    is_streamed: bool
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
pub struct BundleFile {
    header: BundleFileHeader
}

impl BundleFile {
    pub fn new(data: &mut Bytes) -> BundleFile {
        BundleFile::from_bytes(data)
    }

    fn from_bytes(data: &mut Bytes) -> BundleFile {
        let header = Self::parse_header(data);
        let block_info = Self::parse_block_info(data, header.compressed_block_info_size,
                                                header.uncompressed_block_info_size, &header.flags);
        Self { header }
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

    fn parse_block_info(data: &mut Bytes, compressed_block_info_size: u32, uncompressed_block_info_size: u32, flags: &BundleFlags) {
        let mut comp_block = data.slice(0..compressed_block_info_size as usize);
        let mut decomp = match flags.compression_type {
            0 => Bytes::from(comp_block),
            1 => panic!("lzma not supported"),  // TODO lzma
            2 => lz4_decompress(&comp_block[..], uncompressed_block_info_size as usize).expect("could not decompress lz4"),
            3 => lz4_decompress(&comp_block[..], uncompressed_block_info_size as usize).expect("could not decompress lz4hc"),
            _ => panic!("unsupported compression method")
        };
        let data_hash = decomp.slice(0..16);
        decomp.advance(16);
        println!("{:x?}", data_hash);
        let block_info_count = decomp.get_u32();
        println!("{}", block_info_count);
        for _ in 0..block_info_count {
            let uncompressed_size = decomp.get_u32();
            let compressed_size = decomp.get_u32();
            let flags = BlockFlags::from_bits(decomp.get_u16());
            println!("{} {} {:?}", uncompressed_size, compressed_size, flags);
        }
        let node_count = decomp.get_u32();
        for _ in 0..node_count {
            let offset = decomp.get_u64();
            let size = decomp.get_u64();
            let flags = decomp.get_u32();
            let path = decomp.get_cstring();
            println!("{} {} {} {}", offset, size, flags, path);
        }
    }
}
