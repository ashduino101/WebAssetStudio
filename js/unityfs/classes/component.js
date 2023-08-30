import {EditorExtension} from "./editorExtension";
import {PPtr} from "./pptr";

export class Component extends EditorExtension {
  exposedAttributes = [
    'gameObject'
  ]

  constructor(reader) {
    super(reader);
    this.gameObject = new PPtr(reader);
  }
}