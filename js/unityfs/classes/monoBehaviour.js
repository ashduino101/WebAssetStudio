import {Behaviour} from "./behaviour";
import {PPtr} from "./pptr";

export class MonoBehaviour extends Behaviour {
  exposedAttributes = [
    'enabled',
    'script',
    'name',
  ];
  constructor(reader) {
    super(reader);
    this.script = new PPtr(reader);
    this.name = reader.readAlignedString();
  }
}