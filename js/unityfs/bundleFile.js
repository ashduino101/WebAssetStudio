import {BinaryReader} from "../binaryReader";
import {lzmaDecompress} from "./utils";
import {FileType, UnityFS} from "./unityFile";
import {BinaryWriter} from "../binaryWriter";
import {lz4_decompress} from "../encoders";
import {decompressBlock} from "lz4js";

export class BundleFlags {
  static exposedAttributes = [
    'compressionType',
    'hasDirInfo',
    'blockInfoAtEnd',
    'oldWebPluginCompat',
    'blockInfoHasPadding'
  ]

  constructor(value) {
    this.compressionType = value & 0x3F;
    this.hasDirInfo = (value & 0x40) === 0x40;
    this.blockInfoAtEnd = (value & 0x80) === 0x80;
    this.oldWebPluginCompat = (value & 0x100) === 0x100;
    this.blockInfoHasPadding = (value & 0x200) === 0x200;
  }

  encode() {
    let value = this.compressionType & 0x03;
    if (this.hasDirInfo) value |= 0x40;
    if (this.blockInfoAtEnd) value |= 0x80;
    if (this.oldWebPluginCompat) value |= 0x100;
    if (this.blockInfoHasPadding) value |= 0x200;
    return value
  }
}

export class BlockFlags {
  static exposedAttributes = [
    'compressionType',
    'isStreamed'
  ];

  constructor(value) {
    this.compressionType = value & 0x3F;
    this.isStreamed = (value & 0x40) === 0x40;
  }

  encode() {
    let value = this.compressionType & 0x03;
    if (this.isStreamed) value |= 0x40;
    return value;
  }
}

export class StorageBlock {
  static exposedAttributes = [
    'compressedSize',
    'uncompressedSize',
    'flags'
  ];

  constructor(uncompressedSize, compressedSize, flags) {
    this.uncompressedSize = uncompressedSize;
    this.compressedSize = compressedSize;
    this.flags = new BlockFlags(flags);
  }
}

export class Node {
  static exposedAttributes = [
    'offset',
    'size',
    'flags',
    'path'
  ];

  constructor(offset, size, flags, path) {
    this.offset = offset;
    this.size = size;
    this.flags = flags;
    this.path = path;
  }
}

export class NodeFile {  // special support
  constructor(node, data) {
    this.node = node;
    this.data = data;
  }
}

export const CompressionType = {
  None: 0,
  LZMA: 1,
  LZ4: 2,
  LZ4HC: 3,
  LZHAM: 4
}

export class BundleFile {
  static exposedAttributes = [
    'magic',
    'version',
    'unityVersion',
    'unityRevision',
    // These *should* be present once web/raw support is introduced
    'size',
    'compressedBlockInfoSize',
    'uncompressedBlockInfoSize',
    'flags',
    'blockInfo',
    'nodes',
    'files'
  ]

  constructor(reader) {
    this.reader = reader;
  }

  parse() {
    this.magic = this.reader.readCString();
    this.version = this.reader.readUInt32();
    this.unityVersion = this.reader.readCString();
    this.unityRevision = this.reader.readCString();

    switch (this.magic) {
      case 'UnityFS':
        this.parseUnityFS();
    }
  }

  serialize() {
    if (typeof this.size == 'undefined') {
      console.error('Size required to serialize bundle');
    }
    let writer = new BinaryWriter(Number(this.size));
    writer.writeCString(this.magic);
    writer.writeUInt32(this.version);
    writer.writeCString(this.unityVersion);
    writer.writeCString(this.unityRevision);

    switch (this.magic) {
      case 'UnityFS':
        writer.write(this.serializeUnityFS());
    }

    return writer.getData();
  }

  parseUnityFS() {
    this.size = this.reader.readUInt64();
    this.compressedBlockInfoSize = this.reader.readUInt32();
    this.uncompressedBlockInfoSize = this.reader.readUInt32();
    this.flags = new BundleFlags(this.reader.readUInt32());
    if (this.magic !== 'UnityFS') {
      this.reader.read(1);  // extra byte in raw/web 6+
    }

    if (this.version >= 7) {
      this.reader.align(16);
    }
    let blockInfoData;
    if (this.flags.blockInfoAtEnd) {
      const origPos = this.reader.tell();
      this.reader.seek(this.reader.data.length - this.compressedBlockInfoSize);
      blockInfoData = this.reader.read(this.compressedBlockInfoSize);
      this.reader.seek(origPos);
    } else {
      blockInfoData = this.reader.read(this.compressedBlockInfoSize);
    }

    const onDecompress = data => {
      let reader = new BinaryReader(data);
      let dataHash = reader.read(16);
      let blockInfoCount = reader.readUInt32();
      this.blockInfo = [];
      for (let i = 0; i < blockInfoCount; i++) {
        this.blockInfo.push(new StorageBlock(
          reader.readUInt32(),
          reader.readUInt32(),
          reader.readUInt16()
        ));
      }
      this.nodes = [];
      let nodeCount = reader.readUInt32();
      for (let i = 0; i < nodeCount; i++) {
        this.nodes.push(new Node(
          reader.readUInt64(),
          reader.readUInt64(),
          reader.readUInt32(),
          reader.readCString()
        ));
      }

      let totalSize = 0;
      let uncompressedBlocks = [];
      for (let block of this.blockInfo) {
        const blockData = this.reader.read(block.compressedSize);
        let decompressedBlock = null;

        switch (block.flags.compressionType) {
          case CompressionType.None:
            decompressedBlock = blockData;
            break;
          case CompressionType.LZMA:
            decompressedBlock = lzmaDecompress(blockData, block.uncompressedSize);
            break;
          case CompressionType.LZ4:
          case CompressionType.LZ4HC:
            try {
              decompressedBlock = lz4_decompress(blockData, block.uncompressedSize);
            } catch (e) {
              console.error('error in Wasm LZ4 decompress:');
              console.error(e);
              console.error('Falling back to slower pure-JS decompressor');

              const dst = new Uint8Array(block.uncompressedSize);
              decompressBlock(blockData, dst, 0, blockData.length, 0);
              decompressedBlock = dst;
            }
            break;
          default:
            throw new Error('Unsupported compression type');
        }

        uncompressedBlocks.push(decompressedBlock);
        totalSize += block.uncompressedSize;
      }

      this.blockData = new Uint8Array(totalSize);
      let offset = 0;
      for (let block of uncompressedBlocks) {
        this.blockData.set(block, offset);
        offset += block.length;
      }
      // Extract files from blocks
      this.files = [];
      for (let node of this.nodes) {
        this.files.push(new NodeFile(
          node,
          this.blockData.slice(Number(node.offset), Number(node.offset + node.size))
        ));
      }
      this.blockData = null;

      for (let file of this.files) {
        let reader = new UnityFS(file.data);
        reader.parseHeader();
        file.type = reader.fileType;
      }
    };

    switch (this.flags.compressionType) {
      case CompressionType.None:
        onDecompress(blockInfoData);
        break;
      case CompressionType.LZMA:
        onDecompress(lzmaDecompress(blockInfoData, this.uncompressedBlockInfoSize));
        break;
      case CompressionType.LZ4:
      case CompressionType.LZ4HC:
        onDecompress(lz4_decompress(blockInfoData, this.uncompressedBlockInfoSize));
        break;
      default:
        throw new Error('Unsupported compression type');
    }

    // console.log(this.serialize());
  }

  serializeUnityFS() {
    // TODO: finish this
    // bundles shall not exceed 9 petabytes (but, knowing game developers, will)
    const writer = new BinaryWriter(Number(this.size));
    writer.writeUInt64(this.size);
    writer.writeUInt32(this.compressedBlockInfoSize);
    writer.writeUInt32(this.uncompressedBlockInfoSize);
    let copyFlags = new BundleFlags(this.flags.encode());
    copyFlags.compressionType = CompressionType.None;  // TODO: implement other compression types
    writer.writeUInt32(copyFlags.encode());

    if (this.version >= 7) {
      writer.align(16);
    }

    // Serialize files
    const newNodes = [];
    const blockData = new BinaryWriter(0);
    for (let file of this.files) {
      let data = new Uint8Array(0);
      switch (file.type) {
        case FileType.Resource:
          data = file.data;
          break;
        case FileType.Bundle:
          data = new BundleFile(new BinaryReader(file)).serialize();
          break;
        case FileType.Assets:
          data = file.serialize();
          break;
      }
      newNodes.push({
        offset: blockData.offset,
        size: data.length,
        flags: file.node.flags,
        path: file.node.path
      });
      blockData.write(data);
    }

    // Compress blocks
    // compressBlock()

    if (!this.flags.blockInfoAtEnd) {
      // Hash - 16 bytes, isn't checked so we don't bother regenerating it (instead, we just zero it)
      writer.writeUInt64(BigInt(0));
      writer.writeUInt64(BigInt(0));



      writer.writeUInt32(this.blockInfo.length);
      for (let info of this.blockInfo) {
        writer.writeUInt32(info.uncompressedSize);
        writer.writeUInt32(info.compressedSize);
        let copyBlkFlags = new BundleFlags(this.flags.encode());
        copyBlkFlags.compressionType = CompressionType.LZ4;  // TODO: ^^
        writer.writeUInt16(copyBlkFlags.encode());
      }

      writer.writeUInt32(this.nodes.length);
      for (let node of this.nodes) {
        writer.writeUInt64(node.offset);
        writer.writeUInt64(node.size);
        writer.writeUInt32(node.flags);
        writer.writeCString(node.path);
      }
    }

    return writer.getData();
  }

  parseUnityWeb() {
    if (this.version >= 6) {
      this.parseUnityFS();
      return;
    }
  }
}