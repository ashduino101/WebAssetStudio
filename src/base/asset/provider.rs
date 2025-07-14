use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};
use bytes::Bytes;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, AssetMetadata, Export};
use crate::base::asset::bundle::{BundleFile, GenericBundleFile};
use crate::base::asset::types::AssetType;

pub(crate) struct ProviderMetadata {
    pub name: String,
    pub id: String
}

pub(crate) trait AssetProvider {
    fn list_assets(&self) -> Vec<AssetMetadata>;
    fn get_asset(&self, id: String, parent: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>>;
}

#[derive(Debug, Clone)]
pub struct GenericAssetProvider {
    _inner: Arc<Mutex<Box<dyn Asset>>>
}

impl GenericAssetProvider {
    pub fn wrap(inner: Box<dyn Asset>) -> Self {
        GenericAssetProvider {
            _inner: Arc::new(Mutex::new(inner))
        }
    }
}

impl AssetProvider for GenericAssetProvider {
    fn list_assets(&self) -> Vec<AssetMetadata> {
        vec![AssetMetadata {
            name: "Asset".to_string(),
            asset_type: AssetType::Misc,
            id: ":3".to_string(),
        }]
    }

    fn get_asset(&self, id: String, _: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>> {
        assert_eq!(id, ":3", "id must be :3 uwu");
        Some(self._inner.clone())
    }
}
