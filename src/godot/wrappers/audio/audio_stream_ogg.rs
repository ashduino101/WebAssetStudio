use bytes::Bytes;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::godot::resource::Resource;
use crate::godot::variant::Variant;
use crate::godot::wrappers::ResourceWrapper;
use crate::studio::components::asset_views::audio::AudioView;
use crate::studio::components::base::WidgetComponent;
use crate::utils::dom::create_data_url;

#[derive(Debug, Clone)]
pub(crate) struct OggStreamWrapper {
    data: Bytes,
    r#loop: bool
}

impl OggStreamWrapper {
    pub(crate) fn wrap(val: &Resource) -> Option<Self> {
        Some(OggStreamWrapper {
            data: val.properties.get("data")?.as_byte_array()?,
            r#loop: val.properties.get("loop").map(|v| v.as_bool().unwrap_or(false)).unwrap_or(false)
        })
    }
}

impl Asset for OggStreamWrapper {
    fn make_html(&mut self, _: &Document, parent: &Element) -> anyhow::Result<()> {
        let url = create_data_url(&self.data[..], "audio/ogg");
        AudioView::from_url(&url).render(parent);
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}

impl ResourceWrapper for OggStreamWrapper {}
