import {NamedObject} from "./namedObject";

export class Texture extends NamedObject {
  constructor(reader) {
    super(reader);

    if (reader.versionGTE(2017, 3)) {
      this.forcedFallbackFormat = reader.readInt32();
      this.downscaleFallback = reader.readBool();
      if (reader.versionGTE(2020, 2)) {
        this.isAlphaChannelOptional = reader.readBool();
      }
      reader.align(4);
    }
  }
}