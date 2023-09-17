import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {requestExternalData} from "../utils";
import JSZip from "jszip";

export class StreamedResource {
  static exposedAttributes = [
    'source',
    'offset',
    'size'
  ];

  constructor(reader) {
    this.source = reader.readAlignedString();
    this.offset = Number(reader.readInt64());
    this.size = Number(reader.readInt64());
  }
}

export class VideoClip extends NamedObject {
  static exposedAttributes = [
    'originalPath',
    'proxyWidth',
    'proxyHeight',
    'width',
    'height',
    'frameRate',
    'frameCount',
    'format',
    'audioChannelCount',
    'audioSampleRate',
    'audioLanguage',
    'externalResources',
    'hasSplitAlpha'
  ];
  exportExtension = '.mp4';  // assumed

  constructor(reader) {
    super(reader);
    this.originalPath = reader.readAlignedString();
    this.proxyWidth = reader.readUInt32();
    this.proxyHeight = reader.readUInt32();
    this.width = reader.readUInt32();
    this.height = reader.readUInt32();
    if (reader.versionGTE(2017, 2)) {
      this.pixelAspectRationNum = reader.readUInt32();  // numerator
      this.pixelAspectRationDen = reader.readUInt32();  // denominator
    }
    this.frameRate = reader.readFloat64();
    this.frameCount = reader.readUInt64();
    this.format = reader.readInt32();
    this.audioChannelCount = reader.readArrayT(reader.readUInt16.bind(reader), reader.readUInt32());
    reader.align(4);
    this.audioSampleRate = reader.readArrayT(reader.readUInt32.bind(reader), reader.readUInt32());
    this.audioLanguage = reader.readArrayT(reader.readAlignedString.bind(reader), reader.readUInt32());
    if (reader.version[0] >= 2020) {
      let numVideoShaders = reader.readInt32();
      this.videoShaders = [];
      for (let i = 0; i < numVideoShaders; i++) {
        this.videoShaders.push(new PPtr(reader));
      }
    }
    this.externalResources = new StreamedResource(reader);
    this.hasSplitAlpha = reader.readBool();
    if (reader.version[0] >= 2020) {
      this.sRGB = reader.readBool();
    }
  }

  async loadData() {
    this.data = await requestExternalData({
      offset: this.externalResources.offset,
      size: this.externalResources.size,
      path: this.externalResources.source
    });
  }

  async createPreview() {
    await this.loadData();
    const video = document.createElement('video');
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.src = URL.createObjectURL(new Blob([this.data]));
    return video;
  }

  async getExport() {
    await this.loadData();
    return this.data;
  }
}