import {BaseExtension} from "./baseExtension";

export class FontFileExtension extends BaseExtension {
  static type = 'variant';
  static extension = '.ttf';  // most of the time, if not all

  constructor() {
    super();
  }

  createID() {
    return 'font_xxxxxxxxxxxxxxxx'.replaceAll('x', () => Math.floor(Math.random() * 256).toString(16));
  }

  loadFont(res) {
    let font = new Blob([res.resource.properties.data], {type: 'application/octet-stream'});
    let fontID = this.createID();
    let fontURL = URL.createObjectURL(font);
    let face = new FontFace(fontID, `url(${fontURL})`);
    face.load().then(() => document.fonts.add(face));
    return fontID
  }

  createPreview(res) {
    const sampleText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    const fontID = this.loadFont(res);
    let text = document.createElement('h3');
    text.innerText = sampleText;
    text.style.fontFamily = fontID;
    text.style.margin = '8px';
    return text;
  }

  exportFile(res) {
    return res.resource.properties.data;
  }
}