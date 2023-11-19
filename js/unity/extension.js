export class Extension {
  exportExtension = '.dat';

  constructor(object) {
    this.object = object;
  }

  async createPreview() {
    const elem = document.createElement('h2');
    elem.classList.add('no-preview');
    elem.textContent = 'No preview available';
    return elem;
  }

  async saveObject(zip, baseName) {
    let data = await this.getExport();
    if (typeof data != 'undefined') {
      zip.file(baseName + this.exportExtension, data);
    }
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
    return getAttrs(this.object);
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
    return null;
  }
}