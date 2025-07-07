use std::{error::Error, fmt};
use wasm_bindgen::JsValue;

#[derive(Debug)]
pub(crate) struct ParseError {
    msg: String
}

impl Error for ParseError {}

#[allow(dead_code)]
impl ParseError {
    pub fn new(msg: &str) -> ParseError {
        ParseError {
            msg: msg.to_owned()
        }
    }
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Parse error: {}", self.msg)
    }
}

#[macro_export]
macro_rules! js_err {
    ($($t: tt)*) => {
        match ($($t)*) {
            Ok(r) => Ok(r),
            Err(e) => Err(anyhow::anyhow!(e.as_string().or_else(|| Some("An unexpected error occurred".to_owned())).unwrap()))
        }
    };
}