use std::collections::HashMap;
use anyhow::anyhow;
use bytes::{Buf, Bytes};
use crate::godot::variant::{get_string, Variant};

#[derive(Debug, Clone)]
pub(crate) struct ExternalResourceReference {
    type_name: String,
    path: String,
    uid: i64
}

#[derive(Debug, Clone)]
pub(crate) struct InternalResourceReference {
    path: String,
    offset: usize
}

#[derive(Debug, Clone)]
pub(crate) struct Resource {
    r#type: String,
    properties: HashMap<String, Variant>
}

#[derive(Debug, Clone)]
pub(crate) struct ResourceFile {
    use_real_64: bool,
    major: i32,
    minor: i32,
    format_version: i32,
    type_name: String,
    import_offset: usize,
    flags: i32,
    uid: i64,
    string_table: Vec<String>,
    external_resources: Vec<ExternalResourceReference>,
    internal_resources: Vec<InternalResourceReference>,
    resource: Resource
}

impl ResourceFile {
    pub(crate) fn from_bytes(data: &mut Bytes) -> anyhow::Result<Self> {
        // TODO compressed (RSCC)
        if data.get_chars(4) != "RSRC" {
            return Err(anyhow!("not a resource file"));
        }

        let little_endian = data.get_i32_le() == 0;
        let use_real_64 = data.get_i32_ordered(little_endian) != 0;
        let major = data.get_i32_ordered(little_endian);
        let minor = data.get_i32_ordered(little_endian);
        let format_version = data.get_i32_ordered(little_endian);
        let type_name = data.get_string_ordered(little_endian);
        let import_offset = data.get_i64_ordered(little_endian) as usize;
        let flags = data.get_i32_ordered(little_endian);
        let uid = data.get_i64_ordered(little_endian);
        data.advance(44);  // reserved
        let mut string_table = Vec::new();
        let num_strings = data.get_i32_ordered(little_endian);
        for _ in 0..num_strings {
            string_table.push(data.get_string_ordered(little_endian));
        }
        let mut external_resources = Vec::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            external_resources.push(ExternalResourceReference {
                type_name: data.get_string_ordered(little_endian),
                path: data.get_string_ordered(little_endian),
                uid: if flags & 2 != 0 { data.get_i64_ordered(little_endian) } else { 0 },
            });
        }
        let mut internal_resources = Vec::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            internal_resources.push(InternalResourceReference {
                path: data.get_string_ordered(little_endian),
                offset: data.get_i64_ordered(little_endian) as usize,
            })
        }
        let resource_type = data.get_string_ordered(little_endian);
        let mut properties = HashMap::new();
        for _ in 0..data.get_i32_ordered(little_endian) {
            properties.insert(get_string(data, &string_table).unwrap(), Variant::from_bytes(data, format_version, &string_table)?);
        }
        Ok(ResourceFile {
            use_real_64,
            major,
            minor,
            format_version,
            type_name,
            import_offset,
            flags,
            uid,
            string_table,
            external_resources,
            internal_resources,
            resource: Resource {
                r#type: resource_type,
                properties,
            },
        })
    }
}
