import {NamedObject} from "./namedObject";

const PhysicCombine = {
  0: 'Average',
  1: 'Minimum',
  2: 'Maximum',
  3: 'Multiply'
}

export class PhysicMaterial extends NamedObject {
  static exposedAttributes = [
    'name',
    'dynamicFriction',
    'staticFriction',
    'bounciness',
    'frictionCombine',
    'bounceCombine'
  ];

  constructor(reader) {
    super(reader);
    this.dynamicFriction = reader.readFloat32();
    this.staticFriction = reader.readFloat32();
    this.bounciness = reader.readFloat32();
    this.frictionCombine = PhysicCombine[reader.readInt32()];
    this.bounceCombine = PhysicCombine[reader.readInt32()];
  }
}