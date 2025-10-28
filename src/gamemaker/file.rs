use std::io::{Cursor, Seek, SeekFrom};
use std::sync::{Arc, Mutex, MutexGuard};
use bytes::{Buf, Bytes};
use bzip2_rs::decoder::{Decoder, ReadState, WriteState};
use image::ImageReader;
use crate::base::asset::{Asset, AssetMetadata};
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::AssetProvider;
use crate::base::asset::types::AssetType;
use crate::gamemaker::chunks::audio::{AudioChunk, Sample};
use crate::gamemaker::chunks::audiogroup::AudioGroups;
use crate::gamemaker::chunks::features::FeatureFlags;
use crate::gamemaker::chunks::globals::Globals;
use crate::gamemaker::chunks::shaders::{Shader, Shaders};
use crate::gamemaker::chunks::texture::{Texture, TextureChunk};
use crate::gamemaker::common::GameMakerChunk;
use crate::gamemaker::ctx::GameMakerContext;
use crate::gamemaker::iff::IFFReader;
use crate::gamemaker::qoi::decode_qoi;
use crate::load_audio;
use crate::logger::warning;
use crate::logger::info;
use crate::utils::debug::load_image;
use crate::utils::time::now;

#[derive(Debug)]
pub struct GameMakerFile {
    pub(crate) textures: Vec<Texture>,
    pub(crate) samples: Vec<Sample>,
    pub(crate) feature_flags: Vec<String>,
    pub(crate) audio_groups: Vec<String>,
    pub(crate) shaders: Vec<Shader>,
    pub(crate) global_code: Vec<i32>
}

impl GameMakerFile {
    pub fn new(data: &mut Bytes) -> GameMakerFile {
        let mut g = GameMakerFile { textures: vec![], samples: vec![], feature_flags: vec![], audio_groups: vec![], shaders: vec![], global_code: vec![] };
        let mut ctx = GameMakerContext::create(data.clone());
        g.parse(&mut ctx, data);
        g
    }
}

impl IFFReader for GameMakerFile {
    fn handle_chunk(&mut self, ctx: &mut GameMakerContext, chunk_id: &str, size: usize, data: &mut Bytes) {
        match chunk_id {
            "AUDO" => {
                self.samples = AudioChunk::from_bytes(ctx, data).samples;
                for sample in &self.samples {
                    load_audio(sample.data.clone());
                }
            },
            "TXTR" => {
                self.textures = TextureChunk::from_bytes(ctx, data).textures;
            }
            "GLOB" => {
                self.global_code = Globals::from_bytes(ctx, data).code_indices;
            }
            "FEAT" => {
                self.feature_flags = FeatureFlags::from_bytes(ctx, data).flags;
            }
            "AGRP" => {
                self.audio_groups = AudioGroups::from_bytes(ctx, data).groups;
            }
            "SHDR" => {
                self.shaders = Shaders::from_bytes(ctx, data).shaders;
            }
            _ => {
                warning!("Unhandled chunk {} of size {}!", chunk_id, size);
            }
        }
    }
}

impl AssetProvider for GameMakerFile {
    fn list_assets(&self) -> Vec<AssetMetadata> {
        let mut v = Vec::new();
        for i in 0..self.textures.len() {  // no names
            v.push(AssetMetadata {
                name: format!("Texture_{}", i + 1),
                asset_type: AssetType::Texture2D,
                id: format!("Texture_{}", i + 1),
            });
        }
        for i in 0..self.samples.len() {  // no names
            v.push(AssetMetadata {
                name: format!("Audio_{}", i + 1),
                asset_type: AssetType::AudioClip,
                id: format!("Audio_{}", i + 1),
            });
        }
        let mut i = 0;
        for s in &self.shaders {
            v.push(AssetMetadata {
                name: s.key.clone(),
                asset_type: AssetType::Shader,
                id: format!("Shader_{}", i + 1),
            });
            i += 1;
        }
        v
    }

    fn get_asset(&self, id: String, parent: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>> {
        let (typ, idx) = id.split_once("_")?;
        let idx = (idx.parse::<i32>().unwrap() - 1) as usize;
        if id.starts_with("Texture_") {
            return Some(Arc::new(Mutex::new(Box::new(self.textures.get(idx)?.clone()) as Box<dyn Asset>)))
        }
        if id.starts_with("Audio_") {
            return Some(Arc::new(Mutex::new(Box::new(self.samples.get(idx)?.clone()) as Box<dyn Asset>)))
        }
        if id.starts_with("Shader_") {
            return Some(Arc::new(Mutex::new(Box::new(self.shaders.get(idx)?.clone()) as Box<dyn Asset>)))
        }
        None
    }
}
