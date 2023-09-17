import * as THREE from 'three';
import {AABB, PackedFloatVector, PackedIntVector} from "./animationClip";
import {NamedObject} from "./namedObject";
import {StreamingInfo} from "./texture2d";
import {BinaryReader} from "../binaryReader";
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {Matrix4x4} from "../basicTypes";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import {requestExternalData} from "../utils";
import $ from "jquery";
import {Vector3} from "three"; // using three's Vector3 for normalization

export class MinMaxAABB {
  static exposedAttributes = [
    'min',
    'max'
  ];

  constructor(reader) {
    this.min = reader.readVector3();
    this.max = reader.readVector3();
  }
}

export class CompressedMesh {
  // not exposed - we'll expose them on the main mesh
  static exposedAttributes = [];
  constructor(reader) {
    this.vertices = new PackedFloatVector(reader);
    this.uv = new PackedFloatVector(reader);
    this.bindPoses = [];  // has length
    if (reader.version[0] < 5) {
      this.bindPoses = new PackedFloatVector(reader);
    }
    this.normals = new PackedFloatVector(reader);
    this.tangents = new PackedFloatVector(reader);
    this.weights = new PackedIntVector(reader);
    this.normalSigns = new PackedIntVector(reader);
    this.tangentSigns = new PackedIntVector(reader);
    this.floatColors = [];
    if (reader.version[0] >= 5) {
      this.floatColors = new PackedFloatVector(reader);
    }
    this.boneIndices = new PackedIntVector(reader);
    this.triangles = new PackedIntVector(reader);
    this.colors = [];
    this.uvInfo = 0;
    if (reader.versionGTE(3, 5)) {
      if (reader.version[0] < 5) {
        this.colors = new PackedIntVector(reader);
      } else {
        this.uvInfo = reader.readUInt32();
      }
    }
  }
}

export class StreamInfo {
  static exposedAttributes = [
    'channelMask',
    'offset',
    'stride',
    'dividerOp',
    'frequency'
  ];

  constructor(reader) {
    if (typeof reader != 'undefined') {
      this.channelMask = reader.readUInt32();
      this.offset = reader.readUInt32();
      if (reader.version < 4) {
        this.stride = reader.readUInt32();
        this.align = reader.readUInt32();
      } else {
        this.stride = reader.read(1)[0];
        this.dividerOp = reader.read(1)[0];
        this.frequency = reader.readUInt16();
      }
    }
  }
}

export class ChannelInfo {
  static exposedAttributes = [
    'stream',
    'offset',
    'format',
    'dimension'
  ];

  constructor(reader) {
    if (typeof reader != 'undefined') {
      this.stream = reader.read(1)[0];
      this.offset = reader.read(1)[0];
      this.format = reader.read(1)[0];
      this.dimension = reader.read(1)[0] & 0xF;
    }
  }
}

function getVertexSize(format, version) {
  if (version[0] < 2017) {
    switch (format) {
      case 0:
      case 4:
        return 4;
      case 1:
        return 2;
      case 3:
        return 1;
    }
  } else {
    switch (format) {
      case 0:
      case 11:
      case 12:
        return 4;
      case 1:
      case 5:
      case 6:
      case 9:
      case 10:
        return 2;
      case 2:
      case 3:
      case 4:
      case 7:
      case 8:
        return 1;
    }
  }
}

function getVertexFormatReader(reader, format) {
  if (reader.version[0] < 2017) {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUInt8;  // color (single channel)
      case 3: return reader.readUInt8;
      case 4: return reader.readUInt32;
    }
  } else if (reader.version[0] < 2019) {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUNorm8;  // color (single channel)
      case 3: return reader.readUNorm8;
      case 4: return reader.readNorm8
      case 5: return reader.readUNorm16;
      case 6: return reader.readNorm16;
      case 7: return reader.readUInt8
      case 8: return reader.readInt8;
      case 9: return reader.readUInt16;
      case 10: return reader.readInt16;
      case 11: return reader.readUInt32;
      case 12: return reader.readInt32;
    }
  } else {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUNorm8;
      case 3: return reader.readNorm8
      case 4: return reader.readUNorm16;
      case 5: return reader.readNorm16;
      case 6: return reader.readUInt8
      case 7: return reader.readInt8;
      case 8: return reader.readUInt16;
      case 9: return reader.readInt16;
      case 10: return reader.readUInt32;
      case 11: return reader.readInt32;
    }
  }
}

export class VertexData {
  static exposedAttributes = [
    'vertexCount',
    'channels',
    'streams'
  ]
  constructor(reader) {
    const version = reader.version;
    if (version[0] < 2018) {
      this.currentChannels = reader.readUInt32();
    }
    this.vertexCount = reader.readUInt32();
    if (version[0] >= 4) {
      let numChannels = reader.readInt32();
      this.channels = [];
      for (let i = 0; i < numChannels; i++) {
        this.channels.push(new ChannelInfo(reader));
      }
    }
    if (version[0] < 5) {
      let streamCount = 4;
      this.streams = [];
      if (version[0] >= 4) {
        streamCount = reader.readInt32();
      }
      for (let i = 0; i < streamCount; i++) {
        this.streams.push(new StreamInfo(reader));
      }
      if (version[0] < 4) {
        this.getChannels();
      }
    } else {
      this.getStreams(version);
    }

    this.data = reader.read(reader.readUInt32());
    reader.align(4);
  }

  getChannels() {
    this.channels = [];
    for (let i = 0; i < 6; i++) {
      this.channels.push(new ChannelInfo());
    }
    for (let s = 0; s < this.streams.length; s++) {
      let channelMask = this.streams[s].channelMask;
      let offset = 0;
      for (let i = 0; i < 6; i++) {
        if ((channelMask & s) === 1) {
          let channel = this.channels[s];
          channel.stream = s;
          channel.offset = offset;
          switch (i) {
            case 0:
            case 1:
              channel.format = 0;
              channel.dimension = 3;
              offset += 12;
              break;
            case 2:
              channel.format = 2;
              channel.dimension = 4;
              offset += 4;
              break;
            case 3:
            case 4:
              channel.format = 0;
              channel.dimension = 2;
              offset += 8;
              break;
            case 5:
              channel.format = 0;
              channel.dimension = 4;
              offset += 16;
              break;
          }
        }
      }
    }
  }

  getStreams(version) {
    let streamCount = Math.max(...this.channels.map(x => x.stream)) + 1;
    this.streams = [];
    let offset = 0;
    for (let s = 0; s < streamCount; s++) {
      let chnMask = 0;
      let stride = 0;
      for (let chn = 0; chn < this.channels.length; chn++) {
        let channel = this.channels[chn];
        if (channel.stream === s) {
          if (channel.dimension > 0) {
            chnMask |= 1 << chn;
            stride += channel.dimension * getVertexSize(channel.format, version);
          }
        }
      }
      let si = new StreamInfo();
      si.channelMask = chnMask;
      si.offset = offset;
      si.stride = stride;
      si.dividerOp = 0;
      si.frequency = 0;
      this.streams.push(si);

      offset += this.vertexCount * stride;
      offset = (offset + 15) & ~15;
    }
  }
}

export class BoneWeights4 {
  static exposedAttributes = [
    'weight',
    'boneIndex'
  ];

  constructor(reader) {
    if (typeof reader !== 'undefined') {
      this.weight = reader.readArrayT(reader.readFloat32.bind(reader), 4);
      this.boneIndex = reader.readArrayT(reader.readInt32.bind(reader), 4);
    } else {
      this.weight = new Array(4);
      this.boneIndex = new Array(4);
    }
  }
}

export class BlendShapeVertex {
  static exposedAttributes = [
    'vertex',
    'normal',
    'tangent',
    'index'
  ];

  constructor(reader) {
    this.vertex = reader.readVector3();
    this.normal = reader.readVector3();
    this.tangent = reader.readVector3();
    this.index = reader.readUInt32();
  }
}

export class MeshBlendShape {
  static exposedAttributes = [
    'firstVertex',
    'vertexCount',
    'hasNormals',
    'hasTangents'
  ];

  constructor(reader) {
    if (reader.version[0] === 4 && reader.version[1] < 3) {
      this.name = reader.readAlignedString();
    }
    this.firstVertex = reader.readUInt32();
    this.vertexCount = reader.readUInt32();
    if (reader.version[0] === 4 && reader.version[1] < 3) {
      this.aabbMinDelta = reader.readVector3();
      this.aabbMaxDelta = reader.readVector3();
    }
    this.hasNormals = reader.readBool();
    this.hasTangents = reader.readBool();
    if (reader.versionGTE(4, 3)) {
      reader.align(4);
    }
  }
}

export class MeshBlendShapeChannel {
  static exposedAttributes = [
    'name',
    'nameHash',
    'frameIndex',
    'frameCount'
  ];

  constructor(reader) {
    this.name = reader.readAlignedString();
    this.nameHash = reader.readUInt32();
    this.frameIndex = reader.readInt32();
    this.frameCount = reader.readInt32();
  }
}

export class BlendShapeData {
  static exposedAttributes = [
    'shapes',
    'channels',
    'fullWeights'
  ];

  constructor(reader) {
    if (reader.versionGTE(4, 3)) {
      let numVerts = reader.readInt32();
      this.vertices = [];
      for (let i = 0; i < numVerts; i++) {
        this.vertices.push(new BlendShapeVertex(reader));
      }

      let numShapes = reader.readInt32();
      this.shapes = [];
      for (let i = 0; i < numShapes; i++) {
        this.shapes.push(new MeshBlendShape(reader));
      }

      let numChannels = reader.readInt32();
      this.channels = [];
      for (let i = 0; i < numChannels; i++) {
        this.channels.push(new MeshBlendShapeChannel(reader));
      }

      this.fullWeights = reader.readArrayT(() => reader.readFloat32(), reader.readUInt32());
    } else {
      let shapesSize = reader.readInt32();
      this.shapes = [];
      for (let i = 0; i < shapesSize; i++) {
        this.shapes.push(new MeshBlendShape(reader));
      }
      reader.align(4);
      let shapeVerticesSize = reader.readInt32();
      this.shapeVertices = [];
      for (let i = 0; i < shapeVerticesSize; i++) {
        this.shapeVertices.push(new BlendShapeVertex(reader));
      }
    }
  }
}

export const GfxPrimitiveType = {
  0: 'Triangles',
  1: 'TrianglesStrip',
  2: 'Quads',
  3: 'Lines',
  4: 'LineStrip',
  5: 'Points'
}

export class SubMesh {
  static exposedAttributes = [
    'firstByte',
    'indexCount',
    'topology',
    'firstVertex',
    'vertexCount',
    'localAABB'
  ];

  constructor(reader) {
    this.firstByte = reader.readUInt32();
    this.indexCount = reader.readUInt32();
    this.topology = GfxPrimitiveType[reader.readInt32()];
    if (reader.version[0] < 4) {
      this.triangleCount = reader.readUInt32();
    }
    if (reader.versionGTE(2017, 3)) {
      this.baseVertex = reader.readUInt32();
    }
    if (reader.version[0] >= 3) {
      this.firstVertex = reader.readUInt32();
      this.vertexCount = reader.readUInt32();
      this.localAABB = new AABB(reader);
    }
  }
}

export class Mesh extends NamedObject {
  static exposedAttributes = [
    'subMeshes',
    'shapes',
    'bindPose',
    'boneNameHashes',
    'rootBoneNameHash',
    'meshCompression',
    'isReadable',
    'keepVertices',
    'keepIndices',
    'localAABB',
    'meshUsageFlags'
  ];
  exportExtension = '.gltf';

  constructor(reader) {
    super(reader);

    this._shouldProcessVertexData = reader.versionGTE(3, 5);
    this._shouldDecompressMesh = reader.versionGTE(2, 6);
    this._version = reader.version;
    this._endian = reader.endian;

    if (reader.versionLT(3, 5)) {
      this.use16BitIndices = reader.readInt32() > 0;
    }

    if (reader.version[0] === 2 && reader.version[1] <= 5) {
      let indexBufferSize = reader.readInt32();

      if (this.use16BitIndices) {
        this.indexBuffer = reader.readArrayT(() => reader.readUInt16(), (indexBufferSize / 2) | 0);
        reader.align(4);
      } else {
        this.indexBuffer = reader.readArrayT(() => reader.readUInt32(), (indexBufferSize / 4) | 0);
      }
    }

    let numSubMeshes = reader.readInt32();
    this.subMeshes = [];
    for (let i = 0; i < numSubMeshes; i++) {
      this.subMeshes.push(new SubMesh(reader));
    }

    if (reader.versionGTE(4, 1)) {
      this.shapes = new BlendShapeData(reader);
    }

    if (reader.versionGTE(4, 3)) {
      this.bindPose = reader.readArrayT(reader.readMatrix.bind(reader), reader.readUInt32());
      this.boneNameHashes = reader.readArrayT(() => reader.readUInt32(), reader.readUInt32());
      this.rootBoneNameHash = reader.readUInt32();
    }

    if (reader.versionGTE(2, 6)) {
      if (reader.version[0] >= 2019) {
        let bonesAABBSize = reader.readInt32();
        this.bonesAABB = [];
        for (let i = 0; i < bonesAABBSize; i++) {
          this.bonesAABB.push(new MinMaxAABB(reader));
        }

        this.variableBoneCountWeights = reader.readArrayT(() => reader.readUInt32(), reader.readUInt32());
      }

      this.meshCompression = reader.read(1)[0];
      if (reader.version[0] >= 4) {
        if (reader.version[0] < 5) {
          this.streamCompression = reader.read(1)[0];
        }
        this.isReadable = reader.readBool();
        this.keepVertices = reader.readBool();
        this.keepIndices = reader.readBool();
      }
      reader.align(4);

      const version = reader.version;
      if (
        (version[0] > 2017 || (version[0] === 2017 && version[1] >= 4)) ||
        ((version[0] === 2017 && version[1] === 3 && version[2] === 1) && reader.isPatch) ||
        ((version[0] === 2017 && version[1] === 3) && this.meshCompression === 0)
      ) {
        this.indexFormat = reader.readInt32();
        this.use16BitIndices = this.indexFormat === 0;
      }

      let indexBufferSize = reader.readInt32();
      if (this.use16BitIndices) {
        this.indexBuffer = reader.readArrayT(() => reader.readUInt16(), (indexBufferSize / 2) | 0);
        reader.align(4);
      } else {
        this.indexBuffer = reader.readArrayT(() => reader.readUInt32(), (indexBufferSize / 4) | 0);
      }
    }

    if (reader.versionLT(3, 5)) {
      this.vertexCount = reader.readInt32();
      this.vertices = reader.readArrayT(reader.readVector3.bind(reader), reader.readUInt32());

      let numBoneWeights = reader.readInt32();
      this.skin = [];
      for (let i = 0; i < numBoneWeights; i++) {
        this.skin.push(new BoneWeights4(reader));
      }

      this.bindPose = reader.readArrayT(reader.readMatrix.bind(reader), reader.readUInt32());
      this.uv0 = reader.readArrayT(reader.readIVector2.bind(reader), reader.readUInt32());
      this.uv1 = reader.readArrayT(reader.readIVector2.bind(reader), reader.readUInt32());

      if (reader.version[0] === 2 && reader.version[1] <= 5) {
        let numNormalsTangents = reader.readInt32();
        this.normals = [];
        this.tangents = [];
        for (let v = 0; v < numNormalsTangents; v++) {
          this.normals.push(reader.readVector3());
          this.tangents.push(reader.readVector4());
        }
      } else {
        this.tangents = reader.readArrayT(reader.readVector4.bind(reader), reader.readInt32());
        this.normals = reader.readArrayT(reader.readVector3.bind(reader), reader.readInt32());
      }
    } else {
      if (reader.versionLT(2018, 2)) {
        let numBoneWeights = reader.readInt32();
        this.skin = [];
        for (let i = 0; i < numBoneWeights; i++) {
          this.skin.push(new BoneWeights4(reader));
        }
      }

      if (reader.versionLTE(4, 2)) {
        this.bindPose = reader.readArrayT(reader.readMatrix.bind(reader), reader.readUInt32());
      }

      this.vertexData = new VertexData(reader);
    }

    if (reader.versionGTE(2, 6)) {
      this.compressedMesh = new CompressedMesh(reader);
    }

    this.localAABB = new AABB(reader);

    this.colors = [];
    if (reader.versionLTE(3, 4)) {
      let numColors = reader.readInt32();
      for (let i = 0; i < numColors; i++) {
        this.colors.push([reader.readUInt8(), reader.readUInt8(), reader.readUInt8(), reader.readUInt8()]);
      }

      this.collisionTriangles = reader.readArrayT(() => reader.readUInt32(), reader.readUInt32());
      this.collisionVertexCount = reader.readInt32();
    }
    this.meshUsageFlags = reader.readInt32();
    if (reader.versionGTE(2022, 1)) {
      this.cookingOptions = reader.readInt32();
    }

    if (reader.version[0] >= 5) {
      this.bakedConvexCollisionMesh = reader.read(reader.readUInt32());
      reader.align(4);
      this.bakedTriangleCollisionMesh = reader.read(reader.readUInt32());
      reader.align(4);
    }

    if (reader.versionGTE(2018, 2)) {
      this.meshMetrics = [reader.readFloat32(), reader.readFloat32()];
    }

    if (reader.versionGTE(2018, 3)) {
      reader.align(4);
      this.streamData = new StreamingInfo(reader);
    }

    this.process();
  }

  async process() {
    if (this.streamData && this.streamData.path !== '') {
      if (this.vertexData.vertexCount > 0) {
        this.vertexData.data = await requestExternalData(this.streamData);
      }
    }
    if (this._shouldProcessVertexData) {
      this.processVertexData();
    }
    if (this._shouldDecompressMesh) {
      this.decompressMesh();
    }
    this.getTriangles();
  }

  processVertexData() {
    for (let chn = 0; chn < this.vertexData.channels.length; chn++) {
      let channel = this.vertexData.channels[chn];
      if (channel.dimension > 0) {
        let stream = this.vertexData.streams[channel.stream];
        if ((stream.channelMask & (1 << chn)) !== 0) {
          if (this._version[0] < 2018 && chn === 2 && channel.format === 2) {
            channel.dimension = 4;
          }

          let reader = new BinaryReader(this.vertexData.data);
          reader.version = this._version;
          reader.endian = this._endian;
          let valueReader = getVertexFormatReader(reader, channel.format).bind(reader);
          let componentSize = getVertexSize(channel.format, this._version);

          let value = [];
          for (let i = 0; i < this.vertexData.vertexCount; i++) {
            let vertexOffset = stream.offset + channel.offset + stream.stride * i;
            let v = [];
            for (let d = 0; d < channel.dimension; d++) {
              reader.seek(vertexOffset + componentSize * d);
              v.push(valueReader());
            }
            value.push(v);
          }

          if (this._version[0] >= 2018) {
            switch (chn) {
              case 0:
                this.vertices = value;
                break;
              case 1:
                this.normals = value;
                break;
              case 2:
                this.tangents = value;
                break;
              case 3:
                this.colors = value;
                break;
              case 4:
                this.uv0 = value;
                break;
              case 5:
                this.uv1 = value;
                break;
              case 6:
                this.uv2 = value;
                break;
              case 7:
                this.uv3 = value;
                break;
              case 8:
                this.uv4 = value;
                break;
              case 9:
                this.uv5 = value;
                break;
              case 10:
                this.uv6 = value;
                break;
              case 11:
                this.uv7 = value;
                break;
              case 12:  // blend weights
                if (this.skin == null) {
                  this.initMSkin();
                }
                for (let i = 0; i < this.vertexData.vertexCount; i++) {
                  for (let j = 0; j < channel.dimension; j++) {
                    this.skin[i].weight[j] = value[i * channel.dimension + j];
                  }
                }
                break;
              case 13:
                if (this.skin == null) {
                  this.initMSkin();
                }
                for (let i = 0; i < this.vertexData.vertexCount; i++) {
                  for (let j = 0; j < channel.dimension; j++) {
                    this.skin[i].boneIndex[j] = value[i * channel.dimension + j];
                  }
                }
                break;
            }
          } else {
            switch (chn) {
              case 0:
                this.vertices = value;
                break;
              case 1:
                this.normals = value;
                break;
              case 2:
                this.colors = value;
                break;
              case 3:
                this.uv0 = value;
                break;
              case 4:
                this.uv1 = value;
                break;
              case 5:
                if (this._version[0] >= 5) {
                  this.uv2 = value;
                } else {
                  this.tangents = value;
                }
                break;
              case 6:
                this.uv3 = value;
                break;
              case 7:
                this.tangents = value;
                break;
            }
          }
        }
      }
    }
  }

  decompressMesh() {
    if (this.compressedMesh.vertices.length > 0) {
      this.vertexCount = this.compressedMesh.vertices.length / 3;
      this.vertices = this.compressedMesh.vertices.unpack(3, 3 * 4);
    }
    if (this.compressedMesh.uv.length > 0) {
      let uvInfo = this.compressedMesh.uvInfo;
      if (uvInfo !== 0) {
        const infoBitsPerUV = 4;
        const uvDimensionMask = 3;
        const uvChannelExists = 4;
        const maxTexCoordShaderChannels = 8;

        let uvSrcOffset = 0;
        for (let uv = 0; uv < maxTexCoordShaderChannels; uv++) {
          let texCoordBits = uvInfo >> (uv * infoBitsPerUV);
          texCoordBits &= (1 << infoBitsPerUV) - 1;
          if ((texCoordBits & uvChannelExists) !== 0) {
            let uvDim = 1 + (texCoordBits & uvDimensionMask);
            this[`uv${uv}`] = this.compressedMesh.uv.unpack(uvDim, uvDim * 4, uvSrcOffset, this.vertexCount);
            uvSrcOffset += uvDim * this.vertexCount;
          }
        }
      } else {
        this.uv0 = this.compressedMesh.uv.unpack(2, 2 * 4, 0, this.vertexCount);
        if (this.compressedMesh.uv.length >= this.vertexCount * 4) {
          this.uv1 = this.compressedMesh.uv.unpack(2, 2 * 4, this.vertexCount * 2, this.vertexCount);
        }
      }
    }
    if (this._version[0] < 5) {
      if (this.compressedMesh.bindPoses.length > 0) {
        this.bindPose = [];
        let rawBindPoses = this.compressedMesh.bindPoses.unpack(16, 16 * 4);
        for (let i = 0; i < this.compressedMesh.bindPoses.length; i++) {
          this.bindPose.push(new Matrix4x4(rawBindPoses.slice(i * 16, (i + 1) * 16)));
        }
      }
    }
    if (this.compressedMesh.normals.length > 0) {
      let normalData = this.compressedMesh.normals.unpack(2, 4 * 2);
      let signs = this.compressedMesh.normalSigns.unpack();
      this.normals = [];
      for (let i = 0; i < this.compressedMesh.normals.length / 2; i++) {
        let x = normalData[i * 2];
        let y = normalData[i * 2 + 1];
        let zsqr = 1 - x * x - y * y;
        let z;
        if (zsqr >= 0) {
          z = Math.sqrt(zsqr);
        } else {
          z = 0;
          let normal = new Vector3(x, y, z);
          normal.normalize();
          x = normal.x;
          y = normal.y;
          z = normal.z;
        }
        if (signs[i] === 0) {
          z = -z;
        }
        this.normals[i * 3] = x;
        this.normals[i * 3 + 1] = y;
        this.normals[i * 3 + 2] = z;
      }
    }
    if (this.compressedMesh.tangents.length > 0) {
      let tangentData = this.compressedMesh.tangents.unpack(2, 4 * 2);
      let signs = this.compressedMesh.tangentSigns.unpack();
      this.tangents = [];
      for (let i = 0; i < this.compressedMesh.tangents.length / 2; i++) {
        let x = tangentData[i * 2];
        let y = tangentData[i * 2 + 1];
        let zsqr = 1 - x * x - y * y;
        let z;
        if (zsqr >= 0) {
          z = Math.sqrt(zsqr);
        } else {
          z = 0;
          let normal = new Vector3(x, y, z);
          normal.normalize();
          x = normal.x;
          y = normal.y;
          z = normal.z;
        }
        if (signs[i * 2] === 0) {
          z = -z;
        }
        let w = signs[i * 2 + 1] > 0 ? 1.0 : -1.0;
        this.tangents[i * 4] = x;
        this.tangents[i * 4 + 1] = y;
        this.tangents[i * 4 + 2] = z;
        this.tangents[i * 4 + 3] = w;
      }
    }
    if (this._version >= 5) {
      if (this.compressedMesh.floatColors.length > 0) {
        this.colors = this.compressedMesh.floatColors.unpack(1, 4);
      }
    }
    if (this.compressedMesh.weights.length > 0) {
      let weights = this.compressedMesh.weights.unpack();
      let boneIndices = this.compressedMesh.boneIndices.unpack();
      this.initMSkin();

      let bonePos = 0;
      let boneIndexPos = 0;
      let j = 0;
      let sum = 0;

      for (let i = 0; i < this.compressedMesh.weights.length; i++) {
        this.skin[bonePos].weight[j] = weights[i] / 31;
        this.skin[bonePos].boneIndex[j] = boneIndices[boneIndexPos++];
        j++;
        sum += weights[i];
        if (sum >= 31) {
          for (; j < 4; j++) {
            this.skin[bonePos].weight[j] = 0;
            this.skin[bonePos].boneIndex[j] = 0;
          }
          bonePos++;
          j = 0;
          sum = 0;
        } else if (j === 3) {
          this.skin[bonePos].weight[j] = (31 - sum) / 31;
          this.skin[bonePos].boneIndex[j] = boneIndices[boneIndexPos++];
          bonePos++;
          j = 0;
          sum = 0;
        }
      }
    }
    if (this.compressedMesh.triangles.length > 0) {
      this.indexBuffer = this.compressedMesh.triangles.unpack();
    }
    if (this.compressedMesh.colors.length > 0) {
      this.compressedMesh.colors.length *= 4;
      this.compressedMesh.colors.bitSize /= 4;
      let colors = this.compressedMesh.colors.unpack();
      this.colors = [];
      for (let i = 0; i < this.compressedMesh.colors.length / 4; i += 4) {
        this.colors.push([colors[i] / 0xFF, colors[i + 1] / 0xFF, colors[i + 2] / 0xFF, colors[i + 3] / 0xFF]);
      }
    }
  }

  getTriangles() {
    this.indices = [];
    for (let subMesh of this.subMeshes) {
      let firstIndex = subMesh.firstByte / 2;
      if (!this.use16BitIndices) {
        firstIndex /= 2;
      }
      let indexCount = subMesh.indexCount;
      let topology = subMesh.topology;
      if (topology === 'Triangles') {
        for (let i = 0; i < indexCount; i += 3) {
          this.indices.push(this.indexBuffer[firstIndex + i]);
          this.indices.push(this.indexBuffer[firstIndex + i + 1]);
          this.indices.push(this.indexBuffer[firstIndex + i + 2]);
        }
      } else if (this._version[0] < 4 || topology === 'TriangleStrip') {
        let triIndex = 0;
        for (let i = 0; i < indexCount - 2; i++) {
          let a = this.indexBuffer[firstIndex + i];
          let b = this.indexBuffer[firstIndex + i + 1];
          let c = this.indexBuffer[firstIndex + i + 2];

          if (a === b || a === c || b === c) {
            continue;
          }

          if ((i & 1) === 1) {
            this.indices.push(b);
            this.indices.push(a);
          } else {
            this.indices.push(a);
            this.indices.push(b);
          }
          this.indices.push(c);
          triIndex += 3;
        }
        subMesh.indexCount = triIndex;
      } else if (topology === 'Quads') {
        for (let i = 0; i < indexCount; i += 4) {
          this.indices.push(this.indexBuffer[firstIndex + i]);
          this.indices.push(this.indexBuffer[firstIndex + i + 1]);
          this.indices.push(this.indexBuffer[firstIndex + i + 2]);
          this.indices.push(this.indexBuffer[firstIndex + i]);
          this.indices.push(this.indexBuffer[firstIndex + i + 1]);
          this.indices.push(this.indexBuffer[firstIndex + i + 2]);
        }
        subMesh.indexCount = indexCount / 2 * 3;
      }
    }
  }

  initMSkin() {
    this.skin = [];
    for (let i = 0; i < this.vertexData.vertexCount; i++) {
      this.skin.push(new BoneWeights4());
    }
  }

  toGeometry() {
    const geometry = new THREE.BufferGeometry();
    let vertices = [];
    for (const vert of this.vertices) {
      vertices.push(vert[0], vert[1], vert[2]);
    }
    vertices = new Float32Array(vertices);

    let colors = [];
    for (const col of this.colors) {
      colors.push(col[0], col[1], col[2], col[3]);
    }
    colors = new Float32Array(colors);

    let uvs = [];
    for (const uv of this.uv0) {
      uvs.push(uv[0], uv[1]);
    }
    uvs = new Float32Array(uvs);

    geometry.setIndex(this.indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    return geometry;
  }

  async createPreview() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x606060);

    let mesh = new THREE.Mesh(this.toGeometry(), new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true
    }));
    let max = new THREE.Box3().setFromObject(mesh).max;
    let scale = 10 / max.z;
    mesh.rotation.set(-1.61443, 0, 0);
    mesh.position.set(0, -4, 0);
    mesh.scale.set(scale, scale, scale);

    scene.add(mesh);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 1000);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    const prev = $('#preview');
    renderer.setSize(prev.width(), prev.height());

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight1.position.set(5, 5, 7.5);

    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight2.position.set(-5, 5, 7.5);

    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight3.position.set(0, 5, -7.5);

    scene.add(dirLight3);

    const dirLight4 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight4.position.set(0, -7.5, -0);

    scene.add(dirLight4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    camera.position.set(0, 0, 30);

    let lastID = 0;
    const animate = () => {
      renderer.render(scene, camera);
      lastID = requestAnimationFrame(animate);
    }

    function onDestroy() {
      document.body.removeEventListener('destroy-preview', onDestroy);
      cancelAnimationFrame(lastID);
    }
    document.body.addEventListener('destroy-preview', onDestroy);

    animate();

    return renderer.domElement;
  }

  async getExport() {
    return new Promise(resolve => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(this.toGeometry(), new THREE.MeshBasicMaterial({color: '#000000'}));
      scene.add(mesh);

      const exporter = new GLTFExporter();
      exporter.parse(scene, gltf => {
        resolve(JSON.stringify(gltf));
      }, error => {
        console.error('Error in GLTF exporter:', error);
        resolve('Error in GLTF exporter');
      }, {});
    });
  }
}
