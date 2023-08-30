import {UnityObject} from "./object";
import {PPtr} from "./pptr";

export class EditorExtension extends UnityObject {
  constructor(reader) {
    super(reader);
    if (reader.platform === 'No Target') {
      this.prefabParentObject = new PPtr(reader);
      this.prefabInternal = new PPtr(reader);
    }
  }
}