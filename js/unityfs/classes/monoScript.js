import {NamedObject} from "./namedObject";
import hljs from 'highlight.js';
import csharp from 'highlight.js/lib/languages/csharp';
import 'highlight.js/styles/idea.css';
import {CSharpDecompiler} from "../../cs-decomp/decompiler";
import {requestExternalData} from "../utils";

hljs.registerLanguage('csharp', csharp);

export class MonoScript extends NamedObject {
  static exposedAttributes = [
    'name',
    'executionOrder',
    'propertiesHash',
    'className',
    'namespace',
    'assemblyName'
  ];

  constructor(reader) {
    super(reader);
    if (reader.versionGTE(3, 4)) {
      this.executionOrder = reader.readInt32();
    }
    if (reader.version[0] < 5) {
      this.propertiesHash = reader.readUInt32();
    } else {
      this.propertiesHash = [...reader.read(16)].map(i => i.toString(16).padStart(2, '0')).join('');
    }
    if (reader.version[0] < 3) {
      this.pathName = reader.readAlignedString();
    }
    this.className = reader.readAlignedString();
    if (reader.version[0] >= 3) {
      this.namespace = reader.readAlignedString();
    }
    this.assemblyName = reader.readAlignedString();
    if (reader.versionLT(2018, 2)) {
      this.isEditorScript = reader.readBool();
    }
    this.assemblyData = null;
  }

  getFullPath() {
    if (this.pathName) return this.pathName;
    let path = '';
    if (this.namespace !== '') {
      path += this.namespace + '.';
    }
    if (this.className !== '') {
      path += this.className;
    }
    return path;
  }

  async createPreview() {
    const elem = document.createElement('pre');
    elem.style.overflow = 'auto';
    elem.style.width = '100%';
    elem.style.height = '100%';
    elem.classList.add('monoscript-viewer');
    if (this.assemblyData == null) {
      this.assemblyData = await requestExternalData({offset: 0, size: -1, path: this.assemblyName});
    }
    const dec = new CSharpDecompiler();
    elem.textContent = await dec.decompile(this.assemblyData, this.assemblyName, this.getFullPath());
    elem.classList.add('language-csharp');
    hljs.highlightElement(elem);
    return elem;
  }
}