import {PackedFloatVector, PackedIntVector} from "./packedTypes";

export class CompressedMesh {
  constructor(reader) {
    this.vertices = new PackedFloatVector(reader);
    this.uv = new PackedFloatVector(reader);
    this.bindPoses = [];  // has length
    this.normals = new PackedFloatVector(reader);
    this.tangents = new PackedFloatVector(reader);
    this.weights = new PackedIntVector(reader);
    this.normalSigns = new PackedIntVector(reader);
    this.tangentSigns = new PackedIntVector(reader);
    this.colors = new PackedFloatVector(reader);
    this.boneIndices = new PackedIntVector(reader);
    this.triangles = new PackedIntVector(reader);
    this.uvInfo = reader.readUInt32();
  }
}
