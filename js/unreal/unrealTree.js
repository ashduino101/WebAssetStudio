import {AssetTree} from "../treeview";
import {GodotFile} from "../godot/godotFile";
import {fileTypes} from "../fileHandler";
import {PACKAGE_FILE_MAGIC, PackageFile} from "./package";
import {BinaryReader} from "../binaryReader";
import {PAK_MAGIC} from "./pakfile";
import {PckFile} from "../godot/pckFile";

export class UnrealTree extends AssetTree {
  async loadFile(data) {
    this.treeFiles = [];

    this.objectBranches = {};

    this.isExporting = false;

    let reader = new BinaryReader(data, 'little');
    const magic = reader.readUInt32();
    reader.seek(0);
    if (magic === PACKAGE_FILE_MAGIC) {
      this.parser = new PackageFile(reader);
    } else {
      this.parser = new PckFile(reader);
    }
    console.log(this.parser)

    this.activeFilter = [];

    this.initTree();
    this.initListeners();
    this.initFilter(
      [],
      {}
    );

    // const fileType = this.parser.fileType;
    //
    // if (typeof this.parser.parser != 'undefined') {
    //   this.parser = this.parser.parser;
    // }
    //
    // switch (fileType) {
    //   case fileTypes.GodotPck:
    //     await this.loadPck();
    //     break;
    //   case fileTypes.GodotResource:
    //     await this.parser.load();
    //     await this.loadResource();
    //     break;
    // }

    this.postInit();
  }
}