import {decode, encode_png} from "../../encoders";
import {arraysEqual} from "../../utils";
import {ResourceType} from "../type";
import {ImagePreview} from "../../preview/image";

const
  FORMAT_MASK_IMAGE_FORMAT = (1 << 20) - 1,
  FORMAT_BIT_LOSSLESS = 1 << 20,
  FORMAT_BIT_LOSSY = 1 << 21,
  FORMAT_BIT_STREAM = 1 << 22,
  FORMAT_BIT_HAS_MIPMAPS = 1 << 23,
  FORMAT_BIT_DETECT_3D = 1 << 24,
  FORMAT_BIT_DETECT_SRGB = 1 << 25,
  FORMAT_BIT_DETECT_NORMAL = 1 << 26;


const formatNames = [  // Names changed to match size-per-pixel, not size-per-channel
  "L8", // luminance
  "LA16", // luminance-alpha
  "R8",
  "RG16",
  "RGB24",
  "RGBA32",
  "RGBA4444",
  "RGBA5551",
  "RFloat", // float
  "RGFloat",
  "RGBFloat",
  "RGBAFloat",
  "RHalf",
  "RGHalf",
  "RGBHalf",
  "RGBAHalf",
  "RGB9e5Float",
  "DXT1",
  "DXT3",
  "DXT5",
  "BC4",
  "BC5",
  "BC6H",
  "BPTC_RGBF",  // unsupported
  "BPTC_RGBFU",  // unsupported
  "ETC_RGB4",
  "ETC2_R11",  // unsupported
  "ETC2_R11S",  // signed, NOT srgb. unsupported
  "ETC2_RG11",  // unsupported
  "ETC2_RG11S",  // unsupported
  "ETC2_RGB",
  "ETC2_RGBA8",
  "ETC2_RGBA1",
  "ETC2_RA_AS_RG",  // unsupported
  "FORMAT_DXT5_RA_AS_RG",  // unsupported
  "ASTC_RGB_4x4",
  "ASTC_HDR_4x4",
  "ASTC_RGB_8x8",
  "ASTC_HDR_8x8",
];

export class StreamTexture extends ResourceType {  // older v3 format (last commit dc32083681a770e9d7e332c5beed30b52c793752)
  constructor(reader) {
    super();
    if (reader.readChars(4) !== 'GDST') {
      throw new Error('Invalid stream texture');
    }

    this.width = reader.readInt16();
    this.customWidth = reader.readInt16();
    this.height = reader.readInt16();
    this.customHeight = reader.readInt16();

    this.flags = reader.readUInt32();
    this.dataFormat = reader.readUInt32();

    if (!(this.dataFormat & FORMAT_BIT_STREAM)) {
      this.sizeLimit = 0;
    }

    if ((this.dataFormat & FORMAT_BIT_LOSSLESS) || (this.dataFormat & FORMAT_BIT_LOSSY)) {
      this.mipMaps = reader.readInt32();
      let size = reader.readInt32();
      this.images = reader.readArrayT(() => {
        let format = reader.readChars(4);
        return reader.read(size)
      }, this.mipMaps);
    } else {
      this.mipMaps = 1;
      let format = formatNames[this.dataFormat & FORMAT_MASK_IMAGE_FORMAT];
      this.images = [encode_png(
        this.width,
        this.height,
        decode(
          format,
          reader.read(reader.readInt32()),
          this.width,
          this.height,
          false
        ),
        false
      )];
    }
  }

  createDataUrl(imageNum) {
    let image = this.images[imageNum];
    console.log(image);
    return URL.createObjectURL(new Blob([image], {
      type:  image[0] === 0x57 ? 'image/webp' : (image[0] === 0x89 ? 'image/png' : 'image/jpeg')}));
  }

  createPreview() {
    return new ImagePreview(this.mipMaps, m => this.createDataUrl(m)).create();
  }
}