use std::{error::Error, fmt};

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