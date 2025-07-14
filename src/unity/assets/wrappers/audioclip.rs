use std::fmt::{Debug};
use std::sync::MutexGuard;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::base::asset::bundle::BundleFile;
use crate::fsb::bank::{SoundBank, SoundFormat};
use crate::studio::components::asset_views::audio::AudioView;
use crate::studio::components::base::WidgetComponent;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;
use crate::utils::dom::create_data_url;

#[derive(Debug)]
pub struct AudioClipWrapper {
    pub bank: SoundBank
}

impl Asset for AudioClipWrapper {
    fn make_html(&mut self, _: &Document, parent: &Element) -> anyhow::Result<()> {
        for s in &self.bank.subsounds {
            let url = create_data_url(&s.data[..], match s.format {
                SoundFormat::Pcm8 => "audio/wav",
                SoundFormat::Pcm16 => "audio/wav",
                SoundFormat::Pcm24 => "audio/wav",
                SoundFormat::Pcm32 => "audio/wav",
                SoundFormat::PcmFloat => "audio/wav",
                SoundFormat::GcAdpcm => "audio/wav",
                SoundFormat::ImaAdpcm => "audio/wav",
                SoundFormat::Vorbis => "audio/ogg",
                SoundFormat::Opus => "audio/ogg",
                _ => "application/octet-stream"
            });
            AudioView::from_url(&url).render(parent);
        }
        Ok(())
    }

    fn export(&mut self) -> Export {
        Export {
            extension: match self.bank.format {
                SoundFormat::Pcm8 | SoundFormat::Pcm16 | SoundFormat::Pcm24 | SoundFormat::Pcm32 | SoundFormat::PcmFloat | SoundFormat::ImaAdpcm => "wav",
                SoundFormat::Vorbis => "ogg",
                SoundFormat::Opus => "opus",
                _ => "dat"
            }.to_owned(),
            data: vec![0u8; 0]  // TODO
        }
    }
}

impl ClassWrapper for AudioClipWrapper {
}

impl AudioClipWrapper {
    pub fn from_value(value: &ValueType, bundle: Option<&mut MutexGuard<Box<dyn BundleFile + Send>>>) -> Result<Self, ObjectError> {
        let resource = value.get("m_Resource")?.clone();
        let offset = resource.get("m_Offset")?.as_offset()?;
        let size = resource.get("m_Size")?.as_offset()?;
        let mut res = bundle.unwrap().get_blob(
            resource.get("m_Source")?.as_string()?
        ).ok_or_else(|| ObjectError { msg: Some("no blob available".to_owned()) })?
            .slice(offset..offset + size);
        Ok(AudioClipWrapper {
            bank: SoundBank::new(&mut res)
        })
    }
}
