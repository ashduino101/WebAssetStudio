import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {BoneWeights4, SubMesh, VertexData} from "./mesh";
import {KVPair} from "../basicTypes";

export class SecondarySpriteTexture {
  static exposedAttributes = [
    'texture',
    'name'
  ];

  constructor(reader) {
    this.texture = new PPtr(reader);
    this.name = reader.readCString();
  }
}

export const SpritePackingRotation = {
  0: 'None',
  1: 'FlipHorizontal',
  2: 'FlipVertical',
  3: 'Rotate180',
  4: 'Rotate90'
}

export const SpritePackingMode = {
  0: 'Tight',
  1: 'Rectangle'
}

export const SpriteMeshType = {
  0: 'FullRect',
  1: 'Tight'
}

export class SpriteSettings {
  static exposedAttributes = [
    'packed',
    'packingMode',
    'packingRotation',
    'meshType'
  ];

  constructor(reader) {
    let raw = reader.readUInt32();
    this.packed = (raw & 1) === 1;
    this.packingMode = SpritePackingMode[(raw >> 1) & 1];
    this.packingRotation = SpritePackingRotation[(raw >> 2) & 0xf];
    this.meshType = SpriteMeshType[(raw >> 6) & 1];
  }
}

export class SpriteVertex {
  static exposedAttributes = [
    'pos',
    'uv'
  ];

  constructor(reader) {
    this.pos = reader.readVector3();
    this.uv = null;
    if (reader.versionLTE(4, 3)) {
      this.uv = reader.readVector2();
    }
  }
}

export class SpriteRenderData {
  static exposedAttributes = [
    'texture',
    'alphaTexture',
    'secondaryTextures',
    'subMeshes',
    'bindPose',
    'sourceSkins',
    'textureRect',
    'textureRectOffset',
    'atlasRectOffset',
    'settings',
    'uvTransform',
    'downscaleMultiplier'
  ]

  constructor(reader) {
    this.texture = new PPtr(reader);
    this.alphaTexture = null;
    if (reader.versionGTE(5, 2)) {
      this.alphaTexture = new PPtr(reader);
    }
    this.secondaryTextures = [];
    if (reader.version[0] >= 2019) {
      let numSecondaryTextures = reader.readInt32();
      for (let i = 0; i < numSecondaryTextures; i++) {
        this.secondaryTextures.push(new SecondarySpriteTexture(reader));
      }
    }
    this.subMeshes = [];
    this.indexBuffer = [];
    this.vertexData = null;
    if (reader.versionGTE(5, 6)) {
      let numSubMeshes = reader.readInt32();
      for (let i = 0; i < numSubMeshes; i++) {
        this.subMeshes.push(new SubMesh(reader));
      }

      this.indexBuffer = reader.read(reader.readUInt32());
      reader.align(4);
      this.vertexData = new VertexData(reader);
    } else {
      let numVertices = reader.readInt32();
      this.vertices = [];
      for (let i = 0; i < numVertices; i++) {
        this.vertices.push(new SpriteVertex(reader));
      }
      this.indexBuffer = reader.readArrayT(reader.readUInt16, reader.readUInt32());
      reader.align(4);
    }

    this.bindPose = [];
    this.sourceSkins = [];
    if (reader.version[0] >= 2018) {
      this.bindPose = reader.readArrayT(reader.readMatrix, reader.readUInt32());
      if (reader.version[0] === 2018 && reader.version[1] < 2) {
        let numSourceSkins = reader.readInt32();
        for (let i = 0; i < numSourceSkins; i++) {
          this.sourceSkins.push(new BoneWeights4(reader));
        }
      }
    }

    this.textureRect = new Rectf(reader);
    this.textureRectOffset = reader.readVector2();
    this.atlasRectOffset = null;
    if (reader.versionGTE(5, 6)) {
      this.atlasRectOffset = reader.readVector2();
    }
    this.settings = new SpriteSettings(reader);
    this.uvTransform = null;
    if (reader.versionGTE(4, 5)) {
      this.uvTransform = reader.readVector4();
    }
    this.downscaleMultiplier = null;
    if (reader.version[0] >= 2017) {
      this.downscaleMultiplier = reader.readFloat32();
    }
  }
}

export class Rectf {
  static exposedAttributes = [
    'x', 'y', 'width', 'height'
  ];

  constructor(reader) {
    this.x = reader.readFloat32();
    this.y = reader.readFloat32();
    this.width = reader.readFloat32();
    this.height = reader.readFloat32();
  }
}

export class Sprite extends NamedObject {
  static exposedAttributes = [
    'name',
    'rect',
    'offset',
    'border',
    'pixelsToUnits',
    'pivot',
    'extrude',
    'isPolygon',
    'renderDataKey',
    'atlasTags',
    'spriteAtlas',
    'renderData',
    'physicsShapes'
  ];

  constructor(reader) {
    super(reader);

    this.rect = new Rectf(reader);
    this.offset = reader.readVector2();
    this.border = null;
    if (reader.versionGTE(4, 5)) {
      this.border = reader.readVector4();
    }

    this.pixelsToUnits = reader.readFloat32();
    this.pivot = null;
    if (
      reader.version[0] > 5
      || (reader.version[0] === 5 && reader.version[1] > 4)
      || (reader.version[0] === 5 && reader.version[1] === 4 && reader.version[2] >= 2)
      || (reader.version[0] === 5 && reader.version[1] === 4 && reader.version[2] === 2 && reader.isPatch && reader.version[3] >= 3)
    ) {
      this.pivot = reader.readVector2();
    }

    this.extrude = reader.readUInt32();
    this.isPolygon = false;
    if (reader.versionGTE(5, 3)) {
      this.isPolygon = reader.readBool();
      reader.align(4);
    }
    this.renderDataKey = null;
    this.atlasTags = [];
    this.spriteAtlas = null;
    if (reader.version[0] >= 2017) {
      let key = [...reader.read(16)].map(x => x.toString(16).padStart(2, '0')).join('');
      this.renderDataKey = new KVPair(key, Number(reader.readInt64()));
      this.atlasTags = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
      this.spriteAtlas = new PPtr(reader);
    }
    this.renderData = new SpriteRenderData(reader);
    this.physicsShapes = [];
    if (reader.version[0] > 2017) {
      let numPhysicsShapes = reader.readInt32();
      for (let i = 0; i < numPhysicsShapes; i++) {
        this.physicsShapes.push(reader.readArrayT(() => reader.readVector2(), reader.readInt32()));
      }
    }
  }
}
