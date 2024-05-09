use bytes::{Buf, Bytes};

use crate::base::asset::Void;
use crate::base::types::{Matrix4x4, Quaternion, Vector2, Vector3, Vector4};

use crate::utils::buf::{BufExt, FromBytes};
use crate::xna::type_base::XNBType;
use crate::xna::types::graphics::Texture2D;

use crate::xna::types::system::*;

const XNB_MAGIC: &str = "XNB";


#[derive(Debug, Clone)]
pub struct TypeReader {
    pub typename: String,
    pub version: i32
}

impl FromBytes for TypeReader {
    fn from_bytes(data: &mut Bytes) -> Self {
        TypeReader {
            typename: data.get_string_varint(),
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
    pub primary_asset: Box<dyn XNBType>
}

impl XNBFile {
    pub fn platform(&self) -> String {
        self.platform.to_string()
    }

    pub fn type_readers(&self) -> Box<[TypeReader]> {
        self.type_readers.clone().into()
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
        Box::from(XNBFile {
            version: format_version,
            platform,
            is_hi_def,
            is_compressed,
            size,
            uncompressed_size,
            type_readers: type_readers.clone(),
            primary_asset: XNBFile::read_type(&type_readers.get((data.get_varint() - 1) as usize).expect("invalid index").typename, data)
        })
    }

    fn read_type(class: &str, data: &mut Bytes) -> Box<dyn XNBType> {
        println!("read type {:?}", class);
        match class {
            "Microsoft.Xna.Framework.Content.TimeSpanReader" => Box::from(TimeSpan::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.DateTimeReader" => Box::from(DateTime::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.DecimalReader" => Box::from(Decimal::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.ExternalReferenceReader" => Box::from(ExternalReference::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.Vector2Reader" => Box::from(Vector2::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.Vector3Reader" => Box::from(Vector3::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.Vector4Reader" => Box::from(Vector4::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.MatrixReader" => Box::from(Matrix4x4::from_bytes(data)),
            "Microsoft.Xna.Framework.Content.QuaternionReader" => Box::from(Quaternion::from_bytes(data)),

            "Microsoft.Xna.Framework.Content.Texture2DReader" => Box::from(Texture2D::from_bytes(data)),
            _ => {
                // Logger::get_logger("XNB").warn(&format!("Unknown class {}, parsing void", class));
                Box::from(Void::from_bytes(data))
            }
        }
    }
}