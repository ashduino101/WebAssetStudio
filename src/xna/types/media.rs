use bytes::{Buf, BufMut, Bytes, BytesMut};
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::utils::buf::BufMutExt;
use crate::utils::dom::create_data_url;
use crate::xna::type_base::XNBType;
use crate::xna::xnb::{TypeReader, XNBFile};

#[derive(Debug)]
pub struct SoundEffect {
    pub format: Bytes,
    pub data: Bytes,
    pub loop_start: i32,
    pub loop_length: i32,
    pub duration: i32
}

impl SoundEffect {
    pub fn to_wav(&self) -> Bytes {
        let mut b = BytesMut::new();
        b.put_chars("RIFF".to_owned());
        b.put_u32_le((self.format.len() + self.data.len() + 28) as u32);
        b.put_chars("WAVE".to_owned());
        b.put_chars("fmt ".to_owned());
        b.put_u32_le(self.format.len() as u32);
        b.put(&self.format[..]);
        b.put_chars("data".to_owned());
        b.put_u32_le(self.data.len() as u32);
        b.put(&self.data[..]);
        b.into()
    }
}

impl Asset for SoundEffect {
    fn make_html(&mut self, doc: &Document) -> Element {
        let elem = doc.create_element("audio").unwrap();
        let wav = self.to_wav();
        elem.set_attribute("src", &create_data_url(&wav[..], "audio/wav")).unwrap();
        elem.set_attribute("controls", "true").unwrap();
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            extension: "wav".to_owned(),
            data: self.to_wav().into(),
        }
    }
}

impl XNBType for SoundEffect {
    fn from_bytes(data: &mut Bytes, _: &Vec<TypeReader>) -> Self {
        let format_size = data.get_u32_le() as usize;
        let format = data.slice(0..format_size);
        data.advance(format_size);
        let data_size = data.get_u32_le() as usize;
        let sound_data = data.slice(0..data_size);
        data.advance(data_size);
        let loop_start = data.get_i32_le();
        let loop_length = data.get_i32_le();
        let duration = data.get_i32_le();
        SoundEffect {
            format,
            data: sound_data,
            loop_start,
            loop_length,
            duration,
        }
    }
}

#[derive(Debug)]
pub struct Song {
    pub path: String,
    pub duration: Box<dyn XNBType>
}

impl Asset for Song {
    fn make_html(&mut self, doc: &Document) -> Element {
        let elem = doc.create_element("audio").unwrap();
        // TODO: the song is a separate file
        elem
    }

    fn export(&mut self) -> Export {
        Export {
            // FIXME: XNA uses WMA, FNA uses OGG, but most people probably use FNA nowadays
            extension: "ogg".to_string(),
            data: Vec::new()
        }
    }
}

impl XNBType for Song {
    fn from_bytes(data: &mut Bytes, readers: &Vec<TypeReader>) -> Song {
        Song {
            path: data.get_string_varint(),
            duration: XNBFile::read_type(&readers.get((data.get_varint() - 1) as usize).unwrap().typename, data, &readers)
        }
    }
}