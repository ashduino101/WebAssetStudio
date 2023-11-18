import {Extension} from "../extension";
import {requestExternalData} from "../utils";
import {
  unpackCrunch,
  unpackUnityCrunch
} from "../../crunch/crunch";
import {decode, encode_png} from "../../encoders";
import JSZip from "jszip";
import {ImagePreview} from "../../preview/imagePreview";

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

export class Texture2DExtension extends Extension {
  constructor(texture2d, version, platform) {
    super();
    this.texture = texture2d;
    this.version = version;
    this.platform = platform;
    this.textureFormat = TextureFormat[this.texture.m_TextureFormat];
  }

  async loadData() {
    if ((this.texture.m_StreamData?.path ?? '') !== '') {
      try {
        this.data = await requestExternalData(this.texture.m_StreamData);
      } catch {
        console.error('Failed to load image data, creating empty image');
        this.data = new Uint8Array(this.texture.m_StreamData.size).fill(0);
      }
    } else if (this.texture['image data'] != null) {
      this.data = this.texture['image data'];
    } else {
      console.error('No data available in image');
    }
  }

  async unpackCrunch(data) {
    if (
      this.version[0] > 2017 || (this.version[0] === 2017 && this.version[1] >= 3)
      || this.textureFormat === 'ETC2_RGB4Crunched'
      || this.textureFormat === 'ETC2_RGBA8Crunched'
    ) {
      return await unpackUnityCrunch(data);
    } else {
      return await unpackCrunch(data);
    }
  }

  async decodeRaw(imageNum) {
    if (this.cachedRaw == null) {
      await this.loadData();
      let data = this.data.slice(this.texture.m_CompleteImageSize * imageNum, this.texture.m_CompleteImageSize * (imageNum + 1));
      if (this.textureFormat === "DXT1Crunched"
        || this.textureFormat === "DXT5Crunched"
        || this.textureFormat === "ETC_RGB4Crunched"
        || this.textureFormat === "ETC_RGBA8Crunched"
      ) {
        // uncrunch
        data = await this.unpackCrunch(data);
      }
      return decode(this.textureFormat, data, this.texture.m_Width, this.texture.m_Height, this.platform === 'XBox 360');
    } else {
      return this.cachedRaw;
    }
  }

  async createPNG(imageNum) {
    return encode_png(this.texture.m_Width, this.texture.m_Height, await this.decodeRaw(imageNum), true);
  }

  async createDataUrl(imageNum) {
    let pngData = await this.createPNG(imageNum);
    return URL.createObjectURL(new Blob([pngData], {type: 'image/png'}));
  }

  async createPreview() {
    return new ImagePreview(this.texture.m_ImageCount, async i => this.createDataUrl(i)).create();
  }

  async getExport() {
    if (this.texture.m_ImageCount === 1) {
      return await this.createPNG(0);
    } else {
      let zip = new JSZip();
      for (let i = 0; i < this.texture.m_ImageCount; i++) {
        zip.file(`${i}.png`, await this.createPNG(i));
      }
      return await zip.generateAsync({type: 'uint8array'});
    }
  }
}