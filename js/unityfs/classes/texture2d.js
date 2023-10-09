import {Texture} from "./texture";
import {
  decodeASTC,
  decodeATCRGB4,
  decodeATCRGBA8,
  decodeBC4,
  decodeBC5,
  decodeBC6,
  decodeBC7,
  decodeDXT1,
  decodeDXT5,
  decodeEACR,
  decodeEACRG,
  decodeEACRGSigned,
  decodeEACRSigned,
  decodeETC1,
  decodeETC2,
  decodeETC2A1,
  decodeETC2A8,
  decodePVRTC,
  unpackCrunch,
  unpackUnityCrunch
} from "../texture2d";
import {BinaryReader} from "../../binaryReader";
import * as CRC32 from 'crc-32';
import pako from 'pako'
import {requestExternalData} from "../utils";
import JSZip from "jszip";

export class StreamingInfo {
  static exposedAttributes = [
    'offset',
    'size',
    'path'
  ];

  constructor(reader) {
    if (reader.version[0] >= 2020) {
      this.offset = Number(reader.readInt64());
    } else {
      this.offset = reader.readUInt32();
    }
    this.size = reader.readUInt32();
    this.path = reader.readAlignedString();
  }
}

export class GLTextureSettings {
  static exposedAttributes = [
    'filterMode',
    'anisotropicFiltering',
    'mipBias',
    'wrapMode'
  ];

  constructor(reader) {
    this.filterMode = reader.readInt32();
    this.anisotropicFiltering = reader.readInt32();
    this.mipBias = reader.readInt32();
    this.wrapMode = reader.readInt32();
    if (reader.version[0] >= 2017) {
      this.wrapV = reader.readInt32();
      this.wrapW = reader.readInt32();
    }
  }
}

export const TextureFormat = {
  1: 'Alpha8',
  2: 'ARGB4444',
  3: 'RGB24',
  4: 'RGBA32',
  5: 'ARGB32',
  6: 'ARGBFloat',
  7: 'RGB565',
  8: 'BGR24',
  9: 'R16',
  10: 'DXT1',
  11: 'DXT3',
  12: 'DXT5',
  13: 'RGBA4444',
  14: 'BGRA32',
  15: 'RHalf',
  16: 'RGHalf',
  17: 'RGBAHalf',
  18: 'RFloat',
  19: 'RGFloat',
  20: 'RGBAFloat',
  21: 'YUY2',
  22: 'RGB9e5Float',
  23: 'RGBFloat',
  24: 'BC6H',
  25: 'BC7',
  26: 'BC4',
  27: 'BC5',
  28: 'DXT1Crunched',
  29: 'DXT5Crunched',
  30: 'PVRTC_RGB2',
  31: 'PVRTC_RGBA2',
  32: 'PVRTC_RGB4',
  33: 'PVRTC_RGBA4',
  34: 'ETC_RGB4',
  35: 'ATC_RGB4',
  36: 'ATC_RGBA8',
  41: 'EAC_R',
  42: 'EAC_R_SIGNED',
  43: 'EAC_RG',
  44: 'EAC_RG_SIGNED',
  45: 'ETC2_RGB',
  46: 'ETC2_RGBA1',
  47: 'ETC2_RGBA8',
  48: 'ASTC_RGB_4x4',
  49: 'ASTC_RGB_5x5',
  50: 'ASTC_RGB_6x6',
  51: 'ASTC_RGB_8x8',
  52: 'ASTC_RGB_10x10',
  53: 'ASTC_RGB_12x12',
  54: 'ASTC_RGBA_4x4',
  55: 'ASTC_RGBA_5x5',
  56: 'ASTC_RGBA_6x6',
  57: 'ASTC_RGBA_8x8',
  58: 'ASTC_RGBA_10x10',
  59: 'ASTC_RGBA_12x12',
  60: 'ETC_RGB4_3DS',
  61: 'ETC_RGBA8_3DS',
  62: 'RG16',
  63: 'R8',
  64: 'ETC_RGB4Crunched',
  65: 'ETC2_RGBA8Crunched',
  66: 'ASTC_HDR_4x4',
  67: 'ASTC_HDR_5x5',
  68: 'ASTC_HDR_6x6',
  69: 'ASTC_HDR_8x8',
  70: 'ASTC_HDR_10x10',
  71: 'ASTC_HDR_12x12',
  72: 'RG32',
  73: 'RGB48',
  74: 'RGBA64'
}

export class Texture2D extends Texture {
  static exposedAttributes = [
    'name',
    'width',
    'height',
    'completeSize',
    'textureFormat',
    'mipCount',
    'isReadable',
    'imageCount',
    'textureDimension',
    'textureSettings',
    'lightmapFormat',
    'colorSpace',
    'streamData'
  ];
  constructor(reader) {
    super(reader);

    this._version = reader.version;
    this._platform = reader.platform;

    this.cachedRaw = null;

    this.width = reader.readInt32();
    this.height = reader.readInt32();
    this.completeSize = reader.readInt32();
    if (reader.version[0] >= 2020) {
      this.mipsStripped = reader.readInt32();
    }
    this.textureFormat = TextureFormat[reader.readInt32()];
    if (reader.versionLT(5, 2)) {
      this.mipMap = reader.readBool();
    } else {
      this.mipCount = reader.readInt32();
    }
    if (reader.versionGTE(2, 6)) {
      this.isReadable = reader.readBool();
    }
    if (reader.version[0] >= 2020) {
      this.isPreProcessed = reader.readBool();
    }
    if (reader.versionGTE(2019, 3)) {
      this.ignoreMasterTextureLimit = reader.readBool();
    }
    if (reader.version[0] >= 3) {
      if (reader.versionLT(5, 5)) {
        this.readAllowed = reader.readBool();
      }
    }
    if (reader.versionGTE(2018, 2)) {
      this.streamingMipmaps = reader.readBool();
    }
    reader.align(4);
    if (reader.versionGTE(2018, 2)) {
      this.streamingMipmapsPriority = reader.readInt32();
    }
    this.imageCount = reader.readInt32();
    this.textureDimension = reader.readInt32();
    this.textureSettings = new GLTextureSettings(reader);
    if (reader.version[0] >= 3) {
      this.lightmapFormat = reader.readInt32();
    }
    if (reader.versionGTE(3, 5)) {
      this.colorSpace = reader.readInt32();
    }
    if (reader.versionGTE(2020, 2)) {
      this.platformBlob = reader.read(reader.readInt32());
      reader.align(4);
    }
    let imageDataSize = reader.readInt32();
    this.streamData = null;
    if (imageDataSize === 0 && reader.versionGTE(5, 3)) {
      this.streamData = new StreamingInfo(reader);
      this.data = new Uint8Array(0);
    } else {
      this.streamData = null;
      this.data = reader.read(imageDataSize);
    }

    this.exportExtension = (this.imageCount === 1) ? '.png' : '.zip';
  }

  async loadData() {
    if (this.streamData != null) {
      try {
        this.data = await requestExternalData(this.streamData);
      } catch {
        console.error('Failed to load image data, creating empty image');
        this.data = new Uint8Array(this.streamData.size).fill(0);
      }
    }
  }

  swapBytesForXbox(data) {
    if (this._platform === 'XBox 360') {
      for (let i = 0; i < data.length / 2; i++) {
        let b = data[i * 2];
        data[i * 2] = data[i * 2 + 1];
        data[i * 2 + 1] = b;
      }
    }
  }

  u8ToU16(b1, b2) {
    return new DataView(
      new Uint8Array(
        [b1, b2]
      ).buffer
    ).getUint16(0, true);
  }

  decodeAlpha8() {
    let out = new Uint8Array(this.width * this.height * 4);
    out.fill(0xFF);
    for (let i = 0; i < this.data.size; i++) {
      out[i * 4 + 3] = this.data[i];
    }
    return out;
  }

  decodeARGB4444() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (this.data[i * 2] & 0xf0) >> 4;
      out[i * 4 + 1] = this.data[i * 2 + 1] & 0x0f;
      out[i * 4 + 2] = (this.data[i * 2 + 1] & 0xf0) >> 4;
      out[i * 4 + 3] = this.data[i * 2] & 0x0f;
    }
    return out;
  }

  decodeRGB24() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i * 3];
      out[i * 4 + 1] = this.data[i * 3 + 1];
      out[i * 4 + 2] = this.data[i * 3 + 2];
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  decodeRGBA32() {
    return this.data;
  }

  decodeARGB32() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i * 3 + 3];
      out[i * 4 + 1] = this.data[i * 3];
      out[i * 4 + 2] = this.data[i * 3 + 1];
      out[i * 4 + 3] = this.data[i * 3 + 2];
    }
    return out;
  }

  decodeRGB565() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      let d = this.u8ToU16(this.data[i * 2], this.data[i * 2 + 1]);
      out[i * 4] = (d >> 8 & 0xf8) | (d >> 13);
      out[i * 4 + 1] = (d >> 3 & 0xfc) | (d >> 9 & 3);
      out[i * 4 + 2] = (d << 3) | (d >> 2 & 7);
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  decodeR16() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (((this.u8ToU16(this.data[i * 2], this.data[i * 2 + 1]) * 255) + 32895) >> 16);
      out[i * 4 + 1] = 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  async decodeDXT1() {
    return await decodeDXT1(this.data, this.width, this.height);
  }

  async decodeDXT5() {
    return await decodeDXT5(this.data, this.width, this.height);
  }

  decodeRGBA4444() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i * 2] & 0x0f;
      out[i * 4 + 1] = (this.data[i * 2] & 0xf0) >> 4;
      out[i * 4 + 2] = this.data[i * 2 + 1] & 0x0f;
      out[i * 4 + 3] = (this.data[i * 2 + 1] & 0xf0) >> 4;
    }
    return out;
  }

  decodeBGRA32() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i * 3 + 2];
      out[i * 4 + 1] = this.data[i * 3 + 1];
      out[i * 4 + 2] = this.data[i * 3];
      out[i * 4 + 3] = this.data[i * 3 + 3];
    }
    return out;
  }

  decodeRHalf() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 1] = 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  decodeRGHalf() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 1] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  decodeRGBAHalf() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 1] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 2] = (reader.readFloat16() * 255) | 0;
      out[i * 4 + 3] = (reader.readFloat16() * 255) | 0;
    }
    return out;
  }

  decodeRFloat() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 1] = 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0;
    }
  }

  decodeRGFloat() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 1] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0;
    }
  }

  decodeRGBAFloat() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 1] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 2] = (reader.readFloat32() * 255) | 0;
      out[i * 4 + 3] = (reader.readFloat32() * 255) | 0;
    }
  }

  clamp255(x) {
    return Math.min(Math.max(x, 0), 255);
  }

  decodeYUY2() {
    let out = new Uint8Array(this.width * this.height * 4);
    let p = 0;
    let o = 0;
    for (let j = 0; j < this.height; j++) {
      for (let i = 0; i < this.width / 2; i++) {
        let y0 = this.data[p++];
        let u0 = this.data[p++];
        let y1 = this.data[p++];
        let v0 = this.data[p++];
        let c = y0 - 16;
        let d = u0 - 128;
        let e = v0 - 128;
        let b0 = this.clamp255((298 * c + 516 * d + 128) >> 8);
        let g0 = this.clamp255((298 * c - 100 * d - 208 * e + 128) >> 8);
        let r0 = this.clamp255((298 * c + 409 * e + 128) >> 8);
        c = y1 - 16;
        let b1 = this.clamp255((298 * c + 516 * d + 128) >> 8);
        let g1 = this.clamp255((298 * c - 100 * d - 208 * e + 128) >> 8);
        let r1 = this.clamp255((298 * c + 409 * e + 128) >> 8);
        out[o++] = r0;
        out[o++] = g0;
        out[o++] = b0;
        out[o++] = 0xFF;
        out[o++] = r1;
        out[o++] = g1;
        out[o++] = b1;
        out[o++] = 0xFF;
      }
    }
    return out;
  }

  decodeRGB9e5Float() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      let n = reader.readInt32();
      let scale = n >> 27 & 0x1f;
      let scalef = 2 ** (scale - 24);
      let b = n >> 18 & 0x1ff;
      let g = n >> 9 & 0x1ff;
      let r = n & 0x1ff;
      out[i * 4] = Math.round(r * scalef * 0xFF);
      out[i * 4 + 1] = Math.round(g * scalef * 0xFF);
      out[i * 4 + 2] = Math.round(b * scalef * 0xFF);
      out[i * 4 + 3] = 0xFF;
    }
    return out;
  }

  async decodeBC4() {
    return await decodeBC4(this.data, this.width, this.height);
  }

  async decodeBC5() {
    return await decodeBC5(this.data, this.width, this.height);
  }

  async decodeBC6H() {
    return await decodeBC6(this.data, this.width, this.height);
  }

  async decodeBC7() {
    return await decodeBC7(this.data, this.width, this.height);
  }

  async decodeDXT1Crunched() {
    let decomp = await this.unpackCrunch(this.data, this.width * this.height * 4);
    return await decodeDXT1(decomp, this.width, this.height);
  }

  async decodeDXT5Crunched() {
    let decomp = await this.unpackCrunch(this.data, this.width * this.height * 4);
    return await decodeDXT5(decomp, this.width, this.height);
  }

  async decodePVRTC(is2bpp) {
    return await decodePVRTC(this.data, this.width, this.height, is2bpp);
  }

  async decodeETC1() {
    return await decodeETC1(this.data, this.width, this.height);
  }

  async decodeATCRGB4() {
    return await decodeATCRGB4(this.data, this.width, this.height);
  }

  async decodeATCRGBA8() {
    return await decodeATCRGBA8(this.data, this.width, this.height);
  }

  async decodeEACR() {
    return await decodeEACR(this.data, this.width, this.height);
  }

  async decodeEACRSigned() {
    return await decodeEACRSigned(this.data, this.width, this.height);
  }

  async decodeEACRG() {
    return await decodeEACRG(this.data, this.width, this.height);
  }

  async decodeEACRGSigned() {
    return await decodeEACRGSigned(this.data, this.width, this.height);
  }

  async decodeETC2() {
    return await decodeETC2(this.data, this.width, this.height);
  }

  async decodeETC2A1() {
    return await decodeETC2A1(this.data, this.width, this.height);
  }

  async decodeETC2A8() {
    return await decodeETC2A8(this.data, this.width, this.height);
  }

  async decodeASTC(bw, bh) {
    return await decodeASTC(this.data, this.width, this.height, bw, bh);
  }

  decodeRG16() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i * 2];
      out[i * 4 + 1] = this.data[i * 2 + 1];
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
  }

  decodeR8() {
    let out = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = this.data[i];
      out[i * 4 + 1] = 0;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
  }

  async decodeETC1Crunched() {
    let decomp = await this.unpackCrunch(this.data, this.width * this.height * 4);
    return await decodeETC1(decomp, this.width, this.height);
  }

  async decodeETC2A8Crunched() {
    let decomp = await this.unpackCrunch(this.data, this.width * this.height * 4);
    return await decodeETC2A8(decomp, this.width, this.height);
  }

  decodeRG32() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 1] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 2] = 0;
      out[i * 4 + 3] = 0xFF;
    }
  }

  decodeRGB48() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 1] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 2] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 3] = 0xFF;
    }
  }

  decodeRGBA64() {
    let out = new Uint8Array(this.width * this.height * 4);
    let reader = new BinaryReader(this.data, 'little');
    for (let i = 0; i < this.width * this.height; i++) {
      out[i * 4] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 1] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 2] = ((reader.readUInt16() * 255) + 32895) >> 16;
      out[i * 4 + 3] = ((reader.readUInt16() * 255) + 32895) >> 16;
    }
  }

  async unpackCrunch(data, outSize) {
    if (
      this._version[0] > 2017 || (this._version[0] === 2017 && this._version[1] >= 3)
      || this.textureFormat === 'ETC2_RGB4Crunched'
      || this.textureFormat === 'ETC2_RGBA8Crunched'
    ) {
      return await unpackUnityCrunch(data, outSize);
    } else {
      return await unpackCrunch(data, outSize);
    }
  }

  async decodeRaw(imageNum) {
    if (this.cachedRaw == null) {
      await this.loadData();
      let data = this.data.slice(this.completeSize * imageNum, this.completeSize * (imageNum + 1));
      switch (this.textureFormat) {
        case 'Alpha8':
          return this.decodeAlpha8();
        case 'ARGB4444':
          this.swapBytesForXbox(data);
          return this.decodeARGB4444();
        case 'RGB24':
          return this.decodeRGB24();
        case 'RGBA32':
          return this.decodeRGBA32();
        case 'ARGB32':
          return this.decodeARGB32();
        case 'RGB565':
          this.swapBytesForXbox(data);
          return this.decodeRGB565();
        case 'R16':
          return this.decodeR16();
        case 'DXT1':
          this.swapBytesForXbox(data);
          return await this.decodeDXT1();
        case 'DXT3':
          console.warn('DXT3 is known, but unsupported.');
          return;
        case 'DXT5':
          this.swapBytesForXbox(data);
          return await this.decodeDXT5();
        case 'RGBA4444':
          return this.decodeRGBA4444();
        case 'BGRA32':
          return this.decodeBGRA32();
        case 'RHalf':
          return this.decodeRHalf();
        case 'RGHalf':
          return this.decodeRGHalf();
        case 'RGBAHalf':
          return this.decodeRGBAHalf();
        case 'RFloat':
          return this.decodeRFloat();
        case 'RGFloat':
          return this.decodeRGFloat();
        case 'RGBAFloat':
          return this.decodeRGBAFloat();
        case 'YUY2':
          return this.decodeYUY2();
        case 'RGB9e5Float':
          return this.decodeRGB9e5Float();
        case 'BC6H':
          return await this.decodeBC6H();
        case 'BC7':
          return await this.decodeBC7();
        case 'BC4':
          return await this.decodeBC4();
        case 'BC5':
          return await this.decodeBC5();
        case 'DXT1Crunched':
          return await this.decodeDXT1Crunched();
        case 'DXT5Crunched':
          return await this.decodeDXT5Crunched();
        case 'PVRTC_RGB2':
        case 'PVRTC_RGBA2':
          return await this.decodePVRTC(true);
        case 'PVRTC_RGB4':
        case 'PVRTC_RGBA4':
          return await this.decodePVRTC(false);
        case 'ETC_RGB4':
        case 'ETC_RGB4_3DS':
          return await this.decodeETC1();
        case 'ATC_RGB4':
          return await this.decodeATCRGB4();
        case 'ATC_RGBA8':
          return await this.decodeATCRGBA8();
        case 'EAC_R':
          return await this.decodeEACR();
        case 'EAC_R_SIGNED':
          return await this.decodeEACRSigned();
        case 'EAC_RG':
          return await this.decodeEACRG();
        case 'EAC_RG_SIGNED':
          return await this.decodeEACRGSigned();
        case 'ETC2_RGB':
          return await this.decodeETC2();
        case 'ETC2_RGBA1':
          return await this.decodeETC2A1();
        case 'ETC2_RGBA8':
        case 'ETC2_RGBA8_3DS':
          return await this.decodeETC2A8();
        case 'ASTC_RGB_4x4':
        case 'ASTC_RGBA_4x4':
        case 'ASTC_HDR_4x4':
          return await this.decodeASTC(4, 4);
        case 'ASTC_RGB_5x5':
        case 'ASTC_RGBA_5x5':
        case 'ASTC_HDR_5x5':
          return await this.decodeASTC(5, 5);
        case 'ASTC_RGB_6x6':
        case 'ASTC_RGBA_6x6':
        case 'ASTC_HDR_6x6':
          return await this.decodeASTC(6, 6);
        case 'ASTC_RGB_8x8':
        case 'ASTC_RGBA_8x8':
        case 'ASTC_HDR_8x8':
          return await this.decodeASTC(8, 8);
        case 'ASTC_RGB_10x10':
        case 'ASTC_RGBA_10x10':
        case 'ASTC_HDR_10x10':
          return await this.decodeASTC(10, 10);
        case 'ASTC_RGB_12x12':
        case 'ASTC_RGBA_12x12':
        case 'ASTC_HDR_12x12':
          return await this.decodeASTC(12, 12);
        case 'RG16':
          return this.decodeRG16();
        case 'R8':
          return this.decodeR8();
        case 'ETC_RGB4Crunched':
          return await this.decodeETC1Crunched();
        case 'ETC2_RGBA8Crunched':
          return await this.decodeETC2A8Crunched();
        case 'RG32':
          return this.decodeRG32();
        case 'RGB48':
          return this.decodeRGB48();
        case 'RGBA64':
          return this.decodeRGBA64();
      }
    } else {
      return this.cachedRaw;
    }
  }

  async createPNG(imageNum) {
    let data = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    function writeI32(v, a) {
      let d = new DataView(new ArrayBuffer(4));
      d.setUint32(0, v, false);
      a.push(...new Uint8Array(d.buffer));
    }

    function encodeChunk(fourcc, chunk) {
      writeI32(chunk.length, data);
      let encCC = new TextEncoder().encode(fourcc);
      data.push(...encCC);
      for (let v of chunk) data.push(v);
      writeI32(CRC32.buf([...encCC, ...chunk]), data);
    }

    let ihdr = [];
    writeI32(this.width, ihdr);
    writeI32(this.height, ihdr);
    ihdr.push(8, 6, 0, 0, 0);
    encodeChunk('IHDR', ihdr);
    let raw = await this.decodeRaw(imageNum);
    let dat = [];
    for (let y = this.height - 1; y >= 0; y--) {
      dat.push(0x00);
      for (let x = 0; x < this.width; x++) {
        let b = (y * this.width + x) * 4;
        dat.push(raw[b], raw[b + 1], raw[b + 2], raw[b + 3]);
      }
    }
    let compressedData = pako.deflate(new Uint8Array(dat));
    const chunkSize = 16384;
    for (let i = 0; i < Math.ceil(compressedData.length / chunkSize); i++) {
      encodeChunk('IDAT', compressedData.slice(i * chunkSize, (i + 1) * chunkSize));
    }
    encodeChunk('IEND', []);
    return new Uint8Array(data);
  }

  async createDataUrl(imageNum) {
    let pngData = await this.createPNG(imageNum);
    return URL.createObjectURL(new Blob([pngData], {type: 'image/png'}));
  }

  async createPreview() {
    const container = document.createElement('div');
    container.style.display = 'block';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';

    const btns = document.createElement('t2d-btns');
    btns.style.zIndex = '10';
    btns.style.position = 'absolute';
    const btnPrev = document.createElement('t2d-tabulate');
    const btnNext = document.createElement('t2d-tabulate');

    btnPrev.style.color = '#fff';
    btnPrev.style.display = 'inline-block';
    btnPrev.style.backgroundColor = '#34f';
    btnPrev.style.borderRadius = '4px';
    btnPrev.style.width = '32px';
    btnPrev.style.height = '32px';
    btnPrev.style.fontSize = '24px';
    btnPrev.style.margin = '2px';
    btnPrev.style.textAlign = 'center';
    btnPrev.style.userSelect = 'none';
    btnPrev.style.cursor = 'pointer';
    btnPrev.textContent = '<';

    btnNext.style.color = '#fff';
    btnNext.style.display = 'inline-block';
    btnNext.style.backgroundColor = '#34f';
    btnNext.style.borderRadius = '4px';
    btnNext.style.width = '32px';
    btnNext.style.height = '32px';
    btnNext.style.fontSize = '24px';
    btnNext.style.margin = '2px';
    btnNext.style.textAlign = 'center';
    btnNext.style.userSelect = 'none';
    btnNext.style.cursor = 'pointer';
    btnNext.textContent = '>';

    btns.appendChild(btnPrev);
    btns.appendChild(btnNext);

    container.appendChild(btns);

    let imageNum = 0;
    let img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.display = 'block';
    img.style.background = 'repeating-conic-gradient(#ddd 0% 25%, #0000004d 0% 50%) 50% / 20px 20px';
    img.style.position = 'relative';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    container.appendChild(img);

    const setDisabled = elem => {
      elem.style.backgroundColor = '#777';
      elem.style.color = '#aaa';
      elem.style.cursor = 'not-allowed';
    }
    const setEnabled = elem => {
      elem.style.backgroundColor = '#34d';
      elem.style.color = '#fff';
      elem.style.cursor = 'pointer';
    }

    const validate = () => {
      if (imageNum <= 0) {
        setDisabled(btnPrev);
      } else {
        setEnabled(btnPrev);
      }
      if ((imageNum + 1) >= this.imageCount) {
        setDisabled(btnNext);
      } else {
        setEnabled(btnNext);
      }
    }

    validate();

    btnPrev.addEventListener('click', async () => {
      if (imageNum > 0) {
        imageNum--;
      }
      validate();
      console.log(imageNum);
      await preview();
    });

    btnNext.addEventListener('click', async () => {
      if ((imageNum + 1) < this.imageCount) {
        imageNum++;
      }
      validate();
      console.log(imageNum);
      await preview();
    });

    const preview = async () => {
      img.src = await this.createDataUrl(imageNum);
    }

    await preview();

    return container;
  }

  async getExport() {
    if (this.imageCount === 1) {
      return await this.createPNG(0);
    } else {
      let zip = new JSZip();
      for (let i = 0; i < this.imageCount; i++) {
        zip.file(`${i}.png`, await this.createPNG(i));
      }
      return await zip.generateAsync({type: 'uint8array'});
    }
  }
}
