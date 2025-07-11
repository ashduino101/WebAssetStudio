use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use bytes::Bytes;
use wasm_bindgen::JsCast;
use web_sys::{window, HtmlInputElement};
use crate::base::asset::provider::{AssetProvider, ProviderMetadata};
use crate::unity::assets::file::AssetFile;
use crate::utils::js::events::{add_event_listener, add_event_listener_with_data};
use crate::utils::js::file_reader::read_file;

/// Contains multiple asset collections.
pub trait BundleFile {
    fn list_providers(&self) -> Vec<ProviderMetadata>;
    fn list_blobs(&self) -> Vec<ProviderMetadata>;
    fn get_provider(&mut self, id: String) -> Option<Arc<Box<dyn AssetProvider>>>;
    fn get_blob(&mut self, id: String) -> Option<Bytes>;
}


pub struct GenericBundleFile {
    _inner: Arc<Box<dyn AssetProvider>>,
    resources: Arc<Mutex<HashMap<String, Bytes>>>
}

impl GenericBundleFile {
    pub fn wrap(inner: Box<dyn AssetProvider>) -> Self {
        GenericBundleFile {
            _inner: Arc::new(inner),
            resources: Arc::new(Mutex::new(HashMap::new()))
        }
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

    fn get_blob(&mut self, f: String) -> Option<Bytes> {
        if let Some(b) = self.resources.lock().unwrap().get(&f) {
            return Some(b.clone())
        }
        // #[cfg(not(target_arch = "wasm"))]
        // panic!("can't get blob from generic provider");
        // #[cfg(target_arch = "wasm")]
        let doc = window().unwrap().document().unwrap();
        let modal = doc.get_element_by_id("blob-import-modal").unwrap();
        modal.query_selector("span").unwrap().unwrap().set_text_content(Some(&format!("Required file: {}", f)));
        modal.class_list().add_1("active").unwrap();
        let input = doc.get_element_by_id("blob-import").unwrap();
        let res = self.resources.clone();
        let name = f.clone();
        let data = Arc::new(Mutex::new((name, res)));
        add_event_listener_with_data(&input, "change", async |e, d| {
            let elem = e.target().unwrap().dyn_into::<HtmlInputElement>().unwrap();
            let files = elem.files().unwrap();
            for i in 0..files.length() {
                let file = files.get(i).unwrap();
                // let name = file.name();
                let dat = read_file(file).await.unwrap();
                let mut parent = d.lock().unwrap();
                parent.1.lock().unwrap().insert(parent.0.clone(), dat);
            }
        }, data).unwrap();
        None
    }
}

unsafe impl Send for GenericBundleFile {}
unsafe impl Sync for GenericBundleFile {}
