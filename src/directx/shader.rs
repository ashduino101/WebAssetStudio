use bytes::{Buf, Bytes};
use crate::directx::types::{SymbolClass, SymbolType};

const MAX_MAJOR: u8 = 3;
const MAX_MINOR: u8 = 255;

// Modified from MojoShader
// This is the ID for a D3DXSHADER_CONSTANTTABLE in the bytecode comments.
const CTAB_ID: u32 = 0x42415443;  // 0x42415443 == 'CTAB'
const CTAB_SIZE: u32 = 28;  // sizeof (D3DXSHADER_CONSTANTTABLE).
const CINFO_SIZE: u32 = 20;  // sizeof (D3DXSHADER_CONSTANTINFO).
const CTYPEINFO_SIZE: u32 = 16;  // sizeof (D3DXSHADER_TYPEINFO).
const CMEMBERINFO_SIZE: u32 = 8;  // sizeof (D3DXSHADER_STRUCTMEMBERINFO)

// Preshader magic values...
const PRES_ID: u32 = 0x53455250;  // 0x53455250 == 'PRES'
const PRSI_ID: u32 = 0x49535250;  // 0x49535250 == 'PRSI'
const CLIT_ID: u32 = 0x54494C43;  // 0x54494C43 == 'CLIT'
const FXLC_ID: u32 = 0x434C5846;  // 0x434C5846 == 'FXLC'

#[derive(Debug, Clone)]
pub struct PreshaderInstruction {
    opcode: PreshaderOp,
    element_count: u32,
    operands: Vec<PreshaderOperand>
}

#[derive(Debug, Clone)]
pub struct PreshaderOperand {
    r#type: PreshaderOperandType,
    index: u32,
    array_registers: Vec<u32>
}

#[derive(Debug, Clone)]
pub enum PreshaderOp {
    Nop,
    Mov,
    Neg,
    Rcp,
    Frc,
    Exp,
    Log,
    Rsq,
    Sin,
    Cos,
    Asin,
    Acos,
    Atan,
    Min,
    Max,
    Lt,
    Ge,
    Add,
    Mul,
    Atan2,
    Div,
    Cmp,
    Movc,
    Dot,
    Noise,
    MinScalar,
    MaxScalar,
    LtScalar,
    GeScalar,
    AddScalar,
    MulScalar,
    Atan2Scalar,
    DivScalar,
    DotScalar,
    NoiseScalar
}

#[derive(Debug, Clone)]
pub enum PreshaderOperandType {
    Literal,
    Input,
    Output,
    Temp
}

#[derive(Debug, Clone)]
pub enum RegisterSet {
    Bool,
    Int4,
    Float4,
    Sampler,
    Unknown
}

#[derive(Debug, Clone)]
pub struct SymbolStructMember {
    name: String,
    info: Box<SymbolTypeInfo>
}

#[derive(Debug, Clone)]
pub struct SymbolTypeInfo {
    parameter_class: SymbolClass,
    parameter_type: SymbolType,
    rows: u16,
    columns: u16,
    elements: u16,
    members: Vec<SymbolStructMember>
}

#[derive(Debug, Clone)]
pub struct Symbol {
    name: String,
    register_set: RegisterSet,
    register_index: u16,
    register_count: u16,
    info: SymbolTypeInfo
}

#[derive(Debug, Clone)]
pub struct ConstantTable {
    pub creator: String,
    pub version: u32,
    pub target: String,
    pub symbols: Vec<Symbol>
}

#[derive(Debug, Clone)]
pub enum ShaderType {
    Pixel,
    Vertex,
    Unknown
}

#[derive(Debug, Clone)]
pub struct FXShader {
    pub r#type: ShaderType,
    pub major: u8,
    pub minor: u8,
    pub constant_table: ConstantTable,
}

impl FXShader {
    pub fn from_bytes(data: &mut Bytes) -> FXShader {
        // Version token
        let token = data.get_u32_le();
        let shadertype = match (token >> 16) & 0xFFFF {
            0xFFFF => ShaderType::Pixel,
            0xFFFE => ShaderType::Vertex,
            _ => ShaderType::Unknown
        };
        let major = ((token >> 8) & 0xFF) as u8;
        let minor = (token & 0xFF) as u8;

        if major > MAX_MAJOR || (major == MAX_MAJOR && minor > MAX_MINOR) {
            panic!("invalid shader version");  // FIXME: return error
        }

        // Initialize default CTAB - will fail validation if not set
        let mut constant_table = ConstantTable {
            creator: "".to_string(),
            version: 0,
            target: "INVALID".to_string(),
            symbols: vec![]
        };

        while data.remaining() > 0 {
            let token = data.get_u32_le();
            // handle comment token
            if (token & 0xFFFF) == 0xFFFE {
                if (token & 0x80000000) != 0 {
                    panic!("high bit set in comment token");
                }

                let token_count = (token >> 16) & 0xFFFF;
                let id = data.get_u32_le();
                let size_bytes = ((token_count - 1) * 4) as usize;
                let mut chunk = data.slice(0..size_bytes);
                data.advance(size_bytes);
                if id == PRES_ID {
                    // Preshader
                    let preshader = Self::parse_preshader(&mut chunk);
                } else if id == CTAB_ID {
                    // Constant table
                    constant_table = Self::parse_ctab(&mut chunk);
                } else {
                    panic!("unknown chunk {}", id);
                }
            } else if token == 0x0000FFFF {
                println!("end");
                break;  // end
            } else if token == 0x0000FFFD {
                // FIXME phase token
            } else {  // instruction token
                let opcode = token & 0xFFFF;
                let controls = (token >> 16) & 0xFF;
                let insttoks = (token >> 24) & 0x0F;
                let coissue = (token & 0x40000000) != 0;
                let predicated = (token & 0x10000000) != 0;
                println!("{} {} {} {} {}", opcode, controls, insttoks, coissue, predicated);
            }
        }

        FXShader {
            r#type: shadertype,
            major,
            minor,
            constant_table
        }
    }

    fn parse_preshader(pres: &mut Bytes) {
        const VERSION_MAGIC: u32 = 0x46580000;
        const MIN_VERSION: u32 = 0x00000200 | VERSION_MAGIC;
        const MAX_VERSION: u32 = 0x00000201 | VERSION_MAGIC;

        let version = pres.get_u32_le();
        if version < MIN_VERSION || version > MAX_VERSION {
            panic!("preshader version unsupported");
        }

        let mut constant_table = ConstantTable {
            creator: "".to_string(),
            version,
            target: "".to_string(),
            symbols: vec![]
        };

        let mut output_map_count = 0;
        let mut output_map = Vec::new();
        let mut literals = Vec::new();

        while pres.has_remaining() {
            let token = pres.get_u32_le();
            if (token & 0xFFFF) == 0xFFFE {
                if (token & 0x80000000) != 0 {
                    panic!("high bit set in comment token");
                }

                let token_count = (token >> 16) & 0xFFFF;
                let id = pres.get_u32_le();
                let size_bytes = ((token_count - 1) * 4) as usize;
                let mut chunk = pres.slice(0..size_bytes);
                pres.advance(size_bytes);
                if id == CTAB_ID {
                    // Constant table
                    constant_table = Self::parse_ctab(&mut chunk);
                    println!("{:?}", constant_table);
                } else if id == PRSI_ID {
                    chunk.advance(28);  // FIXME: unknown
                    output_map_count = chunk.get_u32_le();
                    while chunk.has_remaining() {
                        output_map.push(chunk.get_u32_le());
                    }
                    println!("{} {:?}", output_map_count, output_map);
                } else if id == CLIT_ID {
                    let num_literals = chunk.get_u32_le();
                    for _ in 0..num_literals {
                        literals.push(chunk.get_f64_le());
                    }
                    println!("{:?}", literals);
                } else if id == FXLC_ID {
                    let num_opcodes = chunk.get_u32_le();
                    let mut instructions = Vec::new();
                    for _ in 0..num_opcodes {
                        let opcode_token = chunk.get_u32_le();
                        let opcode = match (opcode_token >> 16) & 0xFFFF {
                            0x1000 => PreshaderOp::Mov,
                            0x1010 => PreshaderOp::Neg,
                            0x1030 => PreshaderOp::Rcp,
                            0x1040 => PreshaderOp::Frc,
                            0x1050 => PreshaderOp::Exp,
                            0x1060 => PreshaderOp::Log,
                            0x1070 => PreshaderOp::Rsq,
                            0x1080 => PreshaderOp::Sin,
                            0x1090 => PreshaderOp::Cos,
                            0x10A0 => PreshaderOp::Asin,
                            0x10B0 => PreshaderOp::Acos,
                            0x10C0 => PreshaderOp::Atan,
                            0x2000 => PreshaderOp::Min,
                            0x2010 => PreshaderOp::Max,
                            0x2020 => PreshaderOp::Lt,
                            0x2030 => PreshaderOp::Ge,
                            0x2040 => PreshaderOp::Add,
                            0x2050 => PreshaderOp::Mul,
                            0x2060 => PreshaderOp::Atan2,
                            0x2080 => PreshaderOp::Div,
                            0x3000 => PreshaderOp::Cmp,
                            0x3010 => PreshaderOp::Movc,
                            0x5000 => PreshaderOp::Dot,
                            0x5020 => PreshaderOp::Noise,
                            0xA000 => PreshaderOp::MinScalar,
                            0xA010 => PreshaderOp::MaxScalar,
                            0xA020 => PreshaderOp::LtScalar,
                            0xA030 => PreshaderOp::GeScalar,
                            0xA040 => PreshaderOp::AddScalar,
                            0xA050 => PreshaderOp::MulScalar,
                            0xA060 => PreshaderOp::Atan2Scalar,
                            0xA080 => PreshaderOp::DivScalar,
                            0xD000 => PreshaderOp::DotScalar,
                            0xD020 => PreshaderOp::NoiseScalar,
                            _ => panic!("unknown preshader opcode")
                        };

                        let operand_count = chunk.get_u32_le() + 1;
                        let element_count = opcode_token & 0xff;

                        let mut operands = Vec::new();
                        for _ in 0..operand_count {
                            let num_arrays = chunk.get_u32_le();
                            let mode = chunk.get_u32_le();
                            let item = chunk.get_u32_le();
                            let mut array_registers = Vec::new();
                            let mut operand_type;
                            match mode {
                                1 => {
                                    operand_type = PreshaderOperandType::Literal;
                                },
                                2 => {
                                    operand_type = PreshaderOperandType::Input;
                                    if num_arrays > 0 {
                                        for _ in 0..num_arrays {
                                            chunk.get_u32_le();  // ??
                                            let jmp = chunk.get_u32_le();
                                            chunk.get_u32_le();  // ??
                                            let bigjmp = (jmp >> 4) * 4;
                                            let ltljmp = (jmp >> 2) & 3;
                                            let reg_value = bigjmp + ltljmp;
                                            array_registers.push(reg_value);
                                        }
                                    }
                                },
                                4 => {
                                    operand_type = PreshaderOperandType::Output;
                                },
                                7 => {
                                    operand_type = PreshaderOperandType::Temp
                                }
                                _ => panic!("unknown operand type")
                            }

                            operands.push(PreshaderOperand {
                                r#type: operand_type,
                                index: item,
                                array_registers
                            });
                        }
                        instructions.push(PreshaderInstruction {
                            opcode,
                            element_count,
                            operands
                        });
                    }
                    println!("{:?}", instructions);
                } else {
                    panic!("unknown chunk in preshader");
                }
            }
        }
    }

    fn parse_ctab(ctab: &mut Bytes) -> ConstantTable {
        let ctab_blob = ctab.clone();
        let size = ctab.get_u32_le();
        let creator = ctab_blob.slice(ctab.get_u32_le() as usize..).get_cstring();
        let version = ctab.get_u32_le();
        let constants = ctab.get_u32_le();
        let constant_info = ctab.get_u32_le();
        ctab.get_u32_le();  // unknown
        let target = ctab_blob.slice(ctab.get_u32_le() as usize..).get_cstring();

        let table_size = ((constants as usize) * 20) + 28;

        let mut symbols = Vec::new();
        for _ in 0..constants {
            let name = ctab_blob.slice(ctab.get_u32_le() as usize..).get_cstring();
            let reg_set = ctab.get_u16_le();
            let reg_idx = ctab.get_u16_le();
            let reg_cnt = ctab.get_u16_le();
            ctab.get_u16_le();  // unknown
            let type_inf = ctab.get_u32_le() as usize;
            let default_val = ctab.get_u32_le();

            let register_set = match reg_set {
                0 => RegisterSet::Bool,
                1 => RegisterSet::Int4,
                2 => RegisterSet::Float4,
                3 => RegisterSet::Sampler,
                _ => RegisterSet::Unknown,
            };

            symbols.push(Symbol {
                name,
                register_set,
                register_index: reg_idx,
                register_count: reg_cnt,
                info: Self::parse_symbol_type_info(&ctab_blob, type_inf)
            });
        }
        ConstantTable {
            creator,
            version,
            target,
            symbols
        }
    }

    fn parse_symbol_type_info(ctab_data: &Bytes, info_offset: usize) -> SymbolTypeInfo {
        let mut type_data = ctab_data.slice(info_offset..);
        SymbolTypeInfo {
            parameter_class: SymbolClass::from_value(type_data.get_u16_le() as u32),
            parameter_type: SymbolType::from_value(type_data.get_u16_le() as u32),
            rows: type_data.get_u16_le(),
            columns: type_data.get_u16_le(),
            elements: type_data.get_u16_le(),
            members: {
                let num_elements = type_data.get_u16_le();
                let mut elements = Vec::new();
                for _ in 0..num_elements {
                    let name = ctab_data.slice(type_data.get_u32_le() as usize..).get_cstring();
                    let info = Self::parse_symbol_type_info(ctab_data, type_data.get_u32_le() as usize);
                    elements.push(SymbolStructMember { name, info: Box::new(info) });
                }
                elements
            }
        }
    }
}