import JSZip from "jszip";
import {AssetTree} from "../treeview";
import XNBFile from "./xnbFile";
import {BinaryReader} from "../binaryReader";
import {typeReaders} from "./readers";
import {BaseType} from "./types/baseType";

export default class XNBTree extends AssetTree {
  styleObject(object, name, isHidden = false) {
    return `<span class="tree-label label-objectname ${isHidden ? "hidden" : ""}">${this.htmlEscape(name)}</span>
            <span class="tree-label label-generic ${isHidden ? "hidden" : ""}"> : </span>
            <span class="tree-label label-objecttype ${isHidden ? "hidden" : ""}">${this.htmlEscape(object.getClassName())}</span>`;
  }

  async createTreeForObject(obj, rootNode, name, style = 'generic', icon = 'icon-generic', isOpened = false) {
    if (obj == null) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon, true);
      return;
    }
    if (obj instanceof Array) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      for (let i = 0; i < obj.length; i++) {
        await this.createTreeForObject(obj[i], rootNode + '-' + name, i);
      }
    } else if (typeof obj == 'object') {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      if (obj instanceof XNBFile) {
        await this.createTreeForObject(obj.platform, rootNode + '-' + name, 'platform');
        await this.createTreeForObject(obj.formatVersion, rootNode + '-' + name, 'formatVersion');
        await this.createTreeForObject(obj.isHiDef, rootNode + '-' + name, 'isHiDef');
        await this.createTreeForObject(obj.isCompressed, rootNode + '-' + name, 'isCompressed');
        await this.createTreeForObject(obj.size, rootNode + '-' + name, 'size');
        if (obj.isCompressed) {
          await this.createTreeForObject(obj.uncompressedSize, rootNode + '-' + name, 'uncompressedSize');
        }
        await this.createNode(rootNode + '-' + name, rootNode + '-' + name + '-typeReaders',
          this.styleTextAs('typeReaders', 'generic'), icon, isOpened);
        let i = 0;
        for (const reader of obj.typeReaders) {
          await this.createNode(rootNode + '-' + name + '-typeReaders', rootNode + '-' + name + `-typeReaders-${i++}`,
            this.styleTextAs(reader.name, 'typereader'), 'icon-generic');
        }
        await this.createNode(rootNode + '-' + name, rootNode + '-' + name + '-primaryAsset',
          this.styleObject(obj.primaryAsset, 'primaryAsset'), 'icon-object', isOpened, {type: 'object', data: obj.primaryAsset});
        await this.createTreeForObject(obj.primaryAsset, rootNode + '-' + name + '-primaryAsset', 'properties');
        await this.createNode(rootNode + '-' + name, rootNode + '-' + name + '-sharedResources',
          this.styleTextAs('sharedResources', 'generic'), icon, isOpened);
        i = 0;
        for (const res of obj.sharedResources) {
          await this.createNode(rootNode + '-' + name, rootNode + '-' + name + '-sharedResources-' + i,
            this.styleObject(res, `${i}`), 'icon-object', isOpened, {type: 'object', data: res});
          await this.createTreeForObject(res, rootNode + '-' + name + '-sharedResources-' + i, 'properties');
          i++;
        }
      } else if (obj instanceof BaseType) {
        for (let attr in obj) {
          if (attr === 'exportExtension' || attr === 'exposedAttributes' || attr === 'canExport') continue;
          let val = obj[attr];
          await this.createTreeForObject(val, rootNode + '-' + name, attr);
        }
      } else {
        if (typeof obj.constructor.exposedAttributes !== 'undefined') {
          for (let attr of obj.constructor.exposedAttributes) {
            let val = obj[attr];
            await this.createTreeForObject(val, rootNode + '-' + name, attr);
          }
        }
      }
    } else {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon, true);
    }
  }
  async createZip() {
    let zip = new JSZip();
    zip.file('primaryAsset' + this.parser.primaryAsset.exportExtension, this.parser.primaryAsset.getAnyExport());
    let folder = zip.folder('sharedResources');
    let i = 0;
    for (let res of this.parser.sharedResources) {
      folder.file(i + res.exportExtension, res.getAnyExport());
      i++;
    }
    return await zip.generateAsync({type: 'uint8array'});
  }

  async exportZip() {
    const {subtitle} = this.onExportStart();
    const modal = document.getElementById('modal');

    document.body.addEventListener('bundle-resolve-request', data => {
      let path = data.detail;
      // console.log('From exporter: Received bundle resolution request for path', path);
      if (path.startsWith('archive:/')) {
        path = path.substring('archive:/'.length, path.length);
      }
      let matches = this.treeFiles.filter(f => f.fileName === path);
      let match;
      if (matches.length > 0) {
        match = matches[0].parser.reader.data;
      } else {
        path = path.substring(path.indexOf('/') + 1, path.length);
        matches = this.treeFiles.filter(f => f.fileName === path);
        if (matches.length > 0) {
          match = matches[0].parser.reader.data;
        } else {
          if (this.providedExternals[path] !== undefined) {
            match = this.providedExternals[path];
          } else if (path === '') {
            document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: false, data: null}}));
          } else {
            console.warn('no matches, left with path:', path);
            subtitle.innerText = `External file required: ${path}`;
            const input = document.createElement('input');
            input.id = 'ext' + 'xxxxxxxx'.replaceAll('x', () => Math.floor(Math.random() * 256).toString(16));
            input.classList.add('modal-external-input');
            input.type = 'file';
            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.classList.add('modal-external-input-button');
            label.innerText = 'Upload...';
            input.addEventListener('change', () => {
              let reader = new FileReader();
              reader.onloadend = async b => {
                this.providedExternals[path] = new Uint8Array(reader.result);
                document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {
                  detail: {
                    status: true,
                    data: this.providedExternals[path]
                  }
                }));
                modal.removeChild(input);
                modal.removeChild(label);
              }
              reader.readAsArrayBuffer(input.files[0]);
            });
            modal.appendChild(input);
            modal.appendChild(label);
            return true;
          }
        }
      }
      document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: true, data: match}}));
    });
    setTimeout(async () => {
      this.downloadZip().then(() => {
        this.onExportEnd();
      });
    }, 0);
  }

  applyFilter() {

  }

  async onNodeSelect(evt, data) {
    const preview = document.getElementById('preview');
    if (data.node.data.type === 'object') {
      document.body.dispatchEvent(new CustomEvent('destroy-preview'));
      let object = data.node.data.data;
      if (typeof object.createPreview === 'function') {
        preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
        object.createPreview().then(prev => {
          preview.innerHTML = '';
          preview.appendChild(prev);
        });
      }
      let name = object.getClassName();

      document.getElementById('download-info').onclick = async () => {
        this.saveBlob(name + '.json', [object.getJSON()]);
      };
      document.getElementById('download-object').onclick = async () => {
        this.saveBlob(name + object.exportExtension, [await object.getExport()]);
      };
    }
  }

  async onNodeOpen(evt, data) {

  }

  async loadFile(data) {
    this.parser = new XNBFile(new BinaryReader(data));

    this.activeFilter = [];

    this.initTree();
    this.initListeners();
    this.initFilter([], {});

    await this.createTreeForObject(this.parser, '#', 'Asset', 'asset', 'icon-asset');

    // By default, set the preview pane to the primary asset
    const preview = document.getElementById('preview');
    if (typeof this.parser.primaryAsset.createPreview === 'function') {
      preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
      this.parser.primaryAsset.createPreview().then(prev => {
        preview.innerHTML = '';
        preview.appendChild(prev);
      });
    }

    this.postInit();
  }
}
