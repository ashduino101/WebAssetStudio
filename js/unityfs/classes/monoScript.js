import {NamedObject} from "./namedObject";

export class MonoScript extends NamedObject {
  static exposedAttributes = [
    'name',
    'executionOrder',
    'propertiesHash',
    'className',
    'namespace',
    'assemblyName'
  ];

  constructor(reader) {
    super(reader);
    if (reader.versionGTE(3, 4)) {
      this.executionOrder = reader.readInt32();
    }
    if (reader.version[0] < 5) {
      this.propertiesHash = reader.readUInt32();
    } else {
      this.propertiesHash = [...reader.read(16)].map(i => i.toString(16).padStart(2, '0')).join('');
    }
    if (reader.version[0] < 3) {
      this.pathName = reader.readAlignedString();
    }
    this.className = reader.readAlignedString();
    if (reader.version[0] >= 3) {
      this.namespace = reader.readAlignedString();
    }
    this.assemblyName = reader.readAlignedString();
    if (reader.versionLT(2018, 2)) {
      this.isEditorScript = reader.readBool();
    }
  }
}