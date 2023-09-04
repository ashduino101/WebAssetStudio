import {NamedObject} from "./namedObject";

export class TextAsset extends NamedObject {
  exposedAttributes = [
    'text'
  ]

  constructor(reader) {
    super(reader);
    this.text = reader.readChars(reader.readUInt32());
  }

  async createPreview() {
    let text = document.createElement('h2');
    text.style.fontFamily = '"Helvetica", sans-serif';
    text.innerText = this.text;
    text.style.fontSize = '16px';
    text.style.margin = '0';
    text.style.padding = '4px';
    text.style.overflowWrap = 'break-word';
    text.style.hyphens = 'manual';
    text.style.fontWeight = 'normal';
    text.style.overflow = 'auto';
    text.style.maxWidth = '100%';
    text.style.maxHeight = '100%';
    text.style.boxSizing = 'border-box';
    return text;
  }

  async saveObject(root, baseName) {
    root.file(baseName + '.txt', this.text);
  }
}