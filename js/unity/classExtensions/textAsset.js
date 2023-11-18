import {Extension} from "../extension";

export class TextAssetExtension extends Extension {
  constructor(textAsset) {
    super();
    this.textAsset = textAsset;
  }

  async createPreview() {
    let text = document.createElement('h2');
    text.style.fontFamily = '"Helvetica", sans-serif';
    text.innerText = this.textAsset.m_Script;
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

  async getExport() {
    return this.textAsset.m_Script;
  }
}