use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;

use crate::base::asset::Void;
use crate::base::types::{Matrix4x4, Quaternion, Vector2, Vector3, Vector4};

use crate::utils::buf::{BufExt, FromBytes};
use crate::logger::warning;
use crate::xna::type_base::XNBType;
use crate::xna::types::graphics::{SpriteFont, Texture2D};
use crate::xna::types::math::Rectangle;

use crate::xna::types::system::*;

const XNB_MAGIC: &str = "XNB";


#[derive(Debug, Clone)]
pub struct TypeReader {
    pub typename: String,
    pub version: i32
}

impl FromBytes for TypeReader {
    fn from_bytes(data: &mut Bytes) -> Self {
        let typename = data.get_string_varint();
        // console_log!("parse {}", typename);
        let commapos = typename.find(",");
        let typename = if let Some(p) = commapos {
            (&typename[0..p]).to_owned()
        } else { typename };
        TypeReader {
            typename,
            version: data.get_i32_le()
        }
    }
}

#[derive(Debug)]
pub struct XNBFile {
    pub version: u8,
    pub platform: String,
    pub is_hi_def: bool,
    pub is_compressed: bool,
    pub size: u32,
    pub uncompressed_size: u32,
    pub type_readers: Vec<TypeReader>,
    pub primary_asset: Box<dyn XNBType>,
    pub shared_resources: Vec<Box<dyn XNBType>>,
}

impl XNBFile {
    pub fn platform(&self) -> String {
        self.platform.to_string()
    }

    pub fn type_readers(&self) -> &Vec<TypeReader> {
        &self.type_readers
    }

    pub fn new(data: &mut Bytes) -> Box<XNBFile> {
        if data.get_chars(3) != XNB_MAGIC {
            panic!("not an XNB file");
        };
        let platform = match data.get_u8() {
            119 => "Microsoft Windows",
            109 => "Windows Phone 7",
            120 => "Xbox 360",
            _ => "Unknown"
        }.to_string();
        let format_version = data.get_u8();
        let flags = data.get_u8();
        let size = data.get_u32_le();
        let is_hi_def = (flags & 0x01) == 0x01;
        let is_compressed = (flags & 0x80) == 0x80;
        let mut uncompressed_size = size;
        if is_compressed {
            uncompressed_size = data.get_u32_le();
        }
        let num_type_readers = data.get_varint();
        let mut type_readers = Vec::new();
        for _ in 0..num_type_readers {
            type_readers.push(TypeReader::from_bytes(data))
        }
        let num_shared_resources = data.get_varint();
        let primary_asset = XNBFile::read_type(&type_readers.get((data.get_varint() - 1) as usize).expect("invalid index").typename, data, &type_readers);

        let mut shared_resources = Vec::new();
        for _ in 0..num_shared_resources {
            let asset = XNBFile::read_type(&type_readers.get((data.get_varint() - 1) as usize).expect("invalid index").typename, data, &type_readers);
            shared_resources.push(asset);
        }

        Box::from(XNBFile {
            version: format_version,
            platform,
            is_hi_def,
            is_compressed,
            size,
            uncompressed_size,
            type_readers,
            primary_asset,
            shared_resources
        })
    }

    pub(crate) fn read_type(class: &str, data: &mut Bytes, readers: &Vec<TypeReader>) -> Box<dyn XNBType> {
        console_log!("read type {:?}", class);
        match class {
            "Microsoft.Xna.Framework.Content.TimeSpanReader" => Box::from(TimeSpan::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.DateTimeReader" => Box::from(DateTime::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.DecimalReader" => Box::from(Decimal::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.ExternalReferenceReader" => Box::from(ExternalReference::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.Vector2Reader" => Box::from(Vector2::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.Vector3Reader" => Box::from(Vector3::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.Vector4Reader" => Box::from(Vector4::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.MatrixReader" => Box::from(Matrix4x4::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.QuaternionReader" => Box::from(Quaternion::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.RectangleReader" => Box::from(Rectangle::from_bytes(data, readers)),

            "Microsoft.Xna.Framework.Content.Texture2DReader" => Box::from(Texture2D::from_bytes(data, readers)),
            "Microsoft.Xna.Framework.Content.SpriteFontReader" => Box::from(SpriteFont::from_bytes(data, readers)),
            _ => {
                warning!("Unknown class {}", class);
                panic!("^^")
            }
        }
    }
}