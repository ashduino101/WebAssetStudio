use std::rc::Rc;
use std::sync::Arc;
use bytes::Bytes;
use crate::base::asset::provider::{AssetProvider, ProviderMetadata};
use crate::unity::assets::file::AssetFile;

/// Contains multiple asset collections.
pub trait BundleFile {
    fn list_providers(&self) -> Vec<ProviderMetadata>;
    fn list_blobs(&self) -> Vec<ProviderMetadata>;
    fn get_provider(&mut self, id: String) -> Option<Arc<Box<dyn AssetProvider>>>;
    fn get_blob(&mut self, id: String) -> Option<Bytes>;
}


pub struct GenericBundleFile {
    _inner: Arc<Box<dyn AssetProvider>>
}

impl GenericBundleFile {
    pub fn wrap(inner: Box<dyn AssetProvider>) -> Self {
        GenericBundleFile { _inner: Arc::new(inner) }
    }
}

impl BundleFile for GenericBundleFile {
    fn list_providers(&self) -> Vec<ProviderMetadata> {
        vec![ProviderMetadata {
            name: "<generic>".to_string(),
            id: ":3".to_string(),
        }]
    }

    fn list_blobs(&self) -> Vec<ProviderMetadata> {
        vec![]
    }

    fn get_provider(&mut self, _: String) -> Option<Arc<Box<dyn AssetProvider>>> {
        Some(self._inner.clone())
    }

    fn get_blob(&mut self, _: String) -> Option<Bytes> {
        panic!("can't get blob from generic provider")
    }
}

unsafe impl Send for GenericBundleFile {}
unsafe impl Sync for GenericBundleFile {}
