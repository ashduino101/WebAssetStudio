use std::collections::HashMap;
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use crate::godot::variant::Variant;

#[derive(Debug, Clone)]
pub(crate) struct ProjectSettings {
    settings: HashMap<String, Variant>
}

impl ProjectSettings {
    pub(crate) fn from_bytes(data: &mut Bytes, major_ver: i32) -> anyhow::Result<Self> {
        if data.get_chars(4) != "ECFG" {
            return Err(anyhow!("not a project settings file"));
        }

        let mut settings = HashMap::new();
        let num_settings = data.get_u32_le();
        for _ in 0..num_settings {
            let key = data.get_string();
            let val_len = data.get_u32_le() as usize;
            let mut val_data = data.slice(0..val_len);
            data.advance(val_len);
            let val = Variant::from_bytes(&mut val_data, &Vec::new(), false, false, major_ver)?;
            settings.insert(key, val);
        }

        Ok(ProjectSettings { settings })
    }
}
