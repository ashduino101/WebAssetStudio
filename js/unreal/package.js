import {UE4ObjectVersion, UE5ObjectVersion} from "./version";

const PACKAGE_FILE_MAGIC = 0x9E2A83C1;
const LATEST_SUPPORTED = -8;

class EngineVersion {
  constructor(reader) {
    this.major = reader.readInt16();
    this.minor = reader.readInt16();
    this.patch = reader.readInt16();
    this.changelist = reader.readUInt32();
    this.branch = reader.readString();
  }
}

class CompressionFlags {
  constructor(reader) {
    let val = reader.readUInt32();
    this.method = ['None', 'Zlib', 'GZip', 'Custom'][val & 0xF];

    this.biasMemory = val & 0x10;
    this.biasSpeed = val & 0x10;
    this.sourceIsPadded = val & 0x80;

    this.forPackaging = val & 0x100;
  }
}

export class PackageFile {
  constructor(reader) {
    reader.endian = 'little';

    if (reader.readUInt32() !== PACKAGE_FILE_MAGIC) {
      throw new Error("Not an Unreal package file");
    }
    this.legacyVersion = reader.readInt32();
    if (this.legacyVersion < 0) {
      if (this.legacyVersion < LATEST_SUPPORTED) {
        throw new Error("Unsupported package file version (too new)");
      }
      if (this.legacyVersion !== -4) {
        this.legacyUE3Version = reader.readInt32();
      }
      this.ue4Version = reader.readInt32();
      if (this.legacyVersion <= -8) {
        this.ue5Version = reader.readInt32();
      }
      this.ue5LicenseeVersion = reader.readInt32();
      if (this.legacyVersion <= -2) {
        let numCustomVersions = reader.readInt32();
        this.customVersions = [];
        for (let i = 0; i < numCustomVersions; i++) {
          this.customVersions.push({
            key: reader.readGUID(),
            version: reader.readInt32()
          });
        }
      }
      if (!this.legacyUE3Version && !this.ue4Version || !this.ue5Version) {
        this.unversioned = true;
        this.version = UE5ObjectVersion.DATA_RESOURCES
      } else {
        this.unversioned = false;
        this.version = this.ue5Version ?? this.ue4Version ?? this.legacyUE3Version;
      }
    } else {
      throw new Error("File too old");
    }

    this.totalHeaderSize = reader.readInt32();
    this.packageName = reader.readString();
    this.packageFlags = reader.readUInt32();

    this.nameCount = reader.readInt32();
    this.nameOffset = reader.readInt32();

    if (this.version >= UE5ObjectVersion.ADD_SOFTOBJECTPATH_LIST) {
      this.softObjectPathsCount = reader.readInt32();
      this.softObjectPathsOffset = reader.readInt32();
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_ADDED_PACKAGE_SUMMARY_LOCALIZATION_ID) {
      this.localizationID = reader.readString();
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_SERIALIZE_TEXT_IN_PACKAGES) {
      this.gatherableTextDataCount = reader.readInt32();
      this.gatherableTextDataOffset = reader.readInt32();
    }
    this.exportCount = reader.readInt32();
    this.exportOffset = reader.readInt32();
    this.importCount = reader.readInt32();
    this.importOffset = reader.readInt32();
    this.dependsOffset = reader.readInt32();
    if (this.version < UE4ObjectVersion.VER_UE4_OLDEST_LOADABLE_PACKAGE || this.legacyVersion < LATEST_SUPPORTED) {
      return;  // we can't load more than this with files that are too old or too new
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_ADD_STRING_ASSET_REFERENCES_MAP) {
      this.softPackageReferencesCount = reader.readInt32();
      this.softPackageReferencesOffset = reader.readInt32();
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_ADDED_SEARCHABLE_NAMES) {
      this.searchableNamesOffset = reader.readInt32();
    }
    this.thumbnailTableOffset = reader.readInt32();

    this.guid = reader.readGUID();
    if (this.version >= UE4ObjectVersion.VER_UE4_ADDED_PACKAGE_OWNER) {
      this.persistentGUID = reader.readGUID();
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_ADDED_PACKAGE_OWNER &&
      this.version < UE4ObjectVersion.VER_UE4_NON_OUTER_PACKAGE_IMPORT) {
      this.ownerPersistentGUID = reader.readGUID();
    }

    let numGenerations = reader.readUInt32();
    this.generations = [];
    for (let i = 0; i < numGenerations; i++) {
      this.generations.push({
        exportCount: reader.readUInt32(),
        nameCount: reader.readInt32()
      });
    }

    if (this.version >= UE4ObjectVersion.VER_UE4_ENGINE_VERSION_OBJECT) {
      this.savedByEngineVersion = new EngineVersion(reader);
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_PACKAGE_SUMMARY_HAS_COMPATIBLE_ENGINE_VERSION) {
      this.compatibleWithEngineVersion = new EngineVersion(reader);
    }

    this.compressionFlags = new CompressionFlags(reader);
    this.compressedChunks = [];
    let numCompressedChunks = reader.readUInt32();
    for (let i = 0; i < numCompressedChunks; i++) {
      this.compressedChunks.push({
        start: Number(reader.readUInt64()),
        end: Number(reader.readUInt64())
      });
    }
    if (numCompressedChunks) {
      console.error("Cannot load packages with package-level compression");
      return;  // We can't read more than this
    }

    this.packageSource = reader.readUInt32();

    this.additionalPackagesToCook = reader.readArrayT(reader.readString.bind(reader), reader.readUInt32());

    if (this.legacyVersion > -7) {
      this.numTextureAllocations = reader.readInt32();
    }

    this.assetRegistryDataOffset = reader.readInt32();
    this.bulkDataStartOffset = Number(reader.readInt64());

    if (this.version >= UE4ObjectVersion.VER_UE4_WORLD_LEVEL_INFO) {
      this.worldTileInfoDataOffset = reader.readInt32();
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_CHANGED_CHUNKID_TO_BE_AN_ARRAY_OF_CHUNKIDS) {
      this.chunkIDs = reader.readArrayT(reader.readInt32.bind(reader), reader.readInt32());
    } else {
      this.chunkIDs = [reader.readInt32()];
    }
    if (this.version >= UE4ObjectVersion.VER_UE4_PRELOAD_DEPENDENCIES_IN_COOKED_EXPORTS) {
      this.preloadDependencyCount = reader.readInt32();
      this.preloadDependencyOffset = reader.readInt32();
    }
    if (this.version >= UE5ObjectVersion.NAMES_REFERENCED_FROM_EXPORT_DATA) {
      this.namesReferencedFromExportDataCount = reader.readInt32();
    }
    if (this.version >= UE5ObjectVersion.PAYLOAD_TOC) {
      this.payloadTOCOffset = Number(reader.readInt64());
    }
    if (this.version >= UE5ObjectVersion.DATA_RESOURCES) {
      this.dataResourceOffset = reader.readInt32();
    }

    this.reader = reader;
    this.loadNames();
    this.loadAssetRegistry();
    this.loadThumbnails();
  }

  loadNames() {
    this.reader.seek(this.nameOffset);
    this.names = [];
    for (let i = 0; i < this.nameCount; i++) {
      let nameLength = this.reader.readInt32();
      if (nameLength < 0) {
        throw new Error('UTF-16 names not supported');
      }
      this.names.push({
        name: this.reader.readChars(nameLength).split('\0')[0],
        nonCasePreservingHash: this.reader.readUInt16(),
        casePreservingHash: this.reader.readUInt16()
      });
    }
  }

  loadAssetRegistry() {
    this.reader.seek(this.assetRegistryDataOffset);
    this.dependencyDataOffset = Number(this.reader.readUInt64());
    let objectCount = this.reader.readInt32();
    this.objects = [];
    for (let i = 0; i < objectCount; i++) {
      this.objects.push(this.reader.readString());
    }
  }

  loadThumbnails() {
    if (this.thumbnailTableOffset === 0) return;
    this.reader.seek(this.thumbnailTableOffset);
    let numThumbnails = this.reader.readInt32();
    let thumbnailRefs = [];
    for (let i = 0; i < numThumbnails; i++) {
      let objectShortClassName = this.reader.readString();
      let objectPathWithoutPackageName = this.reader.readString();
      let thumbnailOffset = this.reader.readInt32();
      thumbnailRefs.push({
        objectShortClassName,
        objectPathWithoutPackageName,
        thumbnailOffset
      });
    }
    this.thumbnails = [];
    for (let ref of thumbnailRefs) {
      this.reader.seek(ref.thumbnailOffset);
      let isJPEG = false;
      let width = this.reader.readInt32();
      let height = this.reader.readInt32();
      if (height < 0) {
        height = -height;
        isJPEG = true;
      }
      let data = this.reader.read(this.reader.readInt32());
      this.thumbnails.push({
        width,
        height,
        isJPEG,
        data
      });
    }
  }
}