import {Renderer} from "./renderer";
import {PPtr} from "./pptr";

export class SkinnedMeshRenderer extends Renderer {
  exposedAttributes = [
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
    'sortingOrder',
    'quality',
    'updateWhenOffscreen',
    'skinNormals',
    'mesh',
    'bones',
    'blendShapeWeights'
  ];
  
  constructor(reader) {
    super(reader);
    this.quality = reader.readInt32();
    this.updateWhenOffscreen = reader.readBool();
    this.skinNormals = reader.readBool();
    reader.align(4);

    if (reader.version[0] === 2 && reader.version[1] < 6) {
      this.disableAnimationWhenOffscreen = new PPtr(reader);
    }
    this.mesh = new PPtr(reader);

    let numBones = reader.readInt32();
    this.bones = [];
    for (let i = 0; i < numBones; i++) {
      this.bones.push(new PPtr(reader));
    }
    if (reader.versionGTE(4, 3)) {
      this.blendShapeWeights = reader.readArrayT(() => reader.readFloat32(), reader.readUInt32());
    }
  }
}