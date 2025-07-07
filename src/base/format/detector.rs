use std::io::Read;
use bytes::Bytes;
use flate2::bufread::GzDecoder;
use crate::base::format::AssetFormat;

fn check_magic_basic(buf: &mut Bytes, magic: &[u8]) -> bool {
    &buf[0..magic.len()] == magic
}

pub(crate) fn detect_asset_format(buf: &mut Bytes) -> anyhow::Result<AssetFormat> {
    // Unity
    if check_magic_basic(buf, b"Unity") {
        return Ok(AssetFormat::UnityBundle);
    }
    // asset todo

    // Godot
    if check_magic_basic(buf, b"GDPC") {
        return Ok(AssetFormat::GodotPck);
    }
    if check_magic_basic(buf, b"RSRC") {
        return Ok(AssetFormat::GodotResource);
    }
    if check_magic_basic(buf, b"GDST") {
        return Ok(AssetFormat::GodotStreamTexture);
    }
    if check_magic_basic(buf, b"GST2") {
        return Ok(AssetFormat::GodotCompressedTexture);
    }
    if check_magic_basic(buf, b"GDSC") {
        return Ok(AssetFormat::GodotScene);
    }

    // FSB
    if check_magic_basic(buf, b"FSB5") {
        return Ok(AssetFormat::FSB5);
    }

    // Unreal
    // pak todo (ugh)
    if check_magic_basic(buf, &[0xc1, 0x83, 0x2a, 0x9e]) {
        return Ok(AssetFormat::UnrealPackage);
    }

    // XNA
    if check_magic_basic(buf, b"XNB") {
        return Ok(AssetFormat::XNB);
    }

    // Executables
    if check_magic_basic(buf, b"PE") {
        return Ok(AssetFormat::PE);
    }
    if check_magic_basic(buf, b"\x7fELF") {
        return Ok(AssetFormat::ELF);
    }

    // Special cases
    if check_magic_basic(buf, &[0x1f, 0x8b]) {
        return Ok(AssetFormat::GZipCompressed);
    }

    Ok(AssetFormat::Resource)
}