import {Renderer} from "./renderer";
import {PPtr} from "./pptr";

export class MeshRenderer extends Renderer {
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
    'sortingOrder',
    'additionalVertexStreams'
  ];

  constructor(reader) {
    super(reader);
    this.additionalVertexStreams = new PPtr(reader);
  }
}