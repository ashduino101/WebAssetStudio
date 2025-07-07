#[derive(Debug, Clone)]
pub(crate) enum AssetType {
    Texture2D,
    Texture3D,
    AudioClip,
    VideoClip,
    Mesh,
    SkinnedMesh,
    Shader,
    Font,
    Misc
}