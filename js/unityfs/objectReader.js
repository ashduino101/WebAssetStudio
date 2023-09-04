import {BinaryReader} from "./binaryReader";

export class ObjectReader extends BinaryReader {
  constructor(data, version, unityVersion, platform, pathID, offset, length, classID, typeID) {
    super(data);
    this.fileVersion = version;
    this.rawVersion = unityVersion;
    this.platform = platform;
    this.pathID = pathID;
    this.origOffset = offset;
    this.length = length;
    this.classID = classID;
    this.typeID = typeID;

    this.version = this.rawVersion.replaceAll(/\D/g, '.').split('.').map(Number);
    this.isPatch = this.rawVersion.match(/p/g) != null;
  }

  reset() {
    this.seek(0);
  }

  versionGT(major, minor) {
    return (this.version[0] > major || (this.version[0] === major && this.version[1] > minor));
  }

  versionGTE(major, minor) {
    return (this.version[0] > major || (this.version[0] === major && this.version[1] >= minor));
  }

  versionLT(major, minor) {
    return (this.version[0] < major || (this.version[0] === major && this.version[1] < minor));
  }

  versionLTE(major, minor) {
    return (this.version[0] < major || (this.version[0] === major && this.version[1] <= minor));
  }
}