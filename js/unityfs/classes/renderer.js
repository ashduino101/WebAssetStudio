import {Component} from "./component";
import {PPtr} from "./pptr";

export class StaticBatchInfo {
  static exposedAttributes = [
    'firstSubMesh',
    'subMeshCount'
  ];

  constructor(reader) {
    this.firstSubMesh = reader.readUInt16();
    this.subMeshCount = reader.readUInt16();
  }
}

export class Renderer extends Component {
  static exposedAttributes = [
    'gameObject',
    'enabled',
    'castShadows',
    'receiveShadows',
    'motionVectors',
    'lightProbeUsage',
    'reflectionProbeUsage',
    'lightmapIndex',
    'lightmapIndexDynamic',
    'lightmapTilingOffset',
    'lightmapTilingOffsetDynamic',
    'materials',
    'staticBatchInfo',
    'staticBatchRoot',
    'probeAnchor',
    'lightProbeVolumeOverride',
    'sortingLayerID',
    'sortingOrder'
  ];

  constructor(reader) {
    super(reader);
    if (reader.version[0] < 5) {
      this.enabled = reader.readBool();
      this.castShadows = reader.readBool();
      this.receiveShadows = reader.readBool();
      this.lightmapIndex = reader.read(1)[0]
    } else {
      if (reader.versionGTE(5, 4)) {
        this.enabled = reader.readBool();
        this.castShadows = reader.read(1)[0];
        this.receiveShadows = reader.read(1)[0];
        if (reader.versionGTE(2017, 2)) {
          this.dynamicOccludee = reader.read(1)[0];
        }
        if (reader.version[0] >= 2021) {
          this.staticShadowCaster = reader.read(1)[0];
        }
        this.motionVectors = reader.read(1)[0];
        this.lightProbeUsage = reader.read(1)[0];
        this.reflectionProbeUsage = reader.read(1)[0];
        if (reader.versionGTE(2019, 3)) {
          this.rayTracingMode = reader.read(1)[0];
        }
        if (reader.version[0] >= 2020) {
          this.rayTraceProcedural = reader.read(1)[0];
        }
        reader.align(4);
      } else {
        this.enabled = reader.readBool();
        reader.align(4);
        this.castShadows = reader.read(1)[0];
        this.receiveShadows = reader.readBool();
        reader.align(4);
      }

      if (reader.version[0] >= 2018) {
        this.renderingLayerMask = reader.readInt32();
      }
      if (reader.versionGTE(2018, 3)) {
        this.rendererPriority = reader.readInt32();
      }
      this.lightmapIndex = reader.readInt16();
      this.lightmapIndexDynamic = reader.readInt16();
    }
    if (reader.version[0] >= 3) {
      this.lightmapTilingOffset = reader.readVector4();
    }
    if (reader.version[0] >= 5) {
      this.lightmapTilingOffsetDynamic = reader.readVector4();
    }

    let numMaterials = reader.readInt32();
    this.materials = [];
    for (let i = 0; i < numMaterials; i++) {
      this.materials.push(new PPtr(reader));
    }

    if (reader.version[0] < 3) {
      this.lightmapTilingOffset = reader.readVector4();
    } else {
      if (reader.versionGTE(5, 5)) {
        this.staticBatchInfo = new StaticBatchInfo(reader);
      } else {
        this.subsetIndices = reader.readArrayT(reader.readUInt32, reader.readUInt32());
      }
      this.staticBatchRoot = new PPtr(reader);
    }

    if (reader.versionGTE(5, 4)) {
      this.probeAnchor = new PPtr(reader);
      this.lightProbeVolumeOverride = new PPtr(reader);
    } else if (reader.versionGTE(3, 5)) {
      this.useLightProbes = reader.readBool();
      reader.align(4);
      if (reader.version[0] > 5) {
        this.reflectionProbeUsage = reader.readInt32();
      }
      this.lightProbeAnchor = new PPtr(reader);
    }
    if (reader.versionGTE(4, 3)) {
      if (reader.version[0] === 4 && reader.version[1] === 3) {
        this.sortingLayer = reader.readInt16();
      } else {
        this.sortingLayerID = reader.readUInt32();
      }
      this.sortingOrder = reader.readInt16();
      reader.align(4);
    }
  }
}