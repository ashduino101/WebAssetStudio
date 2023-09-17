import {EditorExtension} from "./editorExtension";

export class NamedObject extends EditorExtension {
  static exposedAttributes = [
    'name'
  ];

  constructor(reader) {
    super(reader);
    this.name = reader.readAlignedString();
  }

  static getName(reader) {
    reader.seek(0);
    let name = reader.readAlignedString();
    reader.seek(0);
    return name;
  }
}
