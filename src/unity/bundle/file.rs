use std::collections::HashMap;
use std::fmt;
use std::fmt::Debug;
use std::iter::FromIterator;
use std::rc::Rc;
use std::sync::Arc;
use bytes::{Bytes, Buf, BytesMut, BufMut};
use regex::Regex;
use wasm_bindgen_test::console_log;
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::{AssetProvider, ProviderMetadata};
use crate::logger::info;
use crate::unity::assets::file::AssetFile;
use crate::unity::assets::typetree::ObjectError;

use crate::unity::bundle::block::{BlockInfo};
use crate::unity::bundle::node::{Node};
use crate::unity::bundle::storage::StorageInfo;
use crate::unity::compression::decompress;
use crate::utils::buf::{BufExt, FromBytes};
use crate::utils::debug::download_file;

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
        let magic = data.get_cstring();
        if !magic.starts_with("Unity") {  // might need more checks
            panic!("not a Unity asset bundle!");
        };
        BundleFileHeader {
            magic,
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

pub struct UnityBundleFile {
    pub header: BundleFileHeader,
    pub storage: StorageInfo,
    block_data: Bytes,
    block_cache: HashMap<usize, Bytes>,
    file_cache: HashMap<String, Bytes>,

    archive_pat: Regex,  // TODO: init this statically somehow?
                         //  we do it in the constructor because it is a relatively slow operation

    provider_cache: HashMap<String, Arc<Box<dyn AssetProvider>>>
}

impl Debug for UnityBundleFile {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("BundleFile")
            .field("header", &self.header)
            .field("storage", &self.storage)
            .finish()
    }
}

impl UnityBundleFile {
    pub fn new(data: Bytes) -> UnityBundleFile {
        UnityBundleFile::from_bytes(data)
    }

    fn from_bytes(mut data: Bytes) -> UnityBundleFile {
        let header = Self::parse_header(&mut data);
        let storage = Self::parse_storage_info(&mut data, header.compressed_block_info_size,
                                               header.uncompressed_block_info_size, &header.flags);

        Self {
            header,
            storage,
            block_data: data,
            block_cache: HashMap::new(),
            file_cache: HashMap::new(),
            archive_pat: Regex::new(
            r#"archive:/[\w\d\-_.'"\[\]{}()]+/(.*)"#)
                .expect("compile error"),
            provider_cache: HashMap::new()
        }
    }

    fn parse_header(data: &mut Bytes) -> BundleFileHeader {
        let start_len = data.len();
        let h = BundleFileHeader::from_bytes(data);
        if h.version >= 7 {
            data.align(start_len, 16);
        }
        h
    }

    fn parse_storage_info(data: &mut Bytes, compressed_block_info_size: u32, uncompressed_block_info_size: u32, flags: &BundleFlags) -> StorageInfo {
        let mut decomp = if flags.block_info_at_end {
            let mut infodata = data.slice(data.len() - compressed_block_info_size as usize..);
            decompress(
                &mut infodata,
                flags.compression_type,
                compressed_block_info_size as usize,
                uncompressed_block_info_size as usize
            )
        } else {
            let d = decompress(
                data,
                flags.compression_type,
                compressed_block_info_size as usize,
                uncompressed_block_info_size as usize
            );
            data.advance(compressed_block_info_size as usize);
            d
        };
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
        StorageInfo::new(blocks, nodes, data_hash)
    }

    pub fn list_files(&self) -> Vec<String> {
        Vec::from_iter(self.storage.nodes.iter().map(|n| n.path.clone()))
    }

    pub fn get_file(&mut self, path: &str) -> Option<Bytes> {
        let mut source = path.to_owned();

        if source.starts_with("archive:/") {
            let (_, [s]) = self.archive_pat.captures_iter(&source).map(|c| c.extract()).last().unwrap();
            source = s.into();
        }

        if self.file_cache.contains_key(&source) {
            return Some(self.file_cache.get(&source)?.clone());
        }

        let node = self.storage.get_node_by_path(&source)?;
        let data = if self.storage.blocks.len() == 1 {
            let b = if let Some(b) = self.block_cache.get(&0) {
                b.clone()
            } else {
                let block = &self.storage.blocks[0];
                let b = decompress(
                    &mut self.block_data.slice(0..block.compressed_size),
                    block.flags.compression_type,
                    block.compressed_size,
                    block.uncompressed_size
                );
                self.block_cache.insert(0, b.clone());
                b
            };
            Some(b.slice(node.offset..node.offset + node.size))
        } else {
            let (blocks, first_offset, raw_offset) = self.storage.get_blocks_for_node(node);
            let mut buf = BytesMut::new();
            let mut offset = first_offset;
            for block in blocks {
                let b = if let Some(b) = self.block_cache.get(&offset) {
                    b.clone()
                } else {
                    let b = decompress(
                        &mut self.block_data.slice(offset..offset + block.compressed_size),
                        block.flags.compression_type,
                        block.compressed_size,
                        block.uncompressed_size
                    );
                    self.block_cache.insert(offset, b.clone());
                    b
                };
                buf.put(b);
                offset += block.compressed_size;
            };
            if raw_offset > node.offset {
                // FIXME: this is reached when there is only one node, could it cause issues?
                Some(Bytes::from(buf))
            } else {
                let over = node.offset - raw_offset;
                Some(Bytes::from(buf).slice(over..))
            }
        };
        if let Some(b) = &data {
            self.file_cache.insert(source.clone(), b.clone());
        };
        data
    }
}

impl BundleFile for UnityBundleFile {
    fn list_providers(&self) -> Vec<ProviderMetadata> {
        self.list_files().iter().filter(|f| !f.ends_with(".resS")).map(|f| {
            ProviderMetadata {
                name: f.to_owned(),
                id: f.to_owned()
            }
        }).collect()
    }

    fn list_blobs(&self) -> Vec<ProviderMetadata> {
        self.list_files().iter().filter(|f| f.ends_with(".resS")).map(|f| {
            ProviderMetadata {
                name: f.to_owned(),
                id: f.to_owned()
            }
        }).collect()
    }

    fn get_provider(&mut self, id: String) -> Option<Arc<Box<dyn AssetProvider>>> {
        let e = self.provider_cache.get(&id);
        if e.is_some() { return e.map(|v| v.clone()); }

        info!("start loading {id}");
        let f = self.get_file(&id).map(|mut f| Box::new(AssetFile::new(&mut f)) as Box<dyn AssetProvider>);
        info!("finish loading {id}");
        if let Some(p) = f {
            self.provider_cache.insert(id.clone(), Arc::new(p));
            self.provider_cache.get(&id).map(|v| v.clone())
        } else { None }
    }

    fn get_blob(&mut self, id: String) -> Option<Bytes> {
        self.get_file(&id)
    }
}

unsafe impl Send for UnityBundleFile {}
unsafe impl Sync for UnityBundleFile {}
