use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use crate::utils::buf::{BufExt, FromBytes};

const SHARED_STRINGS: Bytes = Bytes::from_static(include_bytes!("strings.dat"));

fn get_string(table: &Bytes, offset: usize) -> String {
    let is_local_offset = (offset & 0x80000000) == 0;
    if is_local_offset {
        table.slice(offset..).get_cstring()
    } else {
        SHARED_STRINGS.slice(offset & 0x7fffffff..).get_cstring()
    }
}

pub trait TypeTreeReadable {

}

#[derive(Debug)]
pub struct TypeNode {
    version: u16,
    level: u8,
    type_flags: u8,
    type_name: String,
    name: String,
    size: i32,
    index: i32,
    meta_flags: u32,
    ref_hash: u64
}

impl TypeNode {
    pub fn from_bytes(data: &mut Bytes, version: u32, little_endian: bool, strings: &Bytes) -> TypeNode {
        TypeNode {
            version: data.get_u16_ordered(little_endian),
            level: data.get_u8(),
            type_flags: data.get_u8(),
            type_name: get_string(strings, data.get_u32_ordered(little_endian) as usize),
            name: get_string(strings, data.get_u32_ordered(little_endian) as usize),
            size: data.get_i32_ordered(little_endian),
            index: data.get_i32_ordered(little_endian),
            meta_flags: data.get_u32_ordered(little_endian),
            ref_hash: if version >= 19 { data.get_u64_ordered(little_endian) } else { 0u64 }
        }
    }

    pub fn parse_value(&self, data: &mut Bytes) -> Box<&dyn TypeTreeReadable> {
    }
}

#[derive(Debug)]
pub struct TypeInfo {
    pub class_id: i32,
    pub is_stripped: bool,
    pub script_type_index: i16,
    pub script_id: u128,
    pub old_type_hash: u128,
    pub nodes: Vec<TypeNode>,
    pub string_repr: String,
    pub type_deps: Vec<u32>
}

impl TypeInfo {
    pub fn from_bytes(data: &mut Bytes, version: u32, little_endian: bool, enable_type_trees: bool) -> Self {
        let class_id = data.get_i32_ordered(little_endian);
        let is_stripped = if version >= 16 { data.get_u8() != 0 } else { false };
        let script_type_index = if version >= 17 { data.get_i16_ordered(little_endian) } else { 0 };
        let script_id = if version >= 13 {
            if (version < 16 && class_id < 0) || (version >= 16 && class_id == 114) {
                data.get_u128()
            } else {
                0u128
            }
        } else { 0u128 };
        let old_type_hash = if version >= 13 { data.get_u128() } else { 0u128 };

        let mut nodes = Vec::new();
        let mut repr = "".to_string();
        if enable_type_trees {
            if version == 10 || version >= 12 {
                let num_nodes = data.get_u32_ordered(little_endian);
                let node_size = (num_nodes * if version >= 19 { 32 } else { 24 }) as usize;
                let string_table_size = data.get_u32_ordered(little_endian) as usize;
                let mut node_data = data.slice(0usize..node_size);
                data.advance(node_size);
                let string_table = data.slice(0usize..string_table_size);
                data.advance(string_table_size as usize);
                for _ in 0..num_nodes {
                    let node = TypeNode::from_bytes(&mut node_data, version, little_endian, &string_table);
                    repr += &format!("{}{} {}\n", "  ".to_owned().repeat(node.level as usize), node.type_name, node.name);
                    nodes.push(node);
                }
            } else {
                panic!("no legacy type tree support");
            }
        }

        let mut type_deps = Vec::new();
        if enable_type_trees {
            if version >= 21 {
                for _ in 0..data.get_u32_ordered(little_endian) {
                    type_deps.push(data.get_u32_ordered(little_endian));
                }
            }
        };
        TypeInfo {
            class_id,
            is_stripped,
            script_type_index,
            script_id,
            old_type_hash,
            nodes,
            string_repr: repr,
            type_deps
        }
    }
}
