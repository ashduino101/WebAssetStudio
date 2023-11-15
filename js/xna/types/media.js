import {BaseType} from "./baseType";
import {XNBObject} from "./object";
import {BinaryWriter} from "../../binaryWriter";
import {AudioPreview} from "../../preview/audioPreview";

export class SoundEffect extends BaseType {
  exportExtension = '.wav';
  canExport = true;

  constructor(reader) {
    super(reader);
    this.format = reader.read(reader.readUInt32());  // WAV fmt chunk
    this.data = reader.read(reader.readUInt32());
    this.loopStart = reader.readInt32();
    this.loopLength = reader.readInt32();
    this.loopDuration = reader.readInt32();
  }

  getAudio() {
    let out = new BinaryWriter(this.format.length + this.data.length + 28);
    out.endian = 'little';
    out.writeChars('RIFF');
    out.writeUInt32(this.format.length + this.data.length + 24);
    out.writeChars('WAVE');
    out.writeChars('fmt ');
    out.writeUInt32(this.format.length);
    out.write(this.format);
    out.writeChars('data');
    out.writeUInt32(this.data.length);
    out.write(this.data);
    return out.getData();
  }

  async getExport() {
    return this.getAudio();
  }

  async createPreview() {
    return new AudioPreview().create(this.getAudio());
  }
}

export class Song extends BaseType {
  constructor(reader, typeReaders) {
    super(reader, typeReaders);
    this.streamingFilename = reader.readVarString();
    this.duration = new XNBObject(reader, typeReaders).value;
  }
}

export class Video extends BaseType {
  constructor(reader, typeReaders) {
    super(reader);
    this.streamingFilename = new XNBObject(reader, typeReaders).value;
    this.duration = new XNBObject(reader, typeReaders).value;
    this.width = new XNBObject(reader, typeReaders).value;
    this.height = new XNBObject(reader, typeReaders).value;
    this.framesPerSecond = new XNBObject(reader, typeReaders).value;
    this.soundTrackType = ['Music', 'Dialog', 'MusicAndDialog'][new XNBObject(reader, typeReaders).value];
  }
}
