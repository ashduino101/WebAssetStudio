use std::rc::Rc;
use std::sync::{Arc, Mutex, MutexGuard};
use crate::base::asset::{Asset, AssetMetadata};
use crate::base::asset::bundle::BundleFile;

pub(crate) struct ProviderMetadata {
    pub name: String,
    pub id: String
}

pub(crate) trait AssetProvider {
    fn list_assets(&self) -> Vec<AssetMetadata>;
    fn get_asset(&self, id: String, parent: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Option<Arc<Mutex<Box<dyn Asset>>>>;
}