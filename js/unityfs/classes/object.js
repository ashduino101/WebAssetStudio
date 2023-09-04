export class UnityObject {
  constructor(reader) {
    reader.seek(0);  // ObjectReaders are expected to have a relative offset - this should not be a regular BinaryReader
    if (reader.platform === 'No Target') {
      this.objectHideFlags = reader.readUInt32();
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
    }
    function getAttrs(p) {
      let j = {};
      if (p != null && p.exposedAttributes?.length > 0) {
        for (let prop of p.exposedAttributes) {  // exposedAttributes isn't set by default, but should be overridden
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
    // To be implemented
  }
}