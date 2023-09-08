import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {KVPair} from "../basicTypes";
import {decompressBlock} from "lz4js";

export class VectorParameter {
  exposedAttributes = [
    'nameIndex',
    'index',
    'arraySize',
    'type',
    'dim'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    this.arraySize = reader.readInt32();
    this.type = reader.readInt8();
    this.dim = reader.readInt8();
    reader.align(4);
  }
}

export class MatrixParameter {
  exposedAttributes = [
    'nameIndex',
    'index',
    'arraySize',
    'type',
    'rowCount'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    this.arraySize = reader.readInt32();
    this.type = reader.readInt8();
    this.rowCount = reader.readInt8();
    reader.align(4);
  }
}

export class StructParameter {
  exposedAttributes = [
    'nameIndex',
    'index',
    'arraySize',
    'structSize',
    'vectorParams',
    'matrixParams'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    this.arraySize = reader.readInt32();
    this.structSize = reader.readInt32();

    let numVectorParams = reader.readInt32();
    this.vectorParams = [];
    for (let i = 0; i < numVectorParams; i++) {
      this.vectorParams.push(new VectorParameter(reader));
    }

    let numMatrixParams = reader.readInt32();
    this.matrixParams = [];
    for (let i = 0; i < numMatrixParams; i++) {
      this.matrixParams.push(new MatrixParameter(reader));
    }
  }
}

export class SamplerParameter {
  exposedAttributes = [
    'sampler',
    'bindPoint'
  ];

  constructor(reader) {
    this.sampler = reader.readUInt32();
    this.bindPoint = reader.readInt32();
  }
}

export const TextureDimension = {
  '-1': 'Unknown',
  0: 'None',
  1: 'Any',
  2: 'Texture2D',
  3: 'Texture3D',
  4: 'Cube',
  5: 'Texture2DArray',
  6: 'CubeArray'
}

export class SerializedTextureProperty {
  exposedAttributes = [
    'defaultName',
    'textureDimension'
  ];

  constructor(reader) {
    this.defaultName = reader.readAlignedString();
    this.textureDimension = TextureDimension[reader.readInt32()];
  }
}

export const SerializedPropertyType = {
  0: 'Color',
  1: 'Vector',
  2: 'Float',
  3: 'Range',
  4: 'Texture',
  5: 'Int'
}

export class SerializedProperty {
  exposedAttributes = [
    'name',
    'description',
    'attributes',
    'type',
    'flags',
    'defaultValue',
    'defaultTexture'
  ];

  constructor(reader) {
    this.name = reader.readAlignedString();
    this.description = reader.readAlignedString();
    this.attributes = reader.readArrayT(() => reader.readAlignedString(), reader.readInt32());
    this.type = SerializedPropertyType[reader.readInt32()];
    this.flags = reader.readUInt32();
    this.defaultValue = reader.readArrayT(() => reader.readFloat32(), 4);
    this.defaultTexture = new SerializedTextureProperty(reader);
  }
}

export class SerializedProperties {
  exposedAttributes = [
    'properties'
  ];

  constructor(reader) {
    let numProps = reader.readInt32();
    this.properties = [];
    for (let i = 0; i < numProps; i++) {
      this.properties.push(new SerializedProperty(reader));
    }
  }
}

export class SerializedShaderFloatValue {
  exposedAttributes = [
    'name',
    'value'
  ];

  constructor(reader) {
    this.value = reader.readFloat32();
    this.name = reader.readAlignedString();
  }
}

export class SerializedShaderRTBlendState {
  exposedAttributes = [
    'sourceBlend',
    'destinationBlend',
    'sourceBlendAlpha',
    'destinationBlendAlpha',
    'blendOperation',
    'blendOperationAlpha',
    'colorMask'
  ];

  constructor(reader) {
    this.sourceBlend = new SerializedShaderFloatValue(reader);
    this.destinationBlend = new SerializedShaderFloatValue(reader);
    this.sourceBlendAlpha = new SerializedShaderFloatValue(reader);
    this.destinationBlendAlpha = new SerializedShaderFloatValue(reader);
    this.blendOperation = new SerializedShaderFloatValue(reader);
    this.blendOperationAlpha = new SerializedShaderFloatValue(reader);
    this.colorMask = new SerializedShaderFloatValue(reader);
  }
}

export class SerializedStencilOp {
  exposedAttributes = [
    'pass',
    'fail',
    'zFail',
    'comp'
  ];

  constructor(reader) {
    this.pass = new SerializedShaderFloatValue(reader);
    this.fail = new SerializedShaderFloatValue(reader);
    this.zFail = new SerializedShaderFloatValue(reader);
    this.comp = new SerializedShaderFloatValue(reader);
  }
}

export class SerializedShaderVectorValue {
  exposedAttributes = [
    'name',
    'x',
    'y',
    'z',
    'w'
  ]
  constructor(reader) {
    this.x = new SerializedShaderFloatValue(reader);
    this.y = new SerializedShaderFloatValue(reader);
    this.z = new SerializedShaderFloatValue(reader);
    this.w = new SerializedShaderFloatValue(reader);
    this.name = reader.readAlignedString();
  }
}

export class SerializedTagMap {
  exposedAttributes = [
    'tags'
  ];

  constructor(reader) {
    let numTags = reader.readInt32();
    this.tags = [];
    for (let i = 0; i < numTags; i++) {
      let key = reader.readAlignedString();
      this.tags.push(new KVPair(key, reader.readAlignedString()));
    }
  }
}

export const FogMode = {
  '-1': 'Unknown',
  0: 'Disabled',
  1: 'Linear',
  2: 'Exponential',
  3: 'Exponential2'
}

export class SerializedShaderState {
  exposedAttributes = [
    'name',
    'rtBlend',
    'rtSeparateBlend',
    'zTest',
    'zWrite',
    'culling',
    'offsetFactor',
    'offsetUnits',
    'alphaToMask',
    'stencilOp',
    'stencilOpFront',
    'stencilOpBack',
    'stencilReadMask',
    'stencilWriteMask',
    'stencilRef',
    'fogStart',
    'fogEnd',
    'fogDensity',
    'fogColor',
    'fogMode',
    'gpuProgramID',
    'tags',
    'lod',
    'lighting'
  ];

  constructor(reader) {
    this.name = reader.readAlignedString();
    this.rtBlend = [];
    for (let i = 0; i < 8; i++) {
      this.rtBlend.push(new SerializedShaderRTBlendState(reader));
    }
    this.rtSeparateBlend = reader.readBool();
    reader.align(4);
    if (reader.versionGTE(2017, 2)) {
      this.zClip = new SerializedShaderFloatValue(reader);
    }
    this.zTest = new SerializedShaderFloatValue(reader);
    this.zWrite = new SerializedShaderFloatValue(reader);
    this.culling = new SerializedShaderFloatValue(reader);
    if (reader.version[0] >= 2020) {
      this.conservative = new SerializedShaderFloatValue(reader);
    }
    this.offsetFactor = new SerializedShaderFloatValue(reader);
    this.offsetUnits = new SerializedShaderFloatValue(reader);
    this.alphaToMask = new SerializedShaderFloatValue(reader);
    this.stencilOp = new SerializedStencilOp(reader);
    this.stencilOpFront = new SerializedStencilOp(reader);
    this.stencilOpBack = new SerializedStencilOp(reader);
    this.stencilReadMask = new SerializedShaderFloatValue(reader);
    this.stencilWriteMask = new SerializedShaderFloatValue(reader);
    this.stencilRef = new SerializedShaderFloatValue(reader);
    this.fogStart = new SerializedShaderFloatValue(reader);
    this.fogEnd = new SerializedShaderFloatValue(reader);
    this.fogDensity = new SerializedShaderFloatValue(reader);
    this.fogColor = new SerializedShaderVectorValue(reader);
    this.fogMode = FogMode[reader.readInt32()];
    this.gpuProgramID = reader.readInt32();
    this.tags = new SerializedTagMap(reader);
    this.lod = reader.readInt32();
    this.lighting = reader.readBool();
    reader.align(4);
  }
}

export class ShaderBindChannel {
  exposedAttributes = [
    'source',
    'target'
  ];

  constructor(reader) {
    this.source = reader.readInt8();
    this.target = reader.readInt8();
  }
}

export class ParserBindChannels {
  exposedAttributes = [
    'channels',
    'sourceMap'
  ];

  constructor(reader) {
    let numChannels = reader.readInt32();
    this.channels = [];
    for (let i = 0; i < numChannels; i++) {
      this.channels.push(new ShaderBindChannel(reader));
    }
    reader.align(4);
    this.sourceMap = reader.readUInt32();
  }
}

export class TextureParameter {
  exposedAttributes = [
    'nameIndex',
    'index',
    'samplerIndex',
    'dim'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    this.samplerIndex = reader.readInt32();
    if (reader.versionGTE(2017, 3)) {
      this.multiSampled = reader.readBool();
    }
    this.dim = reader.readInt8();
    reader.align(4);
  }
}

export class BufferBinding {
  exposedAttributes = [
    'nameIndex',
    'index'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    if (reader.version[0] >= 2020) {
      this.arraySize = reader.readInt32();
    }
  }
}

export class ConstantBuffer {
  exposedAttributes = [
    'nameIndex',
    'matrixParams',
    'vectorParams',
    'size'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    let numMatrixParams = reader.readInt32();
    this.matrixParams = [];
    for (let i = 0; i < numMatrixParams; i++) {
      this.matrixParams.push(new MatrixParameter(reader));
    }

    let numVectorParams = reader.readInt32();
    this.vectorParams = [];
    for (let i = 0; i < numVectorParams; i++) {
      this.vectorParams.push(new VectorParameter(reader));
    }

    if (reader.versionGTE(2017, 3)) {
      let numStructParams = reader.readInt32();
      this.structParams = [];
      for (let i = 0; i < numStructParams; i++) {
        this.structParams.push(new StructParameter(reader));
      }
    }

    this.size = reader.readInt32();

    const version = reader.version;
    if (
      (version[0] === 2020 && version[1] > 3) ||
      (version[0] === 2020 && version[1] === 3 && version[2] >= 2) ||
      (version[0] > 2021) ||
      (version[0] === 2021 && version[1] > 1) ||
      (version[0] === 2021 && version[1] === 1 && version[2] >= 4)
    ) {
      this.isPartialCB = reader.readBool();
      reader.align(4);
    }
  }
}

export class UAVParameter {
  exposedAttributes = [
    'nameIndex',
    'index',
    'originalIndex'
  ];

  constructor(reader) {
    this.nameIndex = reader.readInt32();
    this.index = reader.readInt32();
    this.originalIndex = reader.readInt32();
  }
}

export const ShaderGpuProgramType = {
  0: 'Unknown',
  1: 'GLLegacy',
  2: 'GLES31AEP',
  3: 'GLES31',
  4: 'GLES3',
  5: 'GLES',
  6: 'GLCore32',
  7: 'GLCore41',
  8: 'GLCore43',
  9: 'DX9VertexSM20',
  10: 'DX9VertexSM30',
  11: 'DX9PixelSM20',
  12: 'DX9PixelSM30',
  13: 'DX10Level9Vertex',
  14: 'DX10Level9Pixel',
  15: 'DX11VertexSM40',
  16: 'DX11VertexSM50',
  17: 'DX11PixelSM40',
  18: 'DX11PixelSM50',
  19: 'DX11GeometrySM40',
  20: 'DX11GeometrySM50',
  21: 'DX11HullSM50',
  22: 'DX11DomainSM50',
  23: 'MetalVS',
  24: 'MetalFS',
  25: 'SPIRV',
  26: 'ConsoleVS',
  27: 'ConsoleFS',
  28: 'ConsoleHS',
  29: 'ConsoleDS',
  30: 'ConsoleGS',
  31: 'RayTracing',
  32: 'PS5NGGC'
}

export class SerializedProgramParameters {
  exposedAttributes = [
    'vectorParams',
    'matrixParams',
    'textureParams',
    'bufferBindings',
    'constantBuffers',
    'constantBufferBindings',
    'uavParams'
  ];

  constructor(reader) {
    let numVectorParams = reader.readInt32();
    this.vectorParams = [];
    for (let i = 0; i < numVectorParams; i++) {
      this.vectorParams.push(new VectorParameter(reader));
    }

    let numMatrixParams = reader.readInt32();
    this.matrixParams = [];
    for (let i = 0; i < numMatrixParams; i++) {
      this.matrixParams.push(new MatrixParameter(reader));
    }

    let numTextureParams = reader.readInt32();
    this.textureParams = [];
    for (let i = 0; i < numTextureParams; i++) {
      this.textureParams.push(new TextureParameter(reader));
    }

    let numBufferBindings = reader.readInt32();
    this.bufferBindings = [];
    for (let i = 0; i < numBufferBindings; i++) {
      this.bufferBindings.push(new BufferBinding(reader));
    }

    let numConstantBuffers = reader.readInt32();
    this.constantBuffers = [];
    for (let i = 0; i < numConstantBuffers; i++) {
      this.constantBuffers.push(new ConstantBuffer(reader));
    }

    let numConstantBufferBindings = reader.readInt32();
    this.constantBufferBindings = [];
    for (let i = 0; i < numConstantBufferBindings; i++) {
      this.constantBufferBindings.push(new BufferBinding(reader));
    }

    let numUAVParams = reader.readInt32();
    this.uavParams = [];
    for (let i = 0; i < numUAVParams; i++) {
      this.uavParams.push(new UAVParameter(reader));
    }

    if (reader.version[0] >= 2017) {
      let numSamplers = reader.readInt32();
      this.samplers = [];
      for (let i = 0; i < numSamplers; i++) {
        this.samplers.push(new SamplerParameter(reader));
      }
    }
  }
}

export class SerializedSubProgram {
  exposedAttributes = [
    'blobIndex',
    'channels',
    'shaderHardwareTier',
    'gpuProgramType',
    'parameters'
  ];
  constructor(reader) {
    this.blobIndex = reader.readUInt32();
    this.channels = new ParserBindChannels(reader);

    const version = reader.version;
    if ((version[0] >= 2019 && version[0] < 2021) || (version[0] === 2021 && version[1] < 2)) {
      this.globalKeywordIndices = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
      reader.align(4);
      this.localKeywordIndices = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
      reader.align(4);
    } else {
      this.keywordIndices = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
      if (version[0] >= 2017) {
        reader.align(4);
      }
    }

    this.shaderHardwareTier = reader.readInt8();
    this.gpuProgramType = ShaderGpuProgramType[reader.readInt8()];
    reader.align(4);

    this.parameters = new SerializedProgramParameters(reader);  // optimized based on original code

    if (reader.versionGTE(2017, 2)) {
      if (version[0] >= 2021) {
        this.shaderRequirements = Number(reader.readInt64());
      } else {
        this.shaderRequirements = reader.readInt32();
      }
    }
  }
}

export class SerializedProgram {
  exposedAttributes = [
    'subPrograms'
  ];

  constructor(reader) {
    let numSubPrograms = reader.readInt32();
    this.subPrograms = [];
    for (let i = 0; i < numSubPrograms; i++) {
      this.subPrograms.push(new SerializedSubProgram(reader));
    }

    const version = reader.version;
    if (
      (version[0] === 2020 && version[1] > 3) ||
      (version[0] === 2020 && version[1] === 3 && version[2] >= 2) ||
      (version[0] > 2021) ||
      (version[0] === 2021 && version[1] > 1) ||
      (version[0] === 2021 && version[1] === 1 && version[2] >= 1)
    ) {
      this.commonParameters = new SerializedProgramParameters(reader);
    }

    if (reader.versionGTE(2022, 1)) {
      this.serializedKeywordStateMask = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
      reader.align(4);
    }
  }
}

export const PassType = {
  0: 'Normal',
  1: 'Use',
  2: 'Grab'
}

export class SerializedPass {
  exposedAttributes = [
    'nameIndices',
    'type',
    'state',
    'programMask',
    'progVertex',
    'progFragment',
    'progGeometry',
    'progHull',
    'progDomain',
    'hasInstancingVariant',
    'useName',
    'name',
    'textureName',
    'tags'
  ];

  constructor(reader) {
    if (reader.versionGTE(2020, 2)) {
      let numEditorDataHashes = reader.readInt32();
      this.editorDataHashes = [];
      for (let i = 0; i < numEditorDataHashes; i++) {
        this.editorDataHashes.push(reader.read(16));
      }
      reader.align(4);
      this.platforms = reader.read(reader.readUInt32());
      reader.align(4);
      if (reader.versionLT(2021, 2)) {
        this.localKeywordMask = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
        reader.align(4);
        this.globalKeywordMask = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
        reader.align(4);
      }
    }

    let numIndices = reader.readInt32();
    this.nameIndices = []
    for (let i = 0; i < numIndices; i++) {
      let key = reader.readAlignedString();
      this.nameIndices.push(new KVPair(key, reader.readInt32()));
    }

    this.type = PassType[reader.readInt32()];
    this.state = new SerializedShaderState(reader);
    this.programMask = reader.readUInt32();
    this.progVertex = new SerializedProgram(reader);
    this.progFragment = new SerializedProgram(reader);
    this.progGeometry = new SerializedProgram(reader);
    this.progHull = new SerializedProgram(reader);
    this.progDomain = new SerializedProgram(reader);
    if (reader.versionGTE(2019, 3)) {
      this.progRayTracing = new SerializedProgram(reader);
    }
    this.hasInstancingVariant = reader.readBool();
    if (reader.version[0] >= 2018) {
      this.hasProceduralInstancingVariant = reader.readBool();
    }
    reader.align(4);
    this.useName = reader.readAlignedString();
    this.name = reader.readAlignedString();
    this.textureName = reader.readAlignedString();
    this.tags = new SerializedTagMap(reader);
    if (reader.version[0] === 2021 && reader.version[1] >= 2) {
      this.serializedKeywordStateMask = reader.readArrayT(() => reader.readUInt16(), reader.readInt32());
      reader.align(4);
    }
  }
}

export class SerializedSubShader {
  exposedAttributes = [
    'passes',
    'tags',
    'lod'
  ];

  constructor(reader) {
    let numPasses = reader.readInt32();
    this.passes = [];
    for (let i = 0; i < numPasses; i++) {
      this.passes.push(new SerializedPass(reader));
    }

    this.tags = new SerializedTagMap(reader);
    this.lod = reader.readInt32();
  }
}

export class SerializedShaderDependency {
  exposedAttributes = [
    'from',
    'to'
  ];

  constructor(reader) {
    this.from = reader.readAlignedString();
    this.to = reader.readAlignedString();
  }
}

export class SerializedCustomEditorForRenderPipeline {
  exposedAttributes = [
    'customEditorName',
    'renderPipelineType'
  ];

  constructor(reader) {
    this.customEditorName = reader.readAlignedString();
    this.renderPipelineType = reader.readAlignedString();
  }
}

export class SerializedShader {
  exposedAttributes = [
    'propInfo',
    'subShaders',
    'name',
    'customName',
    'fallbackName',
    'dependencies',
    'disableNoSubshadersMessage'
  ];

  constructor(reader) {
    this.propInfo = new SerializedProperties(reader);

    let numSubShaders = reader.readInt32();
    this.subShaders = [];
    for (let i = 0; i < numSubShaders; i++) {
      this.subShaders.push(new SerializedSubShader(reader));
    }

    if (reader.versionGTE(2021, 2)) {
      this.keywordNames = reader.readArrayT(() => reader.readAlignedString(), reader.readUInt32());
      this.keywordFlags = reader.read(reader.readUInt32());
      reader.align(4);
    }

    this.name = reader.readAlignedString();
    this.customName = reader.readAlignedString();
    this.fallbackName = reader.readAlignedString();

    let numDeps = reader.readInt32();
    this.dependencies = [];
    for (let i = 0; i < numDeps; i++) {
      this.dependencies.push(new SerializedShaderDependency(reader));
    }

    if (reader.version[0] >= 2021) {
      let numCustomEditorsForRenderPipelines = reader.readInt32();
      this.customEditorsForRenderPipelines = [];
      for (let i = 0; i < numCustomEditorsForRenderPipelines; i++) {
        this.customEditorsForRenderPipelines.push(new SerializedCustomEditorForRenderPipeline(reader));
      }
    }

    this.disableNoSubshadersMessage = reader.readBool();
    reader.align(4);
  }
}

export const ShaderCompilerPlatform = {
  '-1': 'None',
  0: 'GL',
  1: 'D3D9',
  2: 'Xbox360',
  3: 'PS3',
  4: 'D3D11',
  5: 'GLES20',
  6: 'NaCl',
  7: 'Flash',
  8: 'D3D11_9x',
  9: 'GLES3Plus',
  10: 'PSP2',
  11: 'PS4',
  12: 'XboxOne',
  13: 'PSM',
  14: 'Metal',
  15: 'OpenGLCore',
  16: 'N3DS',
  17: 'WiiU',
  18: 'Vulkan',
  19: 'Switch',
  20: 'XboxOneD3D12',
  21: 'GameCoreXboxOne',
  22: 'GameCoreScarlett',
  23: 'PS5',
  24: 'PS5NGGC',
}

export class Shader extends NamedObject {
  exposedAttributes = [
    'parsedForm',
    'platforms',
    'offsets',
    'compressedLengths',
    'decompressedLengths',
    'dependencies',
    'shaderIsBaked'
  ];
  exportExtension = '.shader';

  constructor(reader) {
    super(reader);
    if (reader.versionGTE(5, 5)) {
      this.parsedForm = new SerializedShader(reader);
      this.platforms = reader.readArrayT(() => ShaderCompilerPlatform[reader.readInt32()], reader.readUInt32());
      if (reader.versionGTE(2019, 3)) {
        this.offsets = reader.readArrayT(() => reader.readArrayT(() => reader.readUInt32(), reader.readUInt32()), reader.readUInt32());
        this.compressedLengths = reader.readArrayT(() => reader.readArrayT(() => reader.readUInt32(), reader.readUInt32()), reader.readUInt32());
        this.decompressedLengths = reader.readArrayT(() => reader.readArrayT(() => reader.readUInt32(), reader.readUInt32()), reader.readUInt32());
      } else {
        this.offsets = reader.readArrayT(() => [reader.readUInt32()], reader.readUInt32());
        this.compressedLengths = reader.readArrayT(() => [reader.readUInt32()], reader.readUInt32());
        this.decompressedLengths = reader.readArrayT(() => [reader.readUInt32()], reader.readUInt32());
      }
      this.compressedBlob = reader.read(reader.readUInt32());
      reader.align(4);

      let numDeps = reader.readInt32();
      this.dependencies = [];
      for (let i = 0; i < numDeps; i++) {
        this.dependencies.push(new PPtr(reader));
      }

      if (reader.version[0] >= 2018) {
        let numNonModifiableTextures = reader.readInt32();
        this.nonModifiableTextures = {};
        for (let i = 0; i < numNonModifiableTextures; i++) {
          let key = reader.readAlignedString();
          this.nonModifiableTextures[key] = new PPtr(reader);
        }
      }

      this.shaderIsBaked = reader.readBool();
      reader.align(4);
    } else {
      this.script = reader.read(reader.readUInt32());
      reader.align(4);
      this.pathName = reader.readAlignedString();
      if (reader.version[0] === 5 && reader.version[1] >= 3) {
        this.decompressedSize = reader.readUInt32();
        this.subProgramBlob = reader.read(reader.readUInt32());
      }
    }
  }

  async getExport() {
    let uncompressedSize = 0;
    for (let s of this.decompressedLengths) {
      for (let v of s) {
        uncompressedSize += s;
      }
    }
    let dst = new Uint8Array(uncompressedSize);
    decompressBlock(this.compressedBlob, dst, 0, uncompressedSize, 0);
    return dst;
  }
}
