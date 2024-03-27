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
            lookup.insert(node.path.clone(), i);
        }

        StorageInfo {
            blocks,
            nodes,
            data_hash,
            node_lookup: lookup
        }
    }

    pub fn get_node_by_path(&self, path: &str) -> Option<&Node> {
        return if let Some(i) = self.node_lookup.get(path) {
            Some(self.nodes.get(*i).expect("node not in lookup"))
        } else {
            None
        }
    }

    pub fn get_blocks_for_node(&self, node: &Node) -> Vec<&BlockInfo> {
        let mut should_add = false;
        let mut blocks = Vec::new();
        let mut offset = 0;
        let mut i = 0;
        for block in &self.blocks {
            if offset >= node.offset {
                should_add = true;
            }
            if offset > node.offset + node.size {
                break;
            }

            if should_add {
                blocks.push(&self.blocks[i]);
            }

            offset += block.uncompressed_size;
            i += 1;
        }
        blocks
    }
}