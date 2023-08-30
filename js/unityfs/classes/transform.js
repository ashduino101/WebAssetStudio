import {Component} from "./component";
import {PPtr} from "./pptr";

export class Transform extends Component {
  exposedAttributes = [
    'localPosition',
    'localRotation',
    'localScale',
    'children',
    'father'
  ]

  constructor(reader) {
    super(reader);
    this.localRotation = reader.readQuaternion();
    this.localPosition = reader.readVector3();
    this.localScale = reader.readVector3();

    let numChildren = reader.readInt32();
    this.children = [];
    for (let i = 0; i < numChildren; i++) {
      this.children.push(new PPtr(reader));
    }
    this.father = new PPtr(reader);
  }
}