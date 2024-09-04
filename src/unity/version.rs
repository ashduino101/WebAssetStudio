use std::str::FromStr;
use regex::Regex;

#[derive(Debug, Copy, Clone)]
pub enum ReleaseType {
    Alpha,
    Beta,
    Fix,
    Release
}

#[derive(Debug, Copy, Clone)]
pub struct UnityVersion {
    pub(crate) major: i32,
    pub(crate) minor: i32,
    pub(crate) patch: i32,
    pub(crate) release_type: ReleaseType,
    pub(crate) release_num: i32
}

impl UnityVersion {
    pub fn parse(val: &str) -> anyhow::Result<UnityVersion> {
        let pat = Regex::new(
            r#"(\d+)\.(\d+)\.(\d+)(?:([abf])(\d+))?"#
        ).expect("compile error");

        let caps = pat.captures(&val).unwrap();
        let major = i32::from_str(caps.get(1).unwrap().as_str())?;
        let minor = i32::from_str(caps.get(2).unwrap().as_str())?;
        let patch = i32::from_str(caps.get(3).unwrap().as_str())?;
        let rt = if let Some(t) = caps.get(4) {
            match t.as_str() {
                "a" => ReleaseType::Alpha,
                "b" => ReleaseType::Beta,
                "f" => ReleaseType::Fix,
                _ => ReleaseType::Release
            }
        } else {
            ReleaseType::Release
        };
        let num = if let Some(rv) = caps.get(5) {
            i32::from_str(rv.as_str())?
        } else {
            0
        };

        Ok(UnityVersion { major, minor, patch, release_type: rt, release_num: num })
    }
}
