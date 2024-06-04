#[derive(Debug, Copy, Clone, PartialEq)]
pub(crate) enum SymbolClass {
    Scalar,
    Vector,
    MatrixRows,
    MatrixColumns,
    Object,
    Struct,
    Invalid
}

impl SymbolClass {
    pub fn from_value(value: u32) -> SymbolClass {
        match value {
            0 => SymbolClass::Scalar,
            1 => SymbolClass::Vector,
            2 => SymbolClass::MatrixRows,
            3 => SymbolClass::MatrixColumns,
            4 => SymbolClass::Object,
            5 => SymbolClass::Struct,
            _ => SymbolClass::Invalid
        }
    }
}


#[derive(Debug, Copy, Clone, PartialEq)]
pub(crate) enum SymbolType {
    Void,
    Bool,
    Int,
    Float,
    String,
    Texture,
    Texture1D,
    Texture2D,
    Texture3D,
    TextureCube,
    Sampler,
    Sampler1D,
    Sampler2D,
    Sampler3D,
    SamplerCube,
    PixelShader,
    VertexShader,
    PixelFragment,
    VertexFragment,
    Invalid  // or unsupported
}

impl SymbolType {
    pub fn from_value(value: u32) -> SymbolType {
        match value {
            0 => SymbolType::Void,
            1 => SymbolType::Bool,
            2 => SymbolType::Int,
            3 => SymbolType::Float,
            4 => SymbolType::String,
            5 => SymbolType::Texture,
            6 => SymbolType::Texture1D,
            7 => SymbolType::Texture2D,
            8 => SymbolType::Texture3D,
            9 => SymbolType::TextureCube,
            10 => SymbolType::Sampler,
            11 => SymbolType::Sampler1D,
            12 => SymbolType::Sampler2D,
            13 => SymbolType::Sampler3D,
            14 => SymbolType::SamplerCube,
            15 => SymbolType::PixelShader,
            16 => SymbolType::VertexShader,
            17 => SymbolType::PixelFragment,
            18 => SymbolType::VertexFragment,
            _ => SymbolType::Invalid,
        }
    }
}
