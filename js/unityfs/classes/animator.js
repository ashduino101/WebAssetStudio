import {Behaviour} from './behaviour';
import {PPtr} from "./pptr";

export class Animator extends Behaviour {
  exposedAttributes = [
    'gameObject',
    'enabled',
    'avatar',
    'controller',
    'cullingMode',
    'updateMode',
    'applyRootMotion',
    'linearVelocityBlending',
    'hasTransformHierarchy',
    'allowConstantClipSamplingOptimization',
  ];

  constructor(reader) {
    super(reader);
    this.avatar = new PPtr(reader);
    this.controller = new PPtr(reader);
    this.cullingMode = reader.readInt32();

    if (reader.versionGTE(4, 5)) {
      this.updateMode = reader.readInt32();
    }

    this.applyRootMotion = reader.readBool();
    if (reader.version[0] === 4 && reader.version[1] >= 5) {
      reader.align(4);
    }

    if (reader.version[0] >= 5) {
      this.linearVelocityBlending = reader.readBool();
      if (reader.versionGTE(2021, 2)) {
        this.stabilizeFeet = reader.readBool();
      }
      reader.align(4);
    }

    if (reader.versionLT(4, 5)) {
      this.animatePhysics = reader.readBool();
    }
    if (reader.versionGTE(4, 3)) {
      this.hasTransformHierarchy = reader.readBool();
    }
    if (reader.versionGTE(4, 5)) {
      this.allowConstantClipSamplingOptimization = reader.readBool();
    }
    if (reader.version[0] >= 5 && reader.version[0] < 2018) {
      reader.align(4);
    }
    if (reader.version[0] >= 2018) {
      this.keepAnimatorControllerStateOnDisable = reader.readBool();
      reader.align(4);
    }
  }
}