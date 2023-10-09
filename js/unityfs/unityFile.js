import {BundleFile} from "./bundleFile";
import {BinaryReader} from "../binaryReader";
import {AssetFile} from "./assetFile";

export const FileType = {
  Assets: 0,
  Bundle: 1,
  Web: 2,
  Resource: 3,
  GZip: 4,
  Brotli: 5,
  Zip: 6
}

export class UnityFS {
  constructor(data) {
    this.reader = new BinaryReader(data);
  }

  parseHeader() {
    let magic = this.reader.readCString();
    this.reader.seek(0);
    switch (magic) {
      case 'UnityWeb':
      case 'UnityRaw':
      case 'UnityArchive':
      case 'UnityFS':
        this.fileType = FileType.Bundle;
        break;
      case 'UnityWebData1.0':
        this.fileType = FileType.Web;
        break;
      default:
        this.reader.seek(0);
        magic = this.reader.read(2);
        if (magic[0] === 0x1F && magic[1] === 0x8B) {
          this.fileType = FileType.GZip;
        } else if (magic[0] === 0x50 && magic[1] === 0x4B) {
          this.fileType = FileType.Zip;
        } else if (this.isAsset()) {
          this.fileType = FileType.Assets;
        } else {
          this.fileType = FileType.Resource;
        }
    }
  }

  isAsset() {
    this.reader.seek(0);
    if (this.reader.data.length < 20) {
      return false;
    }
    this.reader.readUInt32();
    let fileSize = BigInt(this.reader.readUInt32());
    const version = this.reader.readUInt32();
    let dataOffset = BigInt(this.reader.readUInt32());
    if (version >= 22) {
      if (this.reader.data.length < 48) {
        return false;
      }
      dataOffset = this.reader.readUInt64();
      fileSize = this.reader.readUInt64();
    }
    this.reader.seek(0);
    if (fileSize !== BigInt(this.reader.data.length)) {
      return false;
    }
    return dataOffset <= BigInt(this.reader.data.length);

  }

  parse() {
    this.parseHeader();

    switch (this.fileType) {
      case FileType.Bundle:
        this.parser = new BundleFile(this.reader);
        break;
      case FileType.Assets:
        this.parser = new AssetFile(this.reader);
        break;
      default:
        return;
    }
    this.parser.parse();
  }
}