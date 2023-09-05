export class UnityObject {
  exposedAttributes = [];

  constructor(reader) {
    reader.seek(0);  // ObjectReaders are expected to have a relative offset - this should not be a regular BinaryReader
    if (reader.platform === 'No Target') {
      this.objectHideFlags = reader.readUInt32();
    }
    if (this.constructor.name === 'UnityObject') {  // not overridden
      this._noOverride = true;
      this._raw = reader.read((typeof this.objectHideFlags == 'undefined') ? reader.length : (reader.length - 4));
    }
  }

  static getName(_) {
    return '<unnamed>';
  }

  async createPreview() {
    let text = document.createElement('h2');
    text.classList.add('no-preview');
    text.innerText = 'No preview available';
    return text;
  }

  async saveInfo(zip, baseName) {
    if (typeof this.exposedAttributes == 'undefined') {
      zip.file(baseName + '.txt', 'Class unsupported');
      return;
    }
    function getAttrs(p) {
      let j = {};
      if (p != null && p.exposedAttributes?.length > 0) {
        for (let prop of p.exposedAttributes) {
          j[prop] = getAttrs(p[prop]);
        }
      } else if (p instanceof Array) {
        j = [];
        for (let item of p) {
            j.push(getAttrs(item));
        }
      } else {
        if (typeof p == 'bigint') {
          j = Number(p);
        } else {
          j = p;
        }
      }
      return j;
    }
    zip.file(baseName + '.json', JSON.stringify(getAttrs(this), undefined, 2));
  }

  async saveObject(zip, baseName) {
    // Fallback for objects that are not supported
    if (this._noOverride) {
      zip.file(baseName + '.dat', this._raw);
    }
  }
}