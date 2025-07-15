use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use crate::base::asset::{Asset, AssetMetadata, UnsupportedAsset};
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::AssetProvider;
use crate::base::asset::types::AssetType;
use crate::godot::variant::{get_string, Variant};
use crate::godot::wrappers::audio::audio_stream_mp3::Mp3StreamWrapper;
use crate::godot::wrappers::audio::audio_stream_ogg::OggStreamWrapper;
use crate::godot::wrappers::audio::audio_stream_wav::WavStreamWrapper;
use crate::logger::{info, warning};

#[derive(Debug, Clone)]
pub(crate) struct ExternalResourceReference {
    type_name: String,
    path: String,
    uid: i64
}

#[derive(Debug, Clone)]
pub(crate) struct InternalResourceReference {
    path: String,
    offset: usize
}

#[derive(Debug, Clone)]
pub(crate) struct Resource {
    pub(crate) r#type: String,
    pub(crate) properties: HashMap<String, Variant>
}

#[derive(Debug, Clone)]
pub(crate) struct ResourceFile {
    use_real_64: bool,
    major: i32,
    minor: i32,
    format_version: i32,
    type_name: String,
    import_offset: usize,
    flags: i32,
    uid: i64,
    string_table: Vec<String>,
    external_resources: Vec<ExternalResourceReference>,
    internal_resources: Vec<InternalResourceReference>,
    resource: Resource
}

impl ResourceFile {
    pub(crate) fn from_bytes(data: &mut Bytes) -> anyhow::Result<Self> {
        // TODO compressed (RSCC)
        if data.get_chars(4) != "RSRC" {
            return Err(anyhow!("not a resource file"));
        }

        let little_endian = data.get_i32_le() == 0;
        let use_real_64 = data.get_i32_ordered(little_endian) != 0;
        let major = data.get_i32_ordered(little_endian);
        let minor = data.get_i32_ordered(little_endian);
        let format_version = data.get_i32_ordered(little_endian);
        let type_name = data.get_string_ordered(little_endian);
        let import_offset = data.get_i64_ordered(little_endian) as usize;
        let flags = data.get_i32_ordered(little_endian);
        let uid = data.get_i64_ordered(little_endian);
        data.advance(44);  // reserved
        let mut string_table = Vec::new();
        let num_strings = data.get_i32_ordered(little_endian);
        for _ in 0..num_strings {
            string_table.push(data.get_string_ordered(little_endian));
        }
        let mut external_resources = Vec::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            external_resources.push(ExternalResourceReference {
                type_name: data.get_string_ordered(little_endian),
                path: data.get_string_ordered(little_endian),
                uid: if flags & 2 != 0 { data.get_i64_ordered(little_endian) } else { 0 },
            });
        }
        let mut internal_resources = Vec::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            internal_resources.push(InternalResourceReference {
                path: data.get_string_ordered(little_endian),
                offset: data.get_i64_ordered(little_endian) as usize,
            })
        }
        let resource_type = data.get_string_ordered(little_endian);
        let mut properties = HashMap::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            let key = get_string(data, &string_table, true).unwrap();
            let val = Variant::from_bytes(data, &string_table, format_version < 3, true, major)?;
            properties.insert(key, val);
        }
        // TODO: this will fail if there is more than one resource
        // if data.get_chars(4) != "RSRC" {
        //     return Err(anyhow!("resource file was not read properly"));
        // }
        Ok(ResourceFile {
            use_real_64,
            major,
            minor,
            format_version,
            type_name,
            import_offset,
            flags,
            uid,
            string_table,
            external_resources,
            internal_resources,
            resource: Resource {
                r#type: resource_type,
                properties,
            },
        })
    }
}

impl AssetProvider for ResourceFile {
    fn list_assets(&self) -> Vec<AssetMetadata> {
        // TODO: technically, there can be more than one resource per file
        //  Right now we just read the first one
        vec![AssetMetadata {
            name: "resource".to_string(),
            asset_type: AssetType::Misc,
            id: "owo whats this".to_string(),
        }]
    }

    fn get_asset(&self, id: String, parent: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>> {
        Some(Arc::new(Mutex::new(match self.type_name.as_str() {
            "AudioStreamOGGVorbis" => Box::new(OggStreamWrapper::wrap(&self.resource).unwrap()) as Box<dyn Asset>,
            "AudioStreamSample" => Box::new(WavStreamWrapper::wrap(&self.resource).unwrap()) as Box<dyn Asset>,
            "AudioStreamMP3" => Box::new(Mp3StreamWrapper::wrap(&self.resource).unwrap()) as Box<dyn Asset>,
            other => {
                warning!("unknown type {other}");
                info!("{:#?}", self);
                Box::new(UnsupportedAsset {}) as Box<dyn Asset>
            }
        })))
    }
}
