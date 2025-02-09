use std::fmt::{Debug, Formatter};
use bytes::Bytes;
use crate::crunch::header::{CrunchFormat, CrunchHeader};
use crate::crunch::symbol_codec::{StaticHuffmanDataModel, SymbolCodec};

#[derive(Debug, Clone)]
struct BlockBufferElement {
    endpoint_reference: u16,
    color_endpoint_index: u16,
    alpha0_endpoint_index: u16,
    alpha1_endpoint_index: u16
}

#[derive(Clone)]
pub(crate) struct Unpacker {
    data: Bytes,
    header: CrunchHeader,
    codec: SymbolCodec,
    reference_encoding_dm: StaticHuffmanDataModel,
    endpoint_delta_dm: [StaticHuffmanDataModel; 2],
    selector_delta_dm: [StaticHuffmanDataModel; 2],
    color_endpoints: Vec<u32>,
    color_selectors: Vec<u32>,
    alpha_endpoints: Vec<u16>,
    alpha_selectors: Vec<u16>,
    block_buffer: Vec<BlockBufferElement>
}

// avoid formatting data
impl Debug for Unpacker {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Unpacker")
            .field("header", &self.header)
            .field("codec", &self.codec)
            .field("reference_encoding_dm", &self.reference_encoding_dm)
            .field("endpoint_delta_dm", &self.endpoint_delta_dm)
            .field("selector_delta_dm", &self.selector_delta_dm)
            .field("color_endpoints", &self.color_endpoints)
            .field("color_selectors", &self.color_selectors)
            .field("alpha_endpoints", &self.alpha_endpoints)
            .field("alpha_selectors", &self.alpha_selectors)
            .field("block_buffer", &self.block_buffer)
            .finish()
    }
}

impl Unpacker {
    pub(crate) fn new(data: Bytes) -> Unpacker {
        let header = CrunchHeader::from_bytes(&mut data.clone());
        Unpacker {
            data,
            header,
            codec: SymbolCodec::new(),
            reference_encoding_dm: StaticHuffmanDataModel::new(),
            endpoint_delta_dm: [StaticHuffmanDataModel::new(), StaticHuffmanDataModel::new()],
            selector_delta_dm: [StaticHuffmanDataModel::new(), StaticHuffmanDataModel::new()],
            color_endpoints: vec![],
            color_selectors: vec![],
            alpha_endpoints: vec![],
            alpha_selectors: vec![],
            block_buffer: vec![],
        }
    }

    fn init_tables(&mut self) -> bool {
        self.codec.start_decoding(self.data.clone().slice(self.header.tables_offset as usize..), self.header.tables_size as usize);
        if !self.codec.decode_receive_static_data_model(&mut self.reference_encoding_dm) {
            return false;
        }
        println!("got here1");

        if (self.header.color_endpoints.num == 0) && (self.header.alpha_endpoints.num == 0) {
            return false;
        }
        println!("got here2");


        if self.header.color_endpoints.num != 0 {
            if !self.codec.decode_receive_static_data_model(&mut self.endpoint_delta_dm[0]) {
                return false;
            }
            println!("got here3");

            if !self.codec.decode_receive_static_data_model(&mut self.selector_delta_dm[0]) {
                return false;
            }
            println!("got here4");

        }

        if (self.header.alpha_endpoints.num != 0) {
            if !self.codec.decode_receive_static_data_model(&mut self.endpoint_delta_dm[1]) {
                return false;
            }        println!("got here5");


            if !self.codec.decode_receive_static_data_model(&mut self.selector_delta_dm[1]) {
                return false;
            }
            println!("got here6");

        }

        self.codec.stop_decoding();
        println!("got here7");


        true
    }

    fn decode_palette(&mut self) -> bool {
        if self.header.color_endpoints.num > 0 {
            if !self.decode_color_endpoints() {
                return false;
            }
            // if !self.decode_color_selectors() {
            //     return false;
            // }
        }
        //
        // if (m_pHeader->m_alpha_endpoints.m_num) {
        //     if (!decode_alpha_endpoints())
        //     return false;
        //     if (!(m_pHeader->m_format == cCRNFmtETC2AS ? decode_alpha_selectors_etcs() : m_pHeader->m_format == cCRNFmtETC2A ? decode_alpha_selectors_etc() : decode_alpha_selectors()))
        //     return false;
        // }
        true
    }

    fn decode_color_endpoints(&mut self) -> bool {
        let num_color_endpoints = self.header.color_endpoints.num;
        let has_etc_color_blocks = self.header.format == CrunchFormat::ETC1 || self.header.format == CrunchFormat::ETC2 || self.header.format == CrunchFormat::ETC2A || self.header.format == CrunchFormat::ETC1S || self.header.format == CrunchFormat::ETC2AS;
        let has_subblocks = self.header.format == CrunchFormat::ETC1 || self.header.format == CrunchFormat::ETC2 || self.header.format == CrunchFormat::ETC2A;

        self.color_endpoints.resize(num_color_endpoints as usize, 0);

        self.codec.start_decoding(self.data.slice(self.header.color_endpoints.offset as usize..), self.header.color_endpoints.size as usize);

        let mut dm = [StaticHuffmanDataModel::new(), StaticHuffmanDataModel::new()];
        for i in 0..(if has_etc_color_blocks { 1 } else { 2 }) {
            if !self.codec.decode_receive_static_data_model(&mut dm[i]) {
                return false;
            }
        }

        let mut a = 0;
        let mut b = 0;
        let mut c = 0;
        let mut d = 0;
        let mut e = 0;
        let mut f = 0;

        for i in 0..num_color_endpoints {
            if has_etc_color_blocks {
                for b in 0..4 {
                    a += self.codec.decode(&mut dm[0]) << (b * 8);
                }
                a &= 0x1F1F1F1F;
                self.color_endpoints[i as usize] = if has_subblocks { a } else { (a & 0x07000000) << 5 | (a & 0x07000000) << 2 | 0x02000000 | (a & 0x001F1F1F) << 3 };
            } else {
                a = (a + self.codec.decode(&mut dm[0])) & 31;
                b = (b + self.codec.decode(&mut dm[1])) & 63;
                c = (c + self.codec.decode(&mut dm[0])) & 31;
                d = (d + self.codec.decode(&mut dm[0])) & 31;
                e = (e + self.codec.decode(&mut dm[1])) & 63;
                f = (f + self.codec.decode(&mut dm[0])) & 31;
                self.color_endpoints[i as usize] = c | (b << 5) | (a << 11) | (f << 16) | (e << 21) | (d << 27);
            }
        }

        self.codec.stop_decoding();

        true
    }

    pub(crate) fn init(&mut self) -> bool {
        if !self.init_tables() {
            return false;
        }

        if !self.decode_palette() {
            return false;
        }

        true
    }
}