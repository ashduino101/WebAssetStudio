use std::io::{Read, Write};
use lzma_rs::decompress::{Options, Stream};

pub struct BufferedLZMAReader<'a> {
    stream: Stream<Vec<u8>>,
    source: &'a[u8],
    offset: usize,
    block_size: usize
}

impl BufferedLZMAReader<'_> {
    pub fn from(src: &[u8]) -> BufferedLZMAReader<'_> {
        let dst = Vec::new();
        BufferedLZMAReader {
            stream: Stream::new_with_options(&Options {
                unpacked_size: Default::default(),
                memlimit: None,
                allow_incomplete: true
            }, dst),
            source: src,
            offset: 0,
            block_size: 1024
        }
    }
}

impl Read for BufferedLZMAReader<'_> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        self.stream.write(&self.source[0..self.block_size])
    }

    fn read_exact(&mut self, buf: &mut [u8]) -> std::io::Result<()> {
        todo!()
    }
}
