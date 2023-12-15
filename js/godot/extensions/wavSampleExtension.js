import {AudioPreview} from "../../preview/audio";
import {BaseExtension} from "./baseExtension";
import {BinaryWriter} from "../../binaryWriter";

export class WavSampleExtension extends BaseExtension {
  static type = 'variant';
  static extension = '.wav';

  constructor() {
    super();
  }

  getWAV(resource) {
    // TODO check .sample
    const sampleRate = 44100;
    const numChannels = resource.resource.properties.stereo ? 2 : 1;
    const bitsPerSample = resource.resource.properties.format === 1 ? 16 : 32;
    let writer = new BinaryWriter(resource.resource.properties.data.length, 'little', 8192);
    writer.writeChars('RIFF');
    writer.writeUInt32(0);
    writer.writeChars('WAVE');
    writer.writeChars('fmt ');
    writer.writeUInt32(16);
    writer.writeUInt16(resource.resource.properties.format);
    writer.writeUInt16(numChannels);
    writer.writeUInt32(sampleRate);
    writer.writeUInt32(sampleRate * numChannels * bitsPerSample / 8);
    writer.writeUInt16(numChannels * bitsPerSample / 8);
    writer.writeUInt16(bitsPerSample);
    writer.writeChars('data');
    writer.writeUInt32(resource.resource.properties.data.length);
    writer.write(resource.resource.properties.data);
    writer.seek(4);
    writer.writeUInt32(writer.size);
    return writer.getData();
  }

  async createPreview(resource) {
    return new AudioPreview().create(this.getWAV(resource));
  }

  exportFile(res) {
    return this.getWAV(res);
  }
}