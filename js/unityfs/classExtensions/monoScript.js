import {Extension} from "../extension";
import hljs from "highlight.js";
import csharp from 'highlight.js/lib/languages/csharp';
import 'highlight.js/styles/idea.css';
import {CSharpDecompiler} from "../../cs-decomp/decompiler";
import {requestExternalData} from "../utils";

hljs.registerLanguage('csharp', csharp);


export class MonoScriptExtension extends Extension {
  constructor(script) {
    super();
    this.script = script;
    this.assemblyData = null;
  }

  getFullPath() {
    if (this.script.m_PathName) return this.script.m_PathName;
    let path = '';
    if (this.script.m_Namespace !== '') {
      path += this.script.m_Namespace + '.';
    }
    if (this.script.m_ClassName !== '') {
      path += this.script.m_ClassName;
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