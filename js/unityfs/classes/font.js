import {NamedObject} from "./namedObject";
import {PPtr} from "./pptr";
import {Rectf} from "./sprite";
import {KVPair} from "../basicTypes";

export class CharacterRect {
  static exposedAttributes = [
    'index',
    'uv',
    'vert',
    'width',
    'flipped'
  ]
  constructor(reader) {
    this.index = reader.readInt32();
    this.uv = new Rectf(reader);
    this.vert = new Rectf(reader);
    this.width = reader.readFloat32();

    if (reader.version[0] >= 4) {
      this.flipped = reader.readBool();
      reader.align(4);
    }
  }
}

export class KerningValue {
  static exposedAttributes = [
    'pairFirst',
    'pairSecond',
    'second'
  ]
  constructor(reader) {
    // real names unknown
    this.pairFirst = reader.readInt16();
    this.pairSecond = reader.readInt16();
    this.second = reader.readInt32();
  }
}

export class Font extends NamedObject {
  static exposedAttributes = [
    'name',
    'lineSpacing',
    'defaultMaterial',
    'fontSize',
    'texture',
    'asciiStartOffset',
    'characterSpacing',
    'characterPadding',
    // 'characterRects',
    // 'kerningValues',
    'pixelScale'
  ];
  exportExtension = '.font';  // variable, maybe this should be a getter and detect the format?

  constructor(reader) {
    super(reader);

    if (reader.versionGTE(5, 5)) {
      this.lineSpacing = reader.readFloat32();
      this.defaultMaterial = new PPtr(reader);
      this.fontSize = reader.readFloat32();
      this.texture = new PPtr(reader);
      this.asciiStartOffset = reader.readInt32();
      this.tracking = reader.readFloat32();
      this.characterSpacing = reader.readInt32();
      this.characterPadding = reader.readInt32();
      this.convertCase = reader.readInt32();
      let numCharacterRects = reader.readInt32();
      this.characterRects = [];
      for (let i = 0; i < numCharacterRects; i++) {
        this.characterRects.push(new CharacterRect(reader));
      }
      let numKerningValues = reader.readInt32();
      this.kerningValues = [];
      for (let i = 0; i < numKerningValues; i++) {
        this.kerningValues.push(new KerningValue(reader));
      }
      this.pixelScale = reader.readFloat32();
      this.fontData = reader.read(reader.readInt32());
    } else {
      this.asciiStartOffset = reader.readInt32();
      if (reader.version[0] <= 3) {
        this.fontCountX = reader.readInt32();
        this.fontCountY = reader.readInt32();
      }
      this.fontSize = 18;  // default to 18pt for no reason whatsoever

      this.kerning = reader.readFloat32();
      this.lineSpacing = reader.readFloat32();

      if (reader.version[0] <= 3) {
        let numPerCharacterKerning = reader.readInt32();
        this.perCharacterKerning = [];
        for (let i = 0; i < numPerCharacterKerning; i++) {
          this.perCharacterKerning.push(new KVPair(reader.readInt32(), reader.readFloat32()));
        }
      } else {
        this.characterSpacing = reader.readInt32();
        this.characterPadding = reader.readInt32();
      }
      this.convertCase = reader.readInt32();
      this.defaultMaterial = new PPtr(reader);

      let numCharacterRects = reader.readInt32();
      this.characterRects = [];
      for (let i = 0; i < numCharacterRects; i++) {
        this.characterRects.push(new CharacterRect(reader));
      }

      this.texture = new PPtr(reader);

      let numKerningValues = reader.readInt32();
      this.kerningValues = [];
      for (let i = 0; i < numKerningValues; i++) {
        this.kerningValues.push(new KerningValue(reader));
      }

      if (reader.version[0] <= 3) {
        this.gridFont = reader.readBool();
        reader.align(4);
      } else {
        this.pixelScale = reader.readFloat32();
      }

      this.fontData = reader.read(reader.readInt32());
    }
  }

  createID() {
    return 'font_xxxxxxxxxxxxxxxx'.replaceAll('x', () => Math.floor(Math.random() * 256).toString(16));
  }

  async loadFont() {
    let font = new Blob([this.fontData], {type: 'application/octet-stream'});  // type shouldn't matter
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
    return this.fontData;
  }
}