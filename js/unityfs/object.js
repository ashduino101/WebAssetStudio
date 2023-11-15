export class UnityObject {
  static exposedAttributes = [];
  exportExtension = '.dat';

  constructor(reader) {
    reader.seek(0);  // ObjectReaders are expected to have a relative offset - this should not be a regular BinaryReader
    if (reader.platform === 'No Target') {
      this.objectHideFlags = reader.readUInt32();
    }
    this._raw = reader.read((typeof this.objectHideFlags == 'undefined') ? reader.length : (reader.length - 4));
    if (this.constructor.name === 'UnityObject') {  // not overridden
      this._noOverride = true;
    }
    reader.seek(0);
  }

  static getName(reader) {
    try {
      if (this.exposedAttributes.indexOf('m_Name') > -1) {
        return new this(reader).m_Name;
      }
    } catch {
      return '<unnamed>';
    }
    return '<unnamed>';
  }

  async createPreview() {
    let text = document.createElement('h2');
    text.classList.add('no-preview');
    text.innerText = 'No preview available';
    return text;
  }

  async getInfo() {
    function getAttrs(p) {
      let j = {};
      if (p != null && p.constructor.exposedAttributes?.length > 0) {
        for (let prop of p.constructor.exposedAttributes) {
          j[prop] = getAttrs(p[prop]);
        }
      } else if (p instanceof Array) {
        j = [];
        for (let item of p) {
          j.push(getAttrs(item));
        }
      } else {
        j = p;
      }
      return j;
    }
    return getAttrs(this);
  }

  async saveInfo(zip, baseName) {
    if (typeof this.constructor.exposedAttributes == 'undefined') {
      zip.file(baseName + '.txt', 'Class unsupported');
      return;
    }

    zip.file(baseName + '.json', JSON.stringify(
      await this.getInfo(),
      (_, v) => typeof v === 'bigint' ? v.toString() : v,
      2)
    );
  }

  async getExport() {
    // Fallback for objects that are not supported
    if (this._noOverride) {
      return this._raw;
    }
  }

  async getAnyExport() {
    if (Object.getPrototypeOf(this).hasOwnProperty('getExport')) {
      return this.getExport();  // if this is overridden, use it
    } else {
      return this._raw;  // otherwise, return the data of the object
    }
  }

  async saveObject(zip, baseName) {
    let data = await this.getExport();
    if (typeof data != 'undefined') {
      zip.file(baseName + this.exportExtension, data);
    }
  }

  serialize() {
    // Default -- return raw data
    return this._raw;
  }
}