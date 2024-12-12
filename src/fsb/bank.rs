use bytes::{Buf, Bytes};
use crate::fsb::codecs::vorbis::fix_vorbis_container;
use crate::utils::buf::BufExt;
use crate::utils::pcm::{encode_wav, WavFormat};

#[derive(Debug, Copy, Clone)]
pub enum SoundFormat {
    Unknown,
    Pcm8,
    Pcm16,
    Pcm24,
    Pcm32,
    PcmFloat,
    GcAdpcm,
    ImaAdpcm,
    Vag,
    HeVag,
    Xma,
    Mpeg,
    Celt,
    Atrac9,
    Xwma,
    Vorbis,
    FAdpcm,
    Opus,
}

impl SoundFormat {
    pub fn from_bytes(data: &mut Bytes) -> SoundFormat {
        match data.get_i32_le() {
            1 => SoundFormat::Pcm8,
            2 => SoundFormat::Pcm16,
            3 => SoundFormat::Pcm24,
            4 => SoundFormat::Pcm32,
            5 => SoundFormat::PcmFloat,
            6 => SoundFormat::GcAdpcm,
            7 => SoundFormat::ImaAdpcm,
            8 => SoundFormat::Vag,
            9 => SoundFormat::HeVag,
            10 => SoundFormat::Xma,
            11 => SoundFormat::Mpeg,
            12 => SoundFormat::Celt,
            13 => SoundFormat::Atrac9,
            14 => SoundFormat::Xwma,
            15 => SoundFormat::Vorbis,
            16 => SoundFormat::FAdpcm,
            17 => SoundFormat::Opus,
            _ => SoundFormat::Unknown
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub enum ChunkType {
    Unknown,
    Channels,
    SampleRate,
    Loop,
    Comment,
    XmaSeekTable,
    DspCoefficients,
    Atrac9Config,
    XwmaConfig,
    VorbisSeekTable,
    PeakVolume,
    VorbisIntraLayers,
    OpusDataSize
}

impl ChunkType {
    pub fn from_u32(data: u32) -> ChunkType {
        match data {
            1 => ChunkType::Channels,
            2 => ChunkType::SampleRate,
            3 => ChunkType::Loop,
            4 => ChunkType::Comment,
            6 => ChunkType::XmaSeekTable,
            7 => ChunkType::DspCoefficients,
            9 => ChunkType::Atrac9Config,
            10 => ChunkType::XwmaConfig,
            11 => ChunkType::VorbisSeekTable,
            13 => ChunkType::PeakVolume,
            14 => ChunkType::VorbisIntraLayers,
            15 => ChunkType::OpusDataSize,
            _ => ChunkType::Unknown
        }
    }
}

#[derive(Debug)]
pub struct SubSound {
    pub is_stereo: bool,
    pub frequency: u32,
    pub sample_rate: u32,
    pub data: Bytes,
    pub comment: Option<String>,
    pub format: SoundFormat,
}

#[derive(Debug)]
pub struct SoundBank {
    subversion: i32,
    num_subsounds: i32,
    header_chunk_size: i32,
    data_chunk_size: i32,
    total_size: i32,
    pub format: SoundFormat,
    pub subsounds: Vec<SubSound>
}

impl SoundBank {
    pub fn new(data: &mut Bytes) -> SoundBank {
        let magic = data.get_chars(4);
        if magic == "FSB4" {
            panic!("FSB4 unsupported");
        }
        if magic != "FSB5" {
            panic!("not an FSB file");
        }
        let subversion = data.get_i32_le();
        if subversion != 1 {
            panic!("deprecated or unsupported FSB version {}!", subversion);
        }
        let num_subsounds = data.get_i32_le();
        let header_chunk_size = data.get_i32_le();
        let data_chunk_size = data.get_i32_le();
        let total_size = data.get_i32_le();
        let format = SoundFormat::from_bytes(data);
        data.advance(32);  // FIXME: figure out what this is -- might have a hash, is it checked?

        let mut chunk_data = data.slice(0..header_chunk_size as usize);
        data.advance(header_chunk_size as usize);

        let mut subsounds = Vec::new();
        for _ in 0..num_subsounds {
            let meta = chunk_data.get_u64_le();
            let mut next_chunk = (meta & 1) == 1;  // 1 bit
            let frequency: u32 = match (meta & 0x1f) >> 1 {
                0 => 4000,
                1 => 8000,
                2 => 11000,
                3 => 11025,
                4 => 16000,
                5 => 22050,
                6 => 24000,
                7 => 32000,
                8 => 44100,
                9 => 48000,
                10 => 96000,
                other => panic!("unknown frequency {}", other)
            };  // 4 bits
            let stereo = ((meta & 0x3f) >> 5) != 0;  // 1 bit
            let data_offset = (meta & 0x3ffffffff) >> 6;  // 28 bits
            let sample_rate = (meta >> 34) as u32;  // 30 bits
            // console_log!("freq {} stereo {} offset {} rate {}", frequency, stereo, data_offset, sample_rate);

            let mut sample_data = data.slice(data_offset as usize..(total_size - data_chunk_size) as usize);

            // let mut chunks = Vec::new();
            let mut vorbis_crc = 0;
            let mut comment = None;
            while next_chunk {
                let meta = chunk_data.get_u32_le();
                next_chunk = (meta & 1) == 1;  // 1 bit
                let chunk_size = ((meta & 0x1ffffff) >> 1) as usize;  // 24 bits
                let chunk_type = ChunkType::from_u32((meta & 0xffffffff) >> 25);  // 7 bits
                let mut chunk = chunk_data.slice(0..chunk_size);
                chunk_data.advance(chunk_size);
                match chunk_type {
                    ChunkType::VorbisSeekTable => {
                        vorbis_crc = chunk.get_u32_le();
                    },
                    ChunkType::Comment => {
                        chunk.get_u32_le();  // ???
                        // FIXME: fix cstring decoder so utf-8 is read correctly
                        let comment_data = chunk.slice(0..chunk.iter().position(|&b| b == 0).unwrap_or(0));
                        comment = Some(String::from_utf8(Vec::from(comment_data)).unwrap());
                    }
                    _ => {}
                }
            }

            let channels = if stereo { 2u16 } else { 1 };
            let data = match format {
                SoundFormat::Vorbis => {
                    fix_vorbis_container(&mut sample_data, channels as i32, frequency, vorbis_crc, sample_rate).expect("error while fixing vorbis container")
                },
                SoundFormat::Pcm8 => {
                    encode_wav(sample_data, WavFormat::PCM8, frequency, channels)
                },
                SoundFormat::Pcm16 => {
                    encode_wav(sample_data, WavFormat::PCM16, frequency, channels)
                },
                SoundFormat::Pcm24 => {
                    encode_wav(sample_data, WavFormat::PCM24, frequency, channels)
                },
                SoundFormat::Pcm32 => {
                    encode_wav(sample_data, WavFormat::PCM32, frequency, channels)
                },
                SoundFormat::PcmFloat => {
                    encode_wav(sample_data, WavFormat::PCMF32, frequency, channels)
                },
                // SoundFormat::ImaAdpcm => {
                //     encode_wav(sample_data, WavFormat::IMAADPCM, frequency, if stereo { 2 } else { 1 })
                // }
                _ => {
                    // panic!("unsupported: {:?}", format)
                    Bytes::new()
                }
            };

            subsounds.push(SubSound {
                is_stereo: stereo,
                frequency,
                sample_rate,
                data,
                format,
                comment,
            });
        }

        data.advance(total_size as usize);

        SoundBank {
            subversion,
            num_subsounds,
            header_chunk_size,
            data_chunk_size,
            total_size,
            format,
            subsounds
        }
    }
}
