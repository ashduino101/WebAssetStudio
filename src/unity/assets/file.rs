use std::collections::HashMap;
use std::fmt;
use std::fmt::Debug;
use std::io::Cursor;
use std::rc::Rc;
use std::sync::{Arc, Mutex, MutexGuard};
use bytes::{Bytes, Buf, BytesMut, BufMut};
use lzma_rs::xz_decompress;
use zerocopy::IntoBytes;
use crate::base::asset::{Asset, AssetMetadata, UnsupportedAsset};
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::AssetProvider;
use crate::base::asset::types::AssetType;
use crate::logger::{info, warning};
use crate::UnityVersion;

use crate::unity::assets::external::External;
use crate::unity::assets::typetree::{TypeInfo, TypeParser, ValueType};
use crate::unity::assets::wrappers::audioclip::AudioClipWrapper;
use crate::unity::assets::wrappers::mesh::MeshWrapper;
use crate::unity::assets::wrappers::text::TextWrapper;
use crate::unity::assets::wrappers::texture2d::Texture2DWrapper;
use crate::unity::object::identifier::LocalObjectIdentifier;
use crate::unity::object::info::ObjectInfo;

use crate::utils::buf::{BufExt, FromBytes};
use crate::utils::debug::download_file;
use crate::utils::time::now;

pub struct AssetFile {
    pub metadata_size: usize,
    pub file_size: usize,
    pub version: u32,
    pub data_offset: usize,
    pub little_endian: bool,
    pub unity_version: UnityVersion,
    pub platform: u32,
    pub enable_type_trees: bool,
    pub types: Vec<TypeInfo>,
    pub objects: Vec<ObjectInfo>,
    pub script_types: Vec<LocalObjectIdentifier>,
    pub externals: Vec<External>,
    pub object_data: Bytes
}

impl Debug for AssetFile {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.debug_struct("AssetFile")
            .field("metadata_size", &self.metadata_size)
            .field("file_size", &self.file_size)
            .field("version", &self.version)
            .field("data_offset", &self.data_offset)
            .field("little_endian", &self.little_endian)
            .field("unity_version", &self.unity_version)
            .field("platform", &self.platform)
            .field("enable_type_trees", &self.enable_type_trees)
            .field("types", &self.types)
            .field("objects", &self.objects)
            .field("script_types", &self.script_types)
            .field("externals", &self.externals)
            .finish()
    }
}

impl AssetFile {
    pub fn new(data: &mut Bytes) -> AssetFile {
        AssetFile::from_bytes(data)
    }

    fn from_bytes(data: &mut Bytes) -> Self {
        let original_data = data.clone();
        let start_length = data.len();  // keep track of the start length -- TODO: custom bytes wrapper
        let mut metadata_size = data.get_u32() as usize;
        let mut file_size = data.get_u32() as usize;
        let version = data.get_u32();
        let mut data_offset = data.get_u32() as usize;
        let little_endian = if version >= 9 { data.get_u32() == 0 } else { false };
        if version >= 22 {
            metadata_size = data.get_u32() as usize;
            file_size = data.get_u64() as usize;
            data_offset = data.get_u64() as usize;
            data.get_u64();  // unknown
        }

        let object_data = original_data.slice(data_offset..);
        // download_file(&object_data[..], "object_data.dat");

        let raw_version = if version >= 7 { data.get_cstring() } else { "2.5.0f5".to_owned() };
        let unity_version = UnityVersion::parse(&raw_version).unwrap();

        let platform = if version >= 8 { data.get_u32_ordered(little_endian) } else { 0 };
        let enable_type_trees = if version >= 13 { data.get_u8() != 0 } else { false };

        let num_types = data.get_u32_ordered(little_endian);
        let mut types = Vec::new();
        for _ in 0..num_types {
            types.push(TypeInfo::from_bytes(data, version, little_endian, enable_type_trees));
        }
        if !enable_type_trees {
            let old_types = types.clone();
            types.clear();

            // TODO: how do we know if it's editor or release?
            let mut trees_buf = include_bytes!("./release.xz");
            let mut trees_xz = Cursor::new(&mut trees_buf);
            let start = now();
            info!("Decompressing trees...");
            let mut trees = Vec::new();
            xz_decompress(&mut trees_xz, &mut trees).unwrap();
            info!("Finished in {}ms", now() - start);
            info!("{}", trees.len());
            let mut trees = Bytes::from(trees);
            let header_size = trees.get_u32_le() as usize;
            let string_data_size = trees.get_u32_le() as usize;
            let mut string_data = trees.slice(0..string_data_size);
            let mut strings = Vec::new();
            while string_data.has_remaining() {
                strings.push(string_data.get_cstring());
            }
            trees.advance(string_data_size);
            let num_versions = trees.get_u32_le();
            let mut offsets = HashMap::new();
            for _ in 0..num_versions {
                let version_len = trees.get_u16_le();
                let version = trees.get_chars(version_len as usize);
                let offset = trees.get_u32_le();
                offsets.insert(version, offset);
            }
            let maybe_offset = offsets.get(&raw_version);
            let offset = *match maybe_offset {
                Some(v) => v,
                None => {
                    panic!("unsupported unity version {}", raw_version);
                }
            } as usize;

            let mut data = trees.slice(offset..);
            let version = data.get_cstring();
            let num_types = data.get_u32_le();
            let mut new_types = Vec::new();
            for _ in 0..num_types {
                new_types.push(TypeInfo::from_stripped_bytes(&mut data, little_endian, &strings));
            }
            // maintain order
            for t in old_types {
                let new_type = new_types.iter().filter(|n| n.class_id == t.class_id).nth(0).unwrap();
                types.push(new_type.clone());
            }
        }

        let has_long_ids = if version >= 7 && version < 14 {
            data.get_i32_ordered(little_endian) != 0  // TODO: is this more significant than a bool?
        } else { false };

        let num_objects = data.get_u32_ordered(little_endian);
        let mut objects = Vec::new();
        for _ in 0..num_objects {
            objects.push(ObjectInfo::from_bytes(data, version, little_endian, has_long_ids, start_length));
        }

        let mut script_types = Vec::new();
        if version >= 11 {
            let num_scripts = data.get_u32_ordered(little_endian);
            for _ in 0..num_scripts {
                script_types.push(LocalObjectIdentifier::from_bytes(data, version, little_endian, start_length));
            }
        }

        let mut externals = Vec::new();
        let num_externals = data.get_u32_ordered(little_endian);
        for _ in 0..num_externals {
            externals.push(External::from_bytes(data, version, little_endian));
        }

        AssetFile {
            metadata_size,
            file_size,
            version,
            data_offset,
            little_endian,
            unity_version,
            platform,
            enable_type_trees,
            types,
            objects,
            script_types,
            externals,
            object_data
        }
    }

    fn get_asset_from_info(&self, object: &ObjectInfo) -> ValueType {
        let typ = &self.types[object.type_id as usize];
        let mut data = &mut self.object_data.slice(object.offset..(object.offset + object.size).min(self.object_data.len()));
        if data.len() < object.size {
            warning!("object size exceeds buffer size: {} > {}", object.size, data.len());
            let mut data = BytesMut::from(data.as_bytes());
            while data.len() < object.size {
                data.put_u8(0);
            }
            TypeParser::parse_object_from_info(typ, &mut Bytes::from(data))
        } else {
            TypeParser::parse_object_from_info(typ, data)
        }
    }
}

impl AssetProvider for AssetFile {
    fn list_assets(&self) -> Vec<AssetMetadata> {
        self.objects.iter().map(|o| {
            info!("get asset {} at {} ({})", o.path_id, o.offset, o.size);
            AssetMetadata {
                // TODO: do this without loading the entire asset
                name: self.get_asset_from_info(o).get("m_Name").ok().map_or("<unnamed>".to_owned(), |v| v.as_string().unwrap()),
                // name: o.path_id.to_string(),
                id: o.path_id.to_string(),
                asset_type: AssetType::Misc  // TODO
            }
        }).collect()
    }

    fn get_asset(&self, id: String, parent: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>> {
        // TODO: support more
        let object = *self.objects.iter().filter(|o| o.path_id.to_string() == id).collect::<Vec<_>>().first()?;
        let typ = &self.types[object.type_id as usize];
        let parsed = self.get_asset_from_info(object);
        if typ.class_id == 28 {
            return Some(Arc::new(Mutex::new(Box::new(Texture2DWrapper::from_value(&parsed, parent).ok()?) as Box<dyn Asset>)));
        }
        if typ.class_id == 83 {
            return Some(Arc::new(Mutex::new(Box::new(AudioClipWrapper::from_value(&parsed, parent).ok()?) as Box<dyn Asset>)));
        }
        if typ.class_id == 43 {
            return Some(Arc::new(Mutex::new(Box::new(MeshWrapper::from_value(&parsed, self.unity_version.major, self.little_endian).ok()?) as Box<dyn Asset>)));
        }
        if typ.class_id == 49 {
            return Some(Arc::new(Mutex::new(Box::new(TextWrapper::from_value(&parsed).ok()?) as Box<dyn Asset>)));
        }
        if typ.class_id == 74 {
            info!("{:#?}", parsed);
        }
        Some(Arc::new(Mutex::new(Box::new(UnsupportedAsset {}))))
    }
}

unsafe impl Send for AssetFile {}
unsafe impl Sync for AssetFile {}
