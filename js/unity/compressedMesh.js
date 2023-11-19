import {PackedFloatVector, PackedIntVector} from "./packedTypes";

export class CompressedMesh {
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
    this.colors = [];
    if (reader.version[0] >= 5) {
      this.colors = new PackedFloatVector(reader);
    }
    this.boneIndices = new PackedIntVector(reader);
    this.triangles = new PackedIntVector(reader);
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