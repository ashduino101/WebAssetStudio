use std::fmt;
use std::fmt::Debug;
use bytes::{Bytes, Buf};
use crate::UnityVersion;

use crate::unity::assets::external::External;
use crate::unity::assets::typetree::TypeInfo;
use crate::unity::object::identifier::LocalObjectIdentifier;
use crate::unity::object::info::ObjectInfo;

use crate::utils::buf::{BufExt, FromBytes};

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
        }

        let object_data = data.slice(data_offset - (if version >= 22 { 40 } else if version >= 9 { 20 } else { 16 })..);

        let unity_version = UnityVersion::parse(&if version >= 7 { data.get_cstring() } else { "2.5.0f5".to_owned() }).unwrap();

        let platform = if version >= 8 { data.get_u32_ordered(little_endian) } else { 0 };
        let enable_type_trees = if version >= 13 { data.get_u8() != 0 } else { false };

        let num_types = data.get_u32_ordered(little_endian);
        let mut types = Vec::new();
        for _ in 0..num_types {
            types.push(TypeInfo::from_bytes(data, version, little_endian, enable_type_trees));
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
}
