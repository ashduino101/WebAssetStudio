use std::cell::RefCell;
use std::collections::HashMap;
use std::ops::{Deref, DerefMut};
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use async_recursion::async_recursion;
use wasm_bindgen::JsCast;
use web_sys::{window, Element, Event};
use crate::base::asset::bundle::BundleFile;
use crate::base::asset::provider::AssetProvider;
use crate::logger::info;
use itertools::Itertools;
use crate::base::asset::{Asset, AssetMetadata};
use crate::studio::widgets::base::Widget;
use crate::utils::js::events::{add_event_listener, add_event_listener_with_data};

/// stupid unicode shit
/// https://stackoverflow.com/questions/38461429/how-can-i-truncate-a-string-to-have-at-most-n-characters
fn truncate(s: &str, max_chars: usize) -> &str {
    match s.char_indices().nth(max_chars) {
        None => s,
        Some((idx, _)) => &s[..idx],
    }
}

pub struct AssetBrowser {
    bundle: Arc<Mutex<Box<dyn BundleFile + Send>>>
}

impl AssetBrowser {
    pub(crate) fn new(bundle: Arc<Mutex<Box<dyn BundleFile + Send>>>) -> Self {
        AssetBrowser { bundle }
    }

    pub(crate) fn attach(&mut self, elem: &Element) {
        let mut document = window().unwrap().document().unwrap();
        let mut container = document.create_element("div").unwrap();
        for p in self.bundle.lock().unwrap().list_providers() {
            let node = document.create_element("div").unwrap();
            node.set_text_content(Some(&p.name));
            node.set_attribute("data-id", &p.id).unwrap();

            add_event_listener_with_data(&node, "mouseup", Self::on_provider_clicked, self.bundle.clone()).unwrap();

            container.append_child(&node).unwrap();
        }
        elem.append_child(&container).unwrap();
    }

    #[async_recursion]
    async fn create_asset_tree_recursive(assets: &mut Mutex<Vec<AssetMetadata>>, bundle: Arc<Mutex<Box<dyn BundleFile + Send>>>, lvl: usize, parent_id: &str, disp_id: &str) {
        let group_starts =  {
            let a = assets.lock().unwrap();
            a.len() > 100 && (a.iter().map(|v| v.name.clone()).max_by(|a, b| a.len().cmp(&b.len())).unwrap().len() >= lvl * 2)
        };

        if group_starts && lvl < 3 {
            let groups = {
                let mut g = assets.lock().unwrap();
                g.sort_by(|a, b| a.name.cmp(&b.name));
                let groups = g.iter().map(|m| {
                    truncate(&m.name, lvl * 2).to_owned()
                }).unique().collect::<Vec<_>>();
                groups
            };
            for group in &groups {
                if group.is_empty() {
                    continue;
                }
                // info!("group {group} lvl {lvl} parent {parent_id}");
                let a = {
                    assets.lock().unwrap().iter()
                        .filter(|a| a.name.starts_with(group))
                        .map(|a| a.clone())
                        .collect::<Vec<_>>()
                };
                let branch_id = {
                    let mut document = window().unwrap().document().unwrap();
                    let mut parent = document.query_selector(&format!("[data-id=\"{}\"]", parent_id.replace("\"", "_"))).unwrap().unwrap();

                    let mut branch = document.create_element("div").unwrap();
                    let branch_id = format!("_{group}_{lvl}");
                    branch.set_attribute("data-id", &branch_id).unwrap();
                    branch.class_list().add_2("browser-node", "grouped").unwrap();
                    branch.set_text_content(Some(group));

                    parent.append_child(&branch).unwrap();
                    branch_id
                };

                Self::create_asset_tree_recursive(
                    &mut Mutex::new(a),
                    bundle.clone(), lvl + 1, &branch_id, disp_id).await;
            }
        } else {
            let mut document = window().unwrap().document().unwrap();
            let mut parent = document.query_selector(&format!("[data-id=\"{}\"]", parent_id.replace("\"", "_"))).unwrap().unwrap();

            for a in assets.lock().unwrap().iter() {
                let node = document.create_element("div").unwrap();
                node.set_text_content(Some(&a.name));
                node.set_attribute("data-id", &a.id).unwrap();
                node.class_list().add_1("browser-node").unwrap();

                add_event_listener_with_data(&node, "mouseup", Self::on_asset_clicked, bundle.clone()).unwrap();

                parent.append_child(&node).unwrap();
            }
        }
    }

    async fn on_provider_clicked(e: Event, bundle: Arc<Mutex<Box<dyn BundleFile + Send>>>) {
        e.stop_propagation();

        let mut document = window().unwrap().document().unwrap();
        let mut target = e.target().unwrap().unchecked_into::<Element>();
        if target.class_list().contains("grouped") {
            return;
        }
        let provider_id = target.get_attribute("data-id").unwrap();

        let mut bun = bundle.lock().unwrap();
        let mut prov = bun.get_provider(provider_id.clone()).unwrap();

        let assets = prov.list_assets();

        Self::create_asset_tree_recursive(&mut Mutex::new(assets), bundle.clone(), 1, &provider_id, &provider_id).await;
    }

    async fn on_asset_clicked(e: Event, bundle: Arc<Mutex<Box<dyn BundleFile + Send>>>) {
        e.stop_propagation();

        let mut document = window().unwrap().document().unwrap();
        let mut target = e.target().unwrap().unchecked_into::<Element>();
        let mut parent = target.parent_element().unwrap();
        while parent.class_list().contains("grouped") {  // find provider root
            parent = parent.parent_element().unwrap();
        }
        let provider_id = parent.get_attribute("data-id").unwrap();
        let asset_id = target.get_attribute("data-id").unwrap();

        let mut bun = bundle.lock().unwrap();
        let mut prov = bun.get_provider(provider_id).unwrap();
        let mut asset = prov.get_asset(asset_id, Some(&mut bun));

        let mut viewport = document.get_element_by_id("viewport").unwrap();
        for i in 0..viewport.children().length() {
            viewport.children().item(i).unwrap().remove();
        }
        match asset {
            None => {
                let elem = document.create_element("span").unwrap();
                elem.set_text_content(Some("Failed to load asset"));
                elem.set_id("load-failed");
                viewport.append_child(&elem).unwrap();
            }
            Some(a) => {
                viewport.append_child(&a.lock().unwrap().make_html(&document)).unwrap();
            }
        }
    }

    fn add_item(parent: &str, name: &str, /*icon: &Icon*/) {

    }
}

impl Widget for AssetBrowser {
    fn create(elem: &Element) -> Self {
        todo!()
    }
}
