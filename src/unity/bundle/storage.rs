use std::collections::HashMap;
use bytes::Bytes;
use crate::unity::bundle::block::BlockInfo;
use crate::unity::bundle::node::Node;

#[derive(Debug)]
pub struct StorageInfo {
    pub blocks: Vec<BlockInfo>,
    pub nodes: Vec<Node>,
    pub data_hash: Bytes,
    node_lookup: HashMap<String, usize>
}

impl StorageInfo {
    pub fn new(blocks: Vec<BlockInfo>, nodes: Vec<Node>, data_hash: Bytes) -> StorageInfo {
        // Create a hashmap for lookups
        let mut lookup = HashMap::<String, usize>::new();
        for (i, node) in nodes.iter().enumerate() {
            lookup.insert((*node.path).to_string(), i);
        }

        StorageInfo {
            blocks,
            nodes,
            data_hash,
            node_lookup: lookup
        }
    }
}
