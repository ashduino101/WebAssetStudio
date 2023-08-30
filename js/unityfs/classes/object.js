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
}