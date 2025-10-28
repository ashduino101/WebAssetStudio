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
    GodotScriptBytecode,
    GodotProjectSettings,
    FSB5,
    UnrealPak,
    UnrealPackage,
    XNB,
    GameMakerBundle,

    PE,
    ELF,

    DirectXShader,

    GZipCompressed
}

impl AssetFormat {
    pub(crate) fn get_id(&self) -> i32 {
        match self {
            AssetFormat::Resource => 0,
            AssetFormat::UnityBundle => 100,
            AssetFormat::UnityAsset => 101,
            AssetFormat::GodotPck => 200,
            AssetFormat::GodotResource => 201,
            AssetFormat::GodotStreamTexture => 202,
            AssetFormat::GodotCompressedTexture => 203,
            AssetFormat::GodotScriptBytecode => 204,
            AssetFormat::GodotProjectSettings => 205,
            AssetFormat::FSB5 => 300,
            AssetFormat::UnrealPak => 400,
            AssetFormat::UnrealPackage => 401,
            AssetFormat::XNB => 500,
            AssetFormat::PE => 600,
            AssetFormat::ELF => 601,
            AssetFormat::DirectXShader => 700,
            AssetFormat::GameMakerBundle => 800,
            AssetFormat::GZipCompressed => -1
        }
    }
}
