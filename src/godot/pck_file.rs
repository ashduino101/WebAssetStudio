use std::sync::{Arc, Mutex, MutexGuard};
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use crate::base::asset::{Asset, AssetMetadata};
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::{AssetProvider, ProviderMetadata};
use crate::base::asset::types::AssetType;

#[derive(Debug, Clone)]
pub(crate) struct PckEntry {
    path: String,
    offset: usize,
    size: usize,
    hash: Bytes,
    flags: u32
}

impl PckEntry {
    pub(crate) fn from_bytes(data: &mut Bytes, format_version: i32, file_offset: usize, original_offset: usize) -> Self {
        let path = data.get_string();
        let offset = file_offset + data.get_u64_le() as usize - original_offset;
        let size = data.get_u64_le() as usize;
        let hash = data.slice(0..16);
        data.advance(16);
        let flags = if format_version >= 2 { data.get_u32_le() } else { 0 };

        PckEntry {
            path,
            offset,
            size,
            hash,
            flags,
        }
    }
}

#[derive(Debug, Clone)]
pub(crate) struct PckFile {
    format_version: i32,
    major: i32,
    minor: i32,
    patch: i32,
    file_flags: i32,
    file_offset: usize,
    files: Vec<PckEntry>
}

impl PckFile {
    pub(crate) fn new(data: &mut Bytes) -> anyhow::Result<Self> {
        if data.get_chars(4) != "GDPC" {
            return Err(anyhow!("Not a Godot PCK"));
        }
        let format_version = data.get_i32_le();
        let major = data.get_i32_le();
        let minor = data.get_i32_le();
        let patch = data.get_i32_le();

        let mut file_flags = 0;
        let mut file_offset = 0;
        if format_version >= 2 {
            file_flags = data.get_i32_le();
            file_offset = data.get_u64_le() as usize;
        }

        data.advance(64);  // reserved

        let num_files = data.get_i32_le();

        if file_flags & 1 != 0 {
            return Err(anyhow!("Cannot load encrypted PCK!"));
        }

        let mut files = Vec::new();
        for _ in 0..num_files {
            files.push(PckEntry::from_bytes(data, format_version, file_offset, 0));
        }

        Ok(PckFile {
            format_version,
            major,
            minor,
            patch,
            file_flags,
            file_offset,
            files,
        })
    }
}

impl BundleFile for PckFile {
    fn list_providers(&self) -> Vec<ProviderMetadata> {
        self.files.iter().map(|f| ProviderMetadata {
            name: f.path.clone(),
            id: f.path.clone(),
        }).collect()
    }

    fn list_blobs(&self) -> Vec<ProviderMetadata> {
        todo!()
    }

    fn get_provider(&mut self, id: String) -> Option<Arc<Box<dyn AssetProvider>>> {
        todo!()
    }

    fn get_blob(&mut self, id: String) -> Option<Bytes> {
        todo!()
    }
}
