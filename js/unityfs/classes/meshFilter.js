import {Component} from "./component";
import {PPtr} from "./pptr";

export class MeshFilter extends Component {
  static exposedAttributes = [
    'gameObject',
    'mesh'
  ];

  constructor(reader) {
    super(reader);
    this.mesh = new PPtr(reader);
  }
}