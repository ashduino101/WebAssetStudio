pub mod detector;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssetFormat {
    Resource,
    UnityBundle,
    UnityAsset,
    GodotPck,
    GodotResource,
    GodotStreamTexture,
    GodotCompressedTexture,
    GodotScene,
    FSB5,
    UnrealPak,
    UnrealPackage,
    XNB,
    PE,
    ELF,
    DirectXShader,

    GZipCompressed
}

impl AssetFormat {
    pub(crate) fn get_id(&self) -> i32 {
        match self {
            AssetFormat::Resource => 0,
            AssetFormat::UnityBundle => 1,
            AssetFormat::UnityAsset => 2,
            AssetFormat::GodotPck => 100,
            AssetFormat::GodotResource => 101,
            AssetFormat::GodotStreamTexture => 102,
            AssetFormat::GodotCompressedTexture => 103,
            AssetFormat::GodotScene => 104,
            AssetFormat::FSB5 => 200,
            AssetFormat::UnrealPak => 300,
            AssetFormat::UnrealPackage => 301,
            AssetFormat::XNB => 400,
            AssetFormat::PE => 500,
            AssetFormat::ELF => 501,
            AssetFormat::DirectXShader => 600,
            AssetFormat::GZipCompressed => -1
        }
    }
}
