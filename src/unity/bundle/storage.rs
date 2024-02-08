use bytes::Bytes;
use crate::unity::bundle::block::BlockInfo;
use crate::unity::bundle::node::Node;

#[derive(Debug)]
pub struct StorageInfo {
    pub blocks: Vec<BlockInfo>,
    pub nodes: Vec<Node>,
    pub data_hash: Bytes,
}
