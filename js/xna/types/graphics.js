import {
  decode_a8,
  decode_bgr565, decode_bgra4444, decode_bgra5551,
  decode_dxt1, decode_dxt3,
  decode_dxt5, decode_normalizedbyte2,
  decode_rg32,
  decode_rgb565, decode_rgba1010102,
  decode_rgba4444,
  decode_rgba64,
  encode_png
} from "../../encoders";
import {BaseType} from "./baseType";
import {ImagePreview} from "../../preview/imagePreview";
import {ExternalReference} from "./system";
import {XNBObject} from "./object";
import {BoundingSphere, Matrix, Vector3} from "./math";
import JSZip from "jszip";

export class Texture extends BaseType {
  constructor(reader) {
    super(reader);
    // This class should be overridden
  }
}

const textureFormat = [
  'Color',
  'Bgr565',
  'Bgra5551',
  'Bgra4444',
  'Dxt1',
  'Dxt3',
  'Dxt5',
  'NormalizedByte2',
  'NormalizedByte4',
  'Rgba1010102',
  'Rg32',
  'Rgba64',
  'Alpha8',
  'Single',
  'Vector2',
  'Vector4',
  'HalfSingle',
  'HalfVector2',
  'HalfVector4',
  'HdrBlendable'
];

function loadImageRaw(width, height, data, surfaceFormat) {
  switch (surfaceFormat) {
    case 'Color':
      return data;
    case 'Bgr565':
      return decode_bgr565(data, width, height);
    case 'Bgra5551':
      return decode_bgra5551(data, width, height);
    case 'Bgra4444':
      return decode_bgra4444(data, width, height);
    case 'Dxt1':
      return decode_dxt1(data, width, height);
    case 'Dxt3':
      return decode_dxt3(data, width, height);
    case 'Dxt5':
      return decode_dxt5(data, width, height);
    case 'NormalizedByte2':
      return decode_normalizedbyte2(data, width, height);
    case 'NormalizedByte4':
      return data;
    case 'Rgba1010102':
      return decode_rgba1010102(data, width, height);
    case 'Rg32':
      return decode_rg32(data, width, height);
    case 'Rgba64':
      return decode_rgba64(data, width, height);
    case 'Alpha8':
      return decode_a8(data);
    case 'Single':
      return data;  // TODO: float32 (r, g, b, a)
    case 'Vector2':
      return data;  // TODO: float32 r, float32 g, b=0, a=0xff
    case 'Vector4':
      return data;  // TODO: float32 for each of rgba
    case 'HalfSingle':
      return data;  // TODO: float16
    case 'HalfVector2':
      return data;  // TODO: float16 r float16 g b=0 a=0xff
    case 'HalfVector4':
      return data;  // TODO: float16 for each of (rgba)?
    case 'HdrBlendable':
      return data;  // TODO: uint16 (r, g, b) uint16 (a)
  }
}

export class Texture2D extends Texture {
  exportExtension = '.png';
  canExport = true;

  constructor(reader) {
    super(reader);
    this.surfaceFormat = textureFormat[reader.readInt32()];
    this.width = reader.readUInt32();
    this.height = reader.readUInt32();
    this.mipCount = reader.readUInt32();
    this.textures = [];
    for (let i = 0; i < this.mipCount; i++) {
      this.textures.push(
        encode_png(this.width, this.height,
          loadImageRaw(this.width, this.height, reader.read(reader.readUInt32()), this.surfaceFormat), false
        )
      );
    }
    if (this.textures.length > 1) this.exportExtension = '.zip';
  }

  async createPreview() {
    return await new ImagePreview(this.textures.length, async i => {
      return URL.createObjectURL(new Blob([this.textures[i]], {type: 'image/png'}));
    }).create();
  }

  async getExport() {
    if (this.textures.length === 1) {
      return await this.textures[0];
    } else {
      let zip = new JSZip();
      for (let i = 0; i < this.textures.length; i++) {
        zip.file(`${i}.png`, await this.textures[i]);
      }
      return await zip.generateAsync({type: 'uint8array'});
    }
  }
}

export class Texture3D extends Texture {
  exportExtension = '.png';
  canExport = true;

  constructor(reader) {
    super(reader);
    this.surfaceFormat = textureFormat[reader.readInt32()];
    this.width = reader.readUInt32();
    this.height = reader.readUInt32();
    this.depth = reader.readUInt32();
    this.mipCount = reader.readUInt32();
    this.textures = [];
    // TODO: render this in 3D instead of 2D
    for (let i = 0; i < this.mipCount * this.depth; i++) {
      this.textures.push(
        encode_png(this.width, this.height,
          loadImageRaw(this.width, this.height, reader.read(reader.readUInt32()), this.surfaceFormat), false
        )
      );
    }
    if (this.textures.length > 1) this.exportExtension = '.zip';
  }

  async createPreview() {
    return await new ImagePreview(this.textures.length, async i => {
      return URL.createObjectURL(new Blob([this.textures[i]], {type: 'image/png'}));
    }).create();
  }

  // TODO: change this to return some sort of bitmap 3D model if that's even a thing
  async getExport() {
    if (this.textures.length === 1) {
      return await this.textures[0];
    } else {
      let zip = new JSZip();
      for (let i = 0; i < this.textures.length; i++) {
        zip.file(`${i}.png`, await this.textures[i]);
      }
      return await zip.generateAsync({type: 'uint8array'});
    }
  }
}

export class TextureCube extends Texture {
  exportExtension = '.png';
  canExport = true;

  constructor(reader) {
    super(reader);
    this.surfaceFormat = textureFormat[reader.readInt32()];
    this.size = reader.readUInt32();
    this.mipCount = reader.readUInt32();
    this.textures = [];
    // TODO: render this as a cube instead of 2D
    for (let i = 0; i < this.mipCount * 6; i++) {
      this.textures.push(
        encode_png(this.width, this.height,
          loadImageRaw(this.width, this.height, reader.read(reader.readUInt32()), this.surfaceFormat), false
        )
      );
    }
    if (this.textures.length > 1) this.exportExtension = '.zip';
  }

  async createPreview() {
    return await new ImagePreview(this.textures.length, async i => {
      return URL.createObjectURL(new Blob([this.textures[i]], {type: 'image/png'}));
    }).create();
  }

  // TODO: gltf cube with textures
  async getExport() {
    if (this.textures.length === 1) {
      return await this.textures[0];
    } else {
      let zip = new JSZip();
      for (let i = 0; i < this.textures.length; i++) {
        zip.file(`${i}.png`, await this.textures[i]);
      }
      return await zip.generateAsync({type: 'uint8array'});
    }
  }
}

export class IndexBuffer extends BaseType {
  constructor(reader) {
    super(reader);
    const is16Bit = reader.readBool();
    this.index = reader.readArrayT(
      () => is16Bit ? reader.readInt16() : reader.readInt32(),
      reader.readUInt32() / (is16Bit ? 2 : 4)
    );
  }
}

export class VertexBuffer extends BaseType {
  constructor(reader) {
    super(reader);
    this.declaration = new VertexDeclaration(reader);
    this.vertexData = reader.read(reader.readUInt32() * this.declaration.stride);
  }
}

export class VertexDeclaration extends BaseType {
  constructor(reader) {
    super(reader);
    this.stride = reader.readUInt32();
    const numElements = reader.readUInt32();
    this.elements = [];
    for (let i = 0; i < numElements; i++) {
      this.elements.push({
        offset: reader.readUInt32(),
        format: [
          'Single',
          'Vector2',
          'Vector3',
          'Vector4',
          'Color',
          'Byte4',
          'Short2',
          'Short4',
          'NormalizedShort2',
          'NormalizedShort4',
          'HalfVector2',
          'HalfVector4'
        ][reader.readInt32()],
        usage: [
          'Position',
          'Color',
          'TextureCoordinate',
          'Normal',
          'Binormal',
          'Tangent',
          'BlendIndices',
          'BlendWeight',
          'Depth',
          'Fog',
          'PointSize',
          'Sample',
          'TessellateFactor'
        ][reader.readInt32()],
        usageIndex: reader.readUInt32()
      });
    }
  }
}

export class Effect extends BaseType {
  constructor(reader) {
    super(reader);
    this.bytecode = reader.read(reader.readUInt32());
  }
}

export class EffectMaterial extends BaseType {
  constructor(reader, typeReaders) {
    super(reader);
    this.effect = new ExternalReference(reader);
    this.parameters = {};
    for (let i = 0; i < reader.readUInt32(); i++) {
      this.parameters[reader.readVarString()] = new XNBObject(reader, typeReaders).value;
    }
  }
}

export class BasicEffect extends BaseType {
  constructor(reader) {
    super(reader);
    this.texture = new ExternalReference(reader);
    this.diffuseColor = new Vector3(reader);
    this.emissiveColor = new Vector3(reader);
    this.specularColor = new Vector3(reader);
    this.specularPower = reader.readFloat32();
    this.alpha = reader.readFloat32();
    this.vertexColorEnabled = reader.readBool();
  }
}

export class AlphaTestEffect extends BaseType {
  constructor(reader) {
    super(reader);
    this.compareFn = [
      'Always',
      'Never',
      'Less',
      'LessEqual',
      'Equal',
      'GreaterEqual',
      'Greater',
      'NotEqual'
    ][reader.readInt32()];
    this.referenceAlpha = reader.readUInt32();
    this.diffuseColor = new Vector3(reader);
    this.alpha = reader.readFloat32();
    this.vertexColorEnabled = reader.readBool();
  }
}

export class DualTextureEffect extends BaseType {
  constructor(reader) {
    super(reader);
    this.texture1 = new ExternalReference(reader);
    this.texture2 = new ExternalReference(reader);
    this.diffuseColor = new Vector3(reader);
    this.alpha = reader.readFloat32();
    this.vertexColorEnabled = reader.readBool();
  }
}

export class EnvironmentMapEffect extends BaseType {
  constructor(reader) {
    super(reader);
    this.texture = new ExternalReference(reader);
    this.environmentMap = new ExternalReference(reader);
    this.envMapAmount = reader.readFloat32();
    this.envMapSpecular = new Vector3(reader);
    this.fresnelFactor = reader.readFloat32();
    this.diffuseColor = new Vector3(reader);
    this.emissiveColor = new Vector3(reader);
    this.alpha = reader.readFloat32();
  }
}

export class SkinnedEffect extends BaseType {
  constructor(reader) {
    super(reader);
    this.texture = new ExternalReference(reader);
    this.weightsPerVertex = reader.readUInt32();
    this.diffuseColor = new Vector3(reader);
    this.emissiveColor = new Vector3(reader);
    this.specularColor = new Vector3(reader);
    this.specularPower = reader.readFloat32();
    this.alpha = reader.readFloat32();
  }
}

export class SpriteFont extends BaseType {
  constructor(reader, typeReaders) {
    super(reader);
    this.texture = new XNBObject(reader, typeReaders).value;
    this.glyphs = new XNBObject(reader, typeReaders).value;
    this.cropping = new XNBObject(reader, typeReaders).value;
    this.characterMap = new XNBObject(reader, typeReaders).value;
    this.verticalLineSpacing = reader.readInt32();
    this.horizontalSpacing = reader.readFloat32();
    this.kerning = new XNBObject(reader, typeReaders).value;
    this.defaultCharacter = reader.readBool() ? reader.readChars(1) : null;
  }

  async createPreview() {
    return await new ImagePreview(this.texture.textures.length, async i => {
      return URL.createObjectURL(new Blob([this.texture.textures[i]], {type: 'image/png'}));
    }).create();
  }
}

export class Model extends BaseType {
  constructor(reader, typeReaders) {
    super(reader);
    const numBones = reader.readUInt32();
    const boneReference = (numBones < 255 ? () => reader.readByte() : () => reader.readUInt32());
    this.boneIndex = reader.readArrayT(() => ({
      name: new XNBObject(reader, typeReaders).value,
      transform: new Matrix(reader)
    }), numBones);
    this.bones = reader.readArrayT(() => ({
      parent: boneReference(reader),
      childBones: reader.readArrayT(() => boneReference(reader), reader.readUInt32())
    }), numBones);
    this.meshes = reader.readArrayT(() => ({
      name: new XNBObject(reader, typeReaders).value,
      parentBone: boneReference(reader),
      bounds: new BoundingSphere(reader),
      tag: new XNBObject(reader, typeReaders).value,
      parts: reader.readArrayT(() => ({
        vertexOffset: reader.readUInt32(),
        numVertices: reader.readUInt32(),
        startIndex: reader.readUInt32(),
        primitiveCount: reader.readUInt32(),
        meshPartTag: new XNBObject(reader, typeReaders).value,
        vertexBufferID: reader.readVarInt(),
        indexBufferID: reader.readVarInt(),
        effectID: reader.readVarInt()
      }), reader.readUInt32())
    }), reader.readUInt32());
    this.rootBone = boneReference(reader);
    this.modelTag = new XNBObject(reader, typeReaders).value;
  }
}
