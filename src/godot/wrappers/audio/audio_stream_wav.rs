use bytes::Bytes;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::godot::resource::Resource;
use crate::godot::wrappers::ResourceWrapper;
use crate::studio::components::asset_views::audio::AudioView;
use crate::studio::components::base::WidgetComponent;
use crate::utils::dom::create_data_url;
use crate::utils::pcm::{encode_wav, WavFormat};

#[derive(Debug, Clone)]
pub(crate) struct WavStreamWrapper {
    data: Bytes,
    r#loop: bool,
    stereo: bool
}

impl WavStreamWrapper {
    pub(crate) fn wrap(val: &Resource) -> Option<Self> {
        Some(WavStreamWrapper {
            data: val.properties.get("data")?.as_byte_array()?,
            r#loop: val.properties.get("loop").map(|v| v.as_bool().unwrap_or(false)).unwrap_or(false),
            stereo: val.properties.get("stereo")?.as_bool()?
        })
    }
}

impl Asset for WavStreamWrapper {
    fn make_html(&mut self, _: &Document, parent: &Element) -> anyhow::Result<()> {
        // TODO: is the rate always 44100? It doesn't seem to be stored in the resource
        let d = encode_wav(self.data.clone(), WavFormat::PCM16, 44100, if self.stereo { 2 } else { 1 });
        let url = create_data_url(&d[..], "audio/wav");
        AudioView::from_url(&url).render(parent);
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}

impl ResourceWrapper for WavStreamWrapper {}