import {Component} from "./component";

export class CanvasRenderer extends Component {
  exposedAttributes = [
    'gameObject',
    'cullTransparentMesh'
  ]

  constructor(reader) {
    super(reader);
    this.cullTransparentMesh = reader.readBool();
  }
}