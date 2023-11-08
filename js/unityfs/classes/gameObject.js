import {EditorExtension} from "./editorExtension";
import {PPtr} from "./pptr";
import {Transform} from "./transform";

export class GameObject extends EditorExtension {
  static exposedAttributes = [
    'components',
    'layer',
    'name'
  ]

  constructor(reader) {
    super(reader);
    let numComponents = reader.readInt32();
    this.components = [];
    for (let i = 0; i < numComponents; i++) {
      if (reader.versionLT(5, 5)) {
        reader.readInt32();
      }
      this.components.push(new PPtr(reader));
    }
    this.layer = reader.readInt32();
    this.name = reader.readAlignedString();
  }
}