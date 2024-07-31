
use std::collections::HashMap;
use std::io;
use std::io::Cursor;
use std::sync::{Mutex, OnceLock};
use bitstream_io::{BitRead, BitReader, LittleEndian};
use bytes::{Buf, BufMut, Bytes, BytesMut};
use bzip2_rs::DecoderReader;

use ogg::{PacketWriteEndInfo, PacketWriter};


use wasm_bindgen::JsValue;

use crate::utils::buf::BufMutExt;


use crate::utils::vorbis::ilog;
use crate::utils::time::now;
use crate::logger::info;

const HEADER_LOOKUP: &[u8] = include_bytes!("vorbis_headers.bz2");

const BLOCKSIZE_SMALL: usize = 0x100;
const BLOCKSIZE_LARGE: usize = 0x800;

const SERIAL: u32 = 0x42237000;

type HeaderLookup = HashMap<u32, Bytes>;

fn get_lookup_table() -> &'static Mutex<HeaderLookup> {
    static LOOKUP: OnceLock<Mutex<HeaderLookup>> = OnceLock::new();
    LOOKUP.get_or_init(|| {
        let start = now();
        let mut v = HashMap::new();
        // let mut data = lz4_decompress(HEADER_LOOKUP, LOOKUP_RAW_SIZE).expect("lookup table corrupt");
        let mut decoder = DecoderReader::new(HEADER_LOOKUP);
        let mut buf = Vec::new();
        io::copy(&mut decoder, &mut buf).expect("failed to copy data");
        let mut data = Bytes::from(buf);
        let num_entries = data.get_u32_le();
        for _ in 0..num_entries {
            let crc = data.get_u32_le();
            let header_len = data.get_u16_le() as usize;
            let header = data.slice(0..header_len);
            data.advance(header_len);
            v.insert(crc, header);
        }
        let elapsed = now() - start;
        info!("Loaded Vorbis header lookups in {} ms", elapsed);
        Mutex::new(v)
    })
}


fn create_vorbis_header(packet_type: u8) -> Bytes {
    let mut data = BytesMut::new();
    data.put_u8(packet_type);
    data.put_chars("vorbis".to_owned());
    data.into()
}


fn create_id_header(channels: u8, frequency: u32, bitrate: u32) -> Bytes {
    let mut data = BytesMut::new();
    data.put_slice(&create_vorbis_header(1)[..]);
    data.put_u32_le(0);  // version
    data.put_u8(channels);
    data.put_u32_le(frequency);
    data.put_u32_le(0);  // max bitrate
    data.put_u32_le(bitrate);  // nominal bitrate
    data.put_u32_le(0);  // min bitrate
    data.put_u8((((ilog(BLOCKSIZE_LARGE as u32) - 1) << 4) | (ilog(BLOCKSIZE_SMALL as u32) - 1)) as u8);  // block sizes (8 [0x100] and 11 [0x800])
    data.put_u8(1);  // framing flag (1 bit)
    data.into()
}

fn create_comment_header(vendor: String, user_comments: Vec<String>) -> Bytes {
    let mut data = BytesMut::new();
    data.put_slice(&create_vorbis_header(3)[..]);
    data.put_string(vendor);
    data.put_u32_le(user_comments.len() as u32);
    for comment in user_comments {
        data.put_string(comment);
    }
    data.put_u8(1);  // framing flag
    data.into()
}

fn get_packet_blocksize(packet: &mut Bytes) -> Result<usize, io::Error> {
    let mut bitstream = BitReader::endian(Cursor::new(&packet[..]), LittleEndian);
    if bitstream.read::<u8>(1)? != 0 {
        panic!("tried to calculate packet block size on a non-audio packet");
    }
    let mode = bitstream.read::<u8>(1)?;
    Ok(if mode == 0 { BLOCKSIZE_SMALL } else { BLOCKSIZE_LARGE })
}


pub fn fix_vorbis_container(data: &mut Bytes, channels: i32, sample_rate: u32, setup_crc: u32, bitrate: u32) -> Result<Bytes, JsValue> {
    let setup_data = get_lookup_table().lock().expect("failed to lock").get(&setup_crc).expect("no header available for crc").clone();
    let mut ogg_out = Vec::new();
    let mut packet_writer = PacketWriter::new(Cursor::new(&mut ogg_out));

    let id_header = create_id_header(channels as u8, sample_rate, bitrate);
    let comment_header = create_comment_header(
        "Encoded by WebAssetStudio".to_owned(),
        vec![format!("encoder=WebAssetStudio v{}", env!("CARGO_PKG_VERSION")).to_owned()]
    );

    packet_writer.write_packet(
        &id_header[..],
        SERIAL,
        PacketWriteEndInfo::EndPage,
        0
    ).expect("failed to write identification header");

    packet_writer.write_packet(
        &comment_header[..],
        SERIAL,
        PacketWriteEndInfo::NormalPacket,
        0
    ).expect("failed to write comment header");

    packet_writer.write_packet(
        &setup_data[..],
        SERIAL,
        PacketWriteEndInfo::EndPage,
        0
    ).expect("failed to write setup header");

    let mut granule_pos = 0i64;
    let mut last_page_end_granulepos = 0i64;
    let mut prev_blocksize = 0i64;

    let mut sample_size = 0;
    if data.remaining() > 0 {
        sample_size = data.get_u16_le() as usize;
    }
    loop {
        let mut sample_data = data.slice(0..sample_size);
        data.advance(sample_size);

        let mut next_sample_size = 0;
        if data.remaining() >= 2 {
            next_sample_size = data.get_u16_le() as usize;
        }

        let is_end = data.remaining() <= 0 || next_sample_size == 0;

        let block_size = get_packet_blocksize(&mut sample_data).expect("failed to get block size") as i64;
        granule_pos = if prev_blocksize > 0 { granule_pos + (block_size + prev_blocksize) / 4 } else { 0 };
        let content = sample_data.to_vec();

        let write_mode = if is_end {
            PacketWriteEndInfo::EndStream
        } else {
            if (granule_pos - last_page_end_granulepos) > 10000 {
                last_page_end_granulepos = granule_pos;
                PacketWriteEndInfo::EndPage
            } else {
                PacketWriteEndInfo::NormalPacket
            }
        };

        packet_writer.write_packet(
            content,
            SERIAL,
            write_mode,
            granule_pos as u64
        ).expect("failed to write sample data");

        prev_blocksize = block_size;
        sample_size = next_sample_size;

        if is_end {
            break;
        }
    }

    return Ok(Bytes::from(ogg_out));
}