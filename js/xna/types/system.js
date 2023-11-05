// Excluding some types which are defined in xnbFile.js
export class TimeSpan {
  constructor(reader) {
    this.tickCount = reader.readInt64();
  }
}

export class DateTime {
  constructor(reader) {
    this.value = reader.readInt64();
  }
}

export class Decimal {
  constructor(reader) {
    this.v1 = reader.readUInt32();
    this.v2 = reader.readUInt32();
    this.v3 = reader.readUInt32();
    this.v4 = reader.readUInt32();
  }
}

export class ExternalReference {
  constructor(reader) {
    this.assetName = reader.readVarString();
  }
}
