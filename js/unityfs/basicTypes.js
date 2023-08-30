export class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return `Vector2(${this.x}, ${this.y})`;
  }
}

export class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  toString() {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }
}

export class Vector4 {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  toString() {
    return `Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }
}

export class Quaternion {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  getIndex(i) {
    return this[['x', 'y', 'z', 'w'][i]];
  }

  setIndex(i, value) {
    this[['x', 'y', 'z', 'w'][i]] = value;
  }

  toString() {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }
}

export class Color {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  toString() {
    return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

export class Matrix4x4 {
  constructor(values) {
    this.values = values;
  }

  get(x, y) {
    return this.values[y + x * 4];
  }

  toString() {
    return `Matrix4x4<>`;  // tbd
  }
}

export class KVPair {
  exposedAttributes = [
    'key',
    'value'
  ]
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}
