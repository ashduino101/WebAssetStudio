import {BaseType} from "./baseType";

export class Vector2 extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readFloat32();
    this.y = reader.readFloat32();
  }
}

export class Vector3 extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readFloat32();
    this.y = reader.readFloat32();
    this.z = reader.readFloat32();
  }
}

export class Vector4 extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readFloat32();
    this.y = reader.readFloat32();
    this.z = reader.readFloat32();
    this.w = reader.readFloat32();
  }
}

export class Matrix extends BaseType {
  constructor(reader) {
    super(reader);
    this.value = reader.readArrayT(reader.readFloat32.bind(reader), 16);
  }
}

export class Quaternion extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readFloat32();
    this.y = reader.readFloat32();
    this.z = reader.readFloat32();
    this.w = reader.readFloat32();
  }
}

export class Color extends BaseType {
  constructor(reader) {
    super(reader);
    this.red = reader.readUInt8();
    this.green = reader.readUInt8();
    this.blue = reader.readUInt8();
    this.alpha = reader.readUInt8();
  }
}

export class Plane extends BaseType {
  constructor(reader) {
    super(reader);
    this.normal = new Vector3(reader);
    this.d = reader.readFloat32();
  }
}

export class Point extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readInt32();
    this.y = reader.readInt32();
  }
}

export class Rectangle extends BaseType {
  constructor(reader) {
    super(reader);
    this.x = reader.readInt32();
    this.y = reader.readInt32();
    this.width = reader.readInt32();
    this.height = reader.readInt32();
  }
}

export class BoundingBox extends BaseType {
  constructor(reader) {
    super(reader);
    this.min = new Vector3(reader);
    this.max = new Vector3(reader);
  }
}

export class BoundingSphere extends BaseType {
  constructor(reader) {
    super(reader);
    this.center = new Vector3(reader);
    this.radius = reader.readFloat32();
  }
}

export class BoundingFrustum extends BaseType {
  constructor(reader) {
    super(reader);
    this.frustumMatrix = new Matrix(reader);
  }
}

export class Ray extends BaseType {
  constructor(reader) {
    super(reader);
    this.position = new Vector3(reader);
    this.direction = new Vector3(reader);
  }
}

class CurveKey {
  constructor(reader) {
    this.position = reader.readFloat32();
    this.value = reader.readFloat32();
    this.tangentIn = reader.readFloat32();
    this.tangentOut = reader.readFloat32();
    this.continuity = ['Smooth', 'Step'][reader.readInt32()];
  }
}

export class Curve extends BaseType {
  constructor(reader) {
    super(reader);
    const loopValues = [
      'Constant',
      'Cycle',
      'CycleOffset',
      'Oscillate',
      'Linear'
    ];
    this.preLoop = loopValues[reader.readInt32()];
    this.postLoop = loopValues[reader.readInt32()];
    this.keys = [];
    for (let i = 0; i < reader.readUInt32(); i++) {
      this.keys.push(new CurveKey(reader));
    }
  }
}
