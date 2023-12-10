import {BinaryReader} from "../binaryReader";
import FileHandler, {fileTypes} from "../fileHandler";
import {PckFile} from "./pckFile";
import {Resource} from "./resource";
import {StreamTexture} from "./types/texture";
import {NtExecutable} from "pe-library";
import {ELFParser} from "@wokwi/elfist";

export class GodotFile {
  constructor(data, baseOffset = 0) {
    let reader = new BinaryReader(data, 'little');
    let handler = new FileHandler(null);
    handler.data = data;
    this.fileType = handler.getType();
    switch (this.fileType) {
      case fileTypes.GodotPck:
        this.parser = new PckFile(reader, baseOffset);
        break;
      case fileTypes.GodotResource:
        this.parser = new Resource(reader);
        break;
      case fileTypes.GodotStreamTexture:
        this.parser = new StreamTexture(reader);
        break;
      case fileTypes.GodotCompressedTexture:
        break;
      case fileTypes.GodotScene:
        break;
    }
  }
}