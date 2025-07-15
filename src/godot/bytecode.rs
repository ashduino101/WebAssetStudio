use std::collections::HashMap;
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use num_enum::TryFromPrimitive;
use crate::godot::variant::Variant;

// Everything before 13 is the same binary-wise,
// the tokens are probably different though
// 13: last v1 version
//  - last commit: 25c978730bd6d09091ae0f148766f6833e6e1400
// 100: v2 update (lots of token changes!)
//  - Bytecode was removed in 5d6e8538065050d5f5579ec03cfa9e241811e062
//    up until b4d0a09f15c60c88bbf516d2f6dcdb451dcad9c7
// 101: compression added (binary change)
const MAX_SUPPORTED_VERSION: u32 = 101;

#[derive(Debug, Eq, PartialEq, TryFromPrimitive)]
#[repr(u32)]
pub enum TokenTypeV3 {
    Empty = 0,
    Identifier,
    Constant,
    TkSelf,
    BuiltInType,
    BuiltInFunc,
    In,
    Equal,
    NotEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    And,
    Or,
    Not,
    Add,
    Sub,
    Mul,
    Div,
    Mod,
    ShiftLeft,
    ShiftRight,
    Assign,
    AssignAdd,
    AssignSub,
    AssignMul,
    AssignDiv,
    AssignMod,
    AssignShiftLeft,
    AssignShiftRight,
    AssignBitAnd,
    AssignBitOr,
    AssignBitXor,
    BitAnd,
    BitOr,
    BitXor,
    BitInvert,
    //PLUS_PLUS,
    //MINUS_MINUS,
    If,
    Elif,
    Else,
    For,
    While,
    Break,
    Continue,
    Pass,
    Return,
    Match,
    Function,
    Class,
    ClassName,
    Extends,
    Is,
    OnReady,
    Tool,
    Static,
    Export,
    SetGet,
    Const,
    Var,
    As,
    Void,
    Enum,
    Preload,
    Assert,
    Yield,
    Signal,
    Breakpoint,
    Remote,
    Sync,
    Master,
    Slave, // Deprecated by PUPPET, to remove in 4.0
    Puppet,
    RemoveSync,
    MasterSync,
    PuppetSync,
    BracketOpen,
    BracketClose,
    CurlyBracketOpen,
    CurlyBracketClose,
    ParenthesisOpen,
    ParenthesisClose,
    Comma,
    Semicolon,
    Period,
    QuestionMark,
    Colon,
    Dollar,
    ForwardArrow,
    Newline,
    ConstPi,
    ConstTau,
    Wildcard,
    ConstInf,
    ConstNan,
    Error,
    Eof,
    Cursor //used for code completion
}

#[derive(Debug, Eq, PartialEq, TryFromPrimitive)]
#[repr(u32)]
pub enum TokenTypeV4 {
    Empty = 0,
    // Basic
    Annotation,
    Identifier,
    Literal,
    // Comparison
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    EqualEqual,
    BangEqual,
    // Logical
    And,
    Or,
    Not,
    AmpersandAmpersand,
    PipePipe,
    Bang,
    // Bitwise
    Ampersand,
    Pipe,
    Tilde,
    Caret,
    LessLess,
    GreaterGreater,
    // Math
    Plus,
    Minus,
    Star,
    StarStar,
    Slash,
    Percent,
    // Assignment
    Equal,
    PlusEqual,
    MinusEqual,
    StarEqual,
    StarStarEqual,
    SlashEqual,
    PercentEqual,
    LessLessEqual,
    GreaterGreaterEqual,
    AmpersandEqual,
    PipeEqual,
    CaretEqual,
    // Control flow
    If,
    Elif,
    Else,
    For,
    While,
    Break,
    Continue,
    Pass,
    Return,
    Match,
    When,
    // Keywords
    As,
    Assert,
    Await,
    Breakpoint,
    Class,
    ClassName,
    Const,
    Enum,
    Extends,
    Func,
    In,
    Is,
    Namespace,
    Preload,
    TkSelf,
    Signal,
    Static,
    Super,
    Trait,
    Var,
    Void,
    Yield,
    // Punctuation
    BracketOpen,
    BracketClose,
    BraceOpen,
    BraceClose,
    ParenthesisOpen,
    ParenthesisClose,
    Comma,
    Semicolon,
    Period,
    PeriodPeriod,
    PeriodPeriodPeriod,
    Color,
    Dollar,
    ForwardArrow,
    Underscore,
    // Whitespace
    Newline,
    Indent,
    Dedent,
    // Constants
    ConstPi,
    ConstTau,
    ConstInf,
    ConstNan,
    // Error message improvement
    VcsConflictMarker,
    Backtick,
    QuestionMark,
    // Special
    Error,
    Eof
}

#[derive(Debug, Clone)]
pub(crate) struct ScriptBytecode {
    pub(crate) identifiers: Vec<String>,
    pub(crate) constants: Vec<Variant>,
    pub(crate) lines: HashMap<u32, u32>,
    pub(crate) tokens: Vec<u32>,
}

impl ScriptBytecode {
    pub(crate) fn from_bytes(data: &mut Bytes, major_ver: i32) -> anyhow::Result<Self> {
        if data.get_chars(4) != "GDSC" {
            return Err(anyhow!("not a compiled script"));
        }
        let version = data.get_u32_le();
        if version > MAX_SUPPORTED_VERSION {
            return Err(anyhow!("bytecode version too recent"));
        }

        let num_identifiers = data.get_u32_le();
        let num_constants = data.get_u32_le();
        let num_lines = data.get_u32_le();
        let num_tokens = data.get_u32_le();

        let mut identifiers = Vec::new();
        for _ in 0..num_identifiers {
            let len = data.get_u32_le();
            let mut chars = Vec::new();
            for _ in 0..len {
                chars.push(data.get_u8() ^ 0xb6);
            }
            identifiers.push(String::from_utf8(chars)?)
        }

        let mut constants = Vec::new();
        for _ in 0..num_constants {
            constants.push(Variant::from_bytes(data, &Vec::new(), false, false, major_ver)?);
        }

        let mut lines = HashMap::new();
        for _ in 0..num_lines {
            let token_index = data.get_u32_le();
            let column = data.get_u32_le();
            lines.insert(token_index, column);
        }

        let mut tokens = Vec::new();
        for _ in 0..num_tokens {
            let next_byte = *data.get(0).unwrap();
            if next_byte & 0x80 != 0 {
                tokens.push(data.get_u32_le() & 0xffffff7f);
            } else {
                tokens.push(data.get_u8() as u32);
            }
        }

        Ok(ScriptBytecode {
            identifiers,
            constants,
            lines,
            tokens
        })
    }
}
