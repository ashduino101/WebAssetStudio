use bytes::{Buf, Bytes};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::gamemaker::common::{GameMakerChunk, PtrList};
use crate::gamemaker::ctx::GameMakerContext;
use crate::studio::components::asset_views::audio::AudioView;
use crate::studio::components::base::WidgetComponent;
use crate::utils::buf::FromBytes;
use crate::utils::dom::create_data_url;

pub(crate) struct AudioChunk {
    pub(crate) samples: Vec<Sample>
}

impl GameMakerChunk for AudioChunk {
    fn from_bytes(ctx: &GameMakerContext, data: &mut Bytes) -> Self {
        AudioChunk {
            samples: PtrList::from_bytes(data).read_all_from(ctx)
        }
    }
}

#[derive(Debug, Clone, Default)]
pub(crate) struct Sample {
    pub(crate) data: Bytes
}

impl FromBytes for Sample {
    fn from_bytes(data: &mut Bytes) -> Self {
        let len = data.get_u32_le() as usize;
        let d = data.slice(0..len);
        data.advance(len);
        Sample {
            data: d
        }
    }
}

impl Asset for Sample {
    fn make_html(&mut self, doc: &Document, parent: &Element) -> anyhow::Result<()> {
        AudioView::from_url(&create_data_url(&self.data[..], "application/octet-stream")).render(parent);
        Ok(())
    }

    fn export(&mut self) -> Export {
        todo!()
    }
}
