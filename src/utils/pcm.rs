use bytes::{BufMut, Bytes, BytesMut};
use crate::utils::buf::BufMutExt;

#[derive(Ord, PartialOrd, Eq, PartialEq)]
pub enum WavFormat {
    PCM8,
    PCM16,
    PCM24,
    PCM32,
    PCMF32,
    PCMF64,
    IMAADPCM
}

impl WavFormat {
    pub fn get_format_code(&self) -> u16 {
        match self {
            WavFormat::PCM8 | WavFormat::PCM16 | WavFormat::PCM24 | WavFormat::PCM32 => 1,
            WavFormat::PCMF32 | WavFormat::PCMF64 => 3,
            WavFormat::IMAADPCM => 17,
            _ => 0
        }
    }

    pub fn get_bits_per_sample(&self) -> u32 {
        match self {
            WavFormat::IMAADPCM => 4,
            WavFormat::PCM8 => 8,
            WavFormat::PCM16 => 16,
            WavFormat::PCM24 => 24,
            WavFormat::PCM32 => 32,
            WavFormat::PCMF32 => 32,
            WavFormat::PCMF64 => 32,
            _ => 0
        }
    }
}

pub fn encode_wav(data: Bytes, format: WavFormat, sample_rate: u32, channels: u16) -> Bytes {
    let mut writer = BytesMut::new();
    let bits_per_sample = format.get_bits_per_sample();
    writer.put_chars("RIFF".to_owned());
    writer.put_u32_le((data.len() + 36) as u32);  // WAVE chunk size
    writer.put_chars("WAVE".to_owned());

    writer.put_chars("fmt ".to_owned());
    writer.put_u32_le(if format == WavFormat::IMAADPCM { 20 } else { 16 });  // fmt size
    writer.put_u16_le(format.get_format_code());
    writer.put_u16_le(channels);
    writer.put_u32_le(sample_rate);
    writer.put_u32_le((sample_rate * bits_per_sample * (channels as u32)) / 8);
    if format == WavFormat::IMAADPCM {
        writer.put_u16_le(1024);
    } else {
        writer.put_u16_le(((channels as u32) * bits_per_sample / 8) as u16);
    }
    writer.put_u16_le(bits_per_sample as u16);
    if format == WavFormat::IMAADPCM {
        writer.put_u16_le(2);  // extra size
        writer.put_u16_le(1017);  // samples per block
    }

    writer.put_chars("data".to_owned());
    writer.put_u32_le(data.len() as u32);
    writer.put(data);

    writer.into()
}

// pub fn decode_ima_adpcm(data: Bytes) -> Bytes {
//     let writer = BytesMut::new();
//
// }
