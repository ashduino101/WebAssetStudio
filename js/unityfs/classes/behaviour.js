import {Component} from './component';

export class Behaviour extends Component {
  static exposedAttributes = [
    'gameObject',
    'enabled'
  ];

  constructor(reader) {
    super(reader);
    this.enabled = reader.readBool();
    reader.align(4);
  }
}