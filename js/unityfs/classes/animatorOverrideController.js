import {PPtr} from "./pptr";
import {NamedObject} from "./namedObject";

export class AnimationClipOverride {
  exposedAttributes = [
    'originalClip',
    'overrideClip',
  ];

  constructor(reader) {
    this.originalClip = new PPtr(reader);
    this.overrideClip = new PPtr(reader);
  }
}

export class AnimatorOverrideController extends NamedObject {
  exposedAttributes = [
    'name',
    'controller',
    'clips',
  ];

  constructor(reader) {
    super(reader);
    this.controller = new PPtr(reader);
    let numOverrides = reader.readInt32();
    this.clips = [];
    for (let i = 0; i < numOverrides; i++) {
      this.clips.push(new AnimationClipOverride(reader));
    }
  }
}
