use std::collections::HashMap;
use std::fmt::Debug;
use bytes::{Buf, Bytes};
use wasm_bindgen_test::console_log;
use crate::base::asset::Void;
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

pub enum ValueType {
    Bool,
    Int8,
    UInt8,
    Int16,
    UInt16,
    Int32,
    UInt32,
    Float32,
    Int64,
    UInt64,
    Float64,
    String,
    Data,
    Object
}

pub trait TypeTreeReadable : Debug {
    // fn as_map<K, V>(&self) -> Option<&HashMap<K, V>> where K: Debug, V: Debug {
    //     None
    // }
}

impl<K, V> TypeTreeReadable for HashMap<K, V> where K: Debug, V: Debug {
    // fn as_map<L, W>(&self) -> Option<&HashMap<L, W>> where L: Debug, W: Debug {
    //     Some(self)
    // }
}

impl<T> TypeTreeReadable for Vec<T> where T: Debug {

}

impl TypeTreeReadable for Void {

}

impl TypeTreeReadable for bool {

}

impl TypeTreeReadable for i8 {

}

impl TypeTreeReadable for u8 {

}

impl TypeTreeReadable for i16 {

}

impl TypeTreeReadable for u16 {

}

impl TypeTreeReadable for i32 {

}

impl TypeTreeReadable for u32 {

}

impl TypeTreeReadable for f32 {

}

impl TypeTreeReadable for i64 {

}

impl TypeTreeReadable for u64 {

}

impl TypeTreeReadable for f64 {

}

impl TypeTreeReadable for String {

}

impl TypeTreeReadable for Bytes {

}

#[derive(Debug, Clone)]
pub struct TypeNode {
    pub version: u16,
    pub level: u8,
    pub type_flags: u8,
    pub type_name: String,
    pub name: String,
    pub size: i32,
    pub index: i32,
    pub meta_flags: u32,
    pub ref_hash: u64,
    pub little_endian: bool,
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
            ref_hash: if version >= 19 { data.get_u64_ordered(little_endian) } else { 0u64 },
            little_endian
        }
    }

    pub fn parse_value(&self, data: &mut Bytes) -> Box<dyn TypeTreeReadable> {
        let val: Box<dyn TypeTreeReadable> = match &*self.type_name {
            "bool" => Box::new(data.get_u8() != 0),

            "SInt8" => Box::new(data.get_i8()),
            "UInt8" | "char" => Box::new(data.get_u8()),

            "SInt16" | "short" => Box::new(data.get_i16_ordered(self.little_endian)),
            "UInt16" | "unsigned short" => Box::new(data.get_u16_ordered(self.little_endian)),

            "SInt32" | "int" => Box::new(data.get_i32_ordered(self.little_endian)),
            "UInt32" | "unsigned int" | "Type*" => Box::new(data.get_u32_ordered(self.little_endian)),

            "SInt64" | "long long" => Box::new(data.get_i64_ordered(self.little_endian)),
            "UInt64" | "unsigned long long" | "FileSize" => Box::new(data.get_i64_ordered(self.little_endian)),

            "float" => Box::new(data.get_f32_ordered(self.little_endian)),
            "double" => Box::new(data.get_f64_ordered(self.little_endian)),

            "string" => Box::new(data.get_string_ordered(self.little_endian)),

            "TypelessData" => {
                let len = data.get_u32_ordered(self.little_endian) as usize;
                let res = data.slice(0..len);
                data.advance(len);
                Box::new(res)
            }

            _ => Box::new(Void {})
        };
        val
    }
}

pub fn primitive_parsing_supported(typename: &str) -> bool {
    match typename {
        "bool" | "SInt8" | "UInt8" | "char" |
        "SInt16" | "short" | "UInt16" | "unsigned short" |
        "SInt32" | "int" | "UInt32" | "unsigned int" | "Type*" |
        "SInt64" | "long long" | "UInt64" | "unsigned long long" | "FileSize" |
        "float" | "double" |
        "string" | "TypelessData" => true,
        _ => false
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

#[derive(Debug)]
pub struct TypeParser {
    index: usize,
    nodes: Vec<TypeNode>
}

impl TypeParser {
    pub fn parse_node(&mut self, node: &TypeNode, data: &mut Bytes, orig_length: usize) -> Box<dyn TypeTreeReadable> {
        if primitive_parsing_supported(&node.type_name) {
            let val = node.parse_value(data);
            // console_log!("{} {} {:?}", node.type_name, node.name, val);
            if node.type_name == "string" {
                self.index += 3;  // this consumes 4 -- make sure to consume additional nodes
                data.align(orig_length, 4);  // strings are always aligned
            } else if node.type_name == "TypelessData" {  // consumes 3
                self.index += 2;
            }
            if node.meta_flags & 16384 != 0 {
                data.align(orig_length, 4);
            }
            return Box::from(val);
        } else if node.type_name == "Array" {
            let mut arr = HashMap::new();  // TODO: can't box vecs for some reason, also this creates "Array" on the object
            let length = data.get_u32_ordered(node.little_endian);  // TODO: this assumes arrays are always u32-prefixed
            self.index += 2;
            // console_log!("arr len {length} at {} (in {})", orig_length - data.len(), self.nodes[self.index - 3].name);
            let val_idx = self.index.clone();
            for i in 0..length {
                self.index = val_idx;
                let val_node = &self.nodes[self.index];
                arr.insert(i, self.parse_node(&val_node.clone(), data, orig_length));
            }
            if length == 0 {
                while (self.index < self.nodes.len() - 1) && (self.nodes[self.index + 1].level > node.level) {
                    self.index += 1;
                }
            }
            if node.meta_flags & 16384 != 0 {
                data.align(orig_length, 4);
            }
            return Box::from(arr);
        } else if self.nodes[self.index + 1].level > node.level {  // a "child" of this node
            let mut child = HashMap::new();
            while (self.index < self.nodes.len() - 1) && (self.nodes[self.index + 1].level > node.level) {
                self.index += 1;
                let n = &self.nodes[self.index];
                child.insert(n.name.clone(), self.parse_node(&n.clone(), data, orig_length));
            };
            if node.meta_flags & 16384 != 0 {
                data.align(orig_length, 4);
            }
            return Box::from(child);
        } else {
            return Box::from(Void {});
        }
    }

    pub fn parse_object_from_info(info: &TypeInfo, data: &mut Bytes) -> Box<dyn TypeTreeReadable> {
        TypeParser::new(info.nodes.clone()).parse_node(&info.nodes[0], data, data.len())
    }

    pub fn new(nodes: Vec<TypeNode>) -> TypeParser {
        TypeParser {
            index: 0,
            nodes
        }
    }
}
