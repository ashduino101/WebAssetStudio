import {Behaviour} from './behaviour';
import {PPtr} from './pptr';

export class Animation extends Behaviour {
  static exposedAttributes = [
    'gameObject',
    'enabled',
    'animations'
  ]

  constructor(reader) {
    super(reader);
    let numAnimations = reader.readUInt32();
    this.animations = [];
    for (let i = 0; i < numAnimations; i++) {
      this.animations.push(new PPtr(reader));
    }
  }
}