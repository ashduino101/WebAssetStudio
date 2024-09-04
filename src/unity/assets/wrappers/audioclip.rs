use std::fmt::{Debug};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::BundleFile;
use crate::fsb::bank::{SoundBank, SoundFormat};
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;



#[derive(Debug)]
pub struct AudioClipWrapper {
    pub bank: SoundBank
}

impl Asset for AudioClipWrapper {
    fn make_html(&mut self, doc: &Document) -> Element {
        doc.create_element("div").expect("dummy")
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
    pub fn from_value(value: &ValueType, bundle: &BundleFile) -> Result<Self, ObjectError> {
        let resource = value.get("m_Resource")?.clone();
        let mut res = bundle.get_resource_data(
            resource.get("m_Source")?.as_string()?.as_str(),
            resource.get("m_Offset")?.as_offset()?,
            resource.get("m_Size")?.as_offset()?
        )?;
        Ok(AudioClipWrapper {
            bank: SoundBank::new(&mut res)
        })
    }
}
