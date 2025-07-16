use std::io::Read;
use bytes::{Buf, Bytes};
use flate2::bufread::GzDecoder;
use crate::base::format::AssetFormat;
use crate::logger::info;

fn check_magic_basic(buf: &mut Bytes, magic: &[u8]) -> bool {
    &buf[0..magic.len()] == magic
}

pub(crate) fn check_unity_asset(buf: &mut Bytes) -> bool {
    let orig_len = buf.len();
    if orig_len < 20 {
        return false;
    }
    buf.get_i32();
    let mut file_size = buf.get_i32() as usize;
    let version = buf.get_i32();
    let mut data_offset = buf.get_i32() as usize;
    if version >= 22 {
        if orig_len < 48 {
            return false;
        }
        data_offset = buf.get_i64() as usize;
        file_size = buf.get_i64() as usize;
    }
    file_size == orig_len && data_offset < orig_len
}

pub(crate) fn detect_asset_format(buf: &mut Bytes) -> anyhow::Result<AssetFormat> {
    // Unity
    if check_magic_basic(buf, b"Unity") {
        return Ok(AssetFormat::UnityBundle);
    }
    if check_unity_asset(&mut buf.clone()) {
        return Ok(AssetFormat::UnityAsset);
    }

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
        return Ok(AssetFormat::GodotScriptBytecode);
    }
    if check_magic_basic(buf, b"ECFG") {
        return Ok(AssetFormat::GodotProjectSettings);
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

    // DirectX
    if check_magic_basic(buf, b"\x01\x09\xFF\xFE") {
        return Ok(AssetFormat::DirectXShader)
    }

    // Executables
    if check_magic_basic(buf, b"MZ") {
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