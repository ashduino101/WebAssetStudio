import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {KVPair} from "../basicTypes";

export class AssetInfo {
  exposedAttributes = [
    'preloadIndex',
    'preloadSize',
    'asset'
  ];

  constructor(reader) {
    this.preloadIndex = reader.readInt32();
    this.preloadSize = reader.readInt32();
    this.asset = new PPtr(reader);
  }
}

export class AssetBundle extends NamedObject {
  exposedAttributes = [
    'name',
    'preloadTable',
    'container',
  ];
  constructor(reader) {
    super(reader);
    let preloadTableSize = reader.readInt32();
    this.preloadTable = [];
    for (let i = 0; i < preloadTableSize; i++) {
      this.preloadTable.push(new PPtr(reader));
    }
    let containerSize = reader.readInt32();
    this.container = [];
    for (let i = 0; i < containerSize; i++) {
      let key = reader.readAlignedString();
      this.container.push(new KVPair(key, new AssetInfo(reader)));
    }
  }
}

export const PreloadData = AssetBundle;
