import {Component} from "./component";
import {PPtr} from "./pptr";

export class Transform extends Component {
  static exposedAttributes = [
    'gameObject',
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

  mapChildren() {
    this.realChildren = [];
    for (let child of this.children) {
      child.resolve();
      if (child.object) {
        if (child.object instanceof Transform) {
          child.object.mapChildren();
          this.realChildren.push(child.object);
        }
      }
    }
  }

  getFather() {
    this.father.resolve();
    return this.father.object;
  }

  async createPreview() {
    this.mapChildren();
    console.log(this);
    console.log(this.getFather());
    return document.createElement('div');
  }
}