import {Extension} from "../extension";

export class FontExtension extends Extension {
  constructor(font) {
    super();
    this.font = font;
  }

  createID() {
    return 'font_xxxxxxxxxxxxxxxx'.replaceAll('x', () => Math.floor(Math.random() * 256).toString(16));
  }

  async loadFont() {
    let font = new Blob([this.font.m_FontData], {type: 'application/octet-stream'});  // type shouldn't matter
    let fontID = this.createID();
    let fontURL = URL.createObjectURL(font);
    let face = new FontFace(fontID, `url(${fontURL})`);
    await face.load();
    document.fonts.add(face);
    return fontID
  }

  async createPreview() {
    const sampleText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    const fontID = await this.loadFont();
    let text = document.createElement('h3');
    text.innerText = sampleText;
    text.style.fontFamily = fontID;
    text.style.margin = '8px';
    return text;
  }

  async getExport() {
    return this.font.m_FontData;
  }
}