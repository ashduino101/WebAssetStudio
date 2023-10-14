import {Texture} from "./texture";
import {
  unpackCrunch,
  unpackUnityCrunch
} from "../../crunch/crunch";
import {BinaryReader} from "../../binaryReader";
import {requestExternalData} from "../utils";
import JSZip from "jszip";
import {decode, encode_png} from "../../encoders";

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

  async unpackCrunch(data) {
    if (
      this._version[0] > 2017 || (this._version[0] === 2017 && this._version[1] >= 3)
      || this.textureFormat === 'ETC2_RGB4Crunched'
      || this.textureFormat === 'ETC2_RGBA8Crunched'
    ) {
      return await unpackUnityCrunch(data);
    } else {
      return await unpackCrunch(data);
    }
  }

  async decodeRaw(imageNum) {
    console.log(this.textureFormat);
    if (this.cachedRaw == null) {
      await this.loadData();
      let data = this.data.slice(this.completeSize * imageNum, this.completeSize * (imageNum + 1));
      if (this.textureFormat === "DXT1Crunched"
        || this.textureFormat === "DXT5Crunched"
        || this.textureFormat === "ETC_RGB4Crunched"
        || this.textureFormat === "ETC_RGBA8Crunched"
      ) {
        // uncrunch
        data = await this.unpackCrunch(data);
      }
      return decode(this.textureFormat, data, this.width, this.height, this._platform === 'XBox 360');
    } else {
      return this.cachedRaw;
    }
  }

  async createPNG(imageNum) {
    return encode_png(this.width, this.height, await this.decodeRaw(imageNum));
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
