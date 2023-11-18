import {getClassName, globalDestroy} from "./utils";
import {BundleFile, NodeFile} from "./bundleFile";
import {FileType, UnityFS} from "./unityFile";
import {AssetFile, ObjectCollection, TypeTreeReference} from "./assetFile";
import {PPtr} from "./pptr";
import JSZip from "jszip";
import {classNames} from "./classIDType";
import {AssetTree} from "../treeview";
import {saveBlob} from "../utils";
import {BinaryReader} from "../binaryReader";
import {WebFile} from "./webFile";

export default class UnityTree extends AssetTree {
  styleObject(object, isHidden = false) {
    return `<span class="tree-label label-objectname ${isHidden ? "hidden" : ""}">${this.htmlEscape(object.name)}</span>
            <span class="tree-label label-generic ${isHidden ? "hidden" : ""}"> : </span>
            <span class="tree-label label-objecttype ${isHidden ? "hidden" : ""}">${this.htmlEscape(object.getClassName())}</span>
            <span class="tree-label label-objectid ${isHidden ? "hidden" : ""}"> @ ${this.htmlEscape(object.pathID)}</span>`;
  }

  async createTreeForUnityObject(obj, rootNode, isFromPPtr = false, isNone = false) {
    if (obj == null) return;  // can't load the object
    if (!isNone) obj.setCaching(false);
    await this.createNode(
      rootNode,
      rootNode + '-' + obj.pathID,
      isNone ? '<span class="tree-label label-objectname">&lt;none&gt;</span>' : ((isFromPPtr ? '<i>' : '') + this.styleObject(obj) + (isFromPPtr ? '</i>' : '')),
      'icon-object',
      true,
      // {pathID: obj.pathID, fileID: collection.fileID}
      {type: 'object', data: obj, root: rootNode, isNone: isNone}
    );
    if (!isNone) {
      await this.createNode(
        rootNode + '-' + obj.pathID,
        rootNode + '-' + obj.pathID + '-placeholder',
        '&lt;not loaded&gt;',
        'icon-generic'
      );
    }
  }

  async createTreeForObjectCollection(collection, rootNode) {
    await this.createNode(rootNode, rootNode + '-objects', this.styleTextAs('objects', 'generic'), 'icon-generic', true);
    let i = 1;
    for (let obj of collection.objects) {
      if (
        this.hasFilter('objectclass') &&
        !this.filterAllOfKey('objectclass', obj.getClassName())
      ) {
        continue;
      }
      // console.log(`${i}/${collection.objects.length}`);
      await this.createTreeForUnityObject(obj, rootNode + '-objects');
      i++;
    }
  }

  async createTreeForTypeTree(obj, rootNode) {
    await this.createNode(
      rootNode,
      rootNode + '-trees-' + obj.classID + '_' + obj.scriptTypeIndex,
      this.styleTextAs(getClassName(obj.classID), 'typetree'),
      'icon-generic',
      true,
      {type: 'typetree', data: obj, root: rootNode}
    );
    await this.createNode(
      rootNode + '-trees-' + obj.classID + '_' + obj.scriptTypeIndex,
      rootNode + '-trees-' + obj.classID + '_' + obj.scriptTypeIndex + '-placeholder',
      '&lt;structure not available&gt;',
      'icon-generic'
    );
  }

  async createTreeForObject(obj, rootNode, name, style = 'generic', icon = 'icon-generic', isOpened = false) {
    if (obj == null) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon, true);
      return;
    }
    if (obj instanceof NodeFile) {
      let file = new UnityFS(obj.data);
      file.parseHeader();
      let newStyle;
      let newIcon;
      switch (file.fileType) {
        case FileType.Assets:
          newStyle = 'asset';
          newIcon = 'icon-asset';
          break;
        case FileType.Bundle:
          newStyle = 'bundle';
          newIcon = 'icon-bundle';
          break;
        case FileType.Resource:
          newStyle = 'resource';
          newIcon = 'icon-resource';
          break;
        default:
          newStyle = 'generic';
          newIcon = 'icon-generic';
          break;
      }
      this.treeFiles.push({  // only asset/resource files
        treeNode: rootNode + '-' + name,
        fileName: obj.node.path,
        type: file.fileType,
        parser: file,
      });
      if (file.fileType === FileType.Bundle) {
        await file.parse();
        await this.createTreeForObject(file.parser, rootNode + '-' + name, 'Bundle', 'bundle', 'icon-bundle');
      } else if (file.fileType === FileType.Assets) {
        await file.parse();
        await this.createTreeForObject(file.parser, rootNode, obj.node.path, 'asset', 'icon-asset');
      } else {
        await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(obj.node.path, newStyle), newIcon, isOpened);
      }
    } else if (obj instanceof ObjectCollection) {
      await this.createTreeForObjectCollection(obj, rootNode);
    } else if (obj instanceof PPtr) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened, {type: 'pptr', data: obj});
      obj.resolve();
      if (obj.pathID === BigInt(0)) {
        await this.createTreeForUnityObject(obj, rootNode + '-' + name, true, true);
      } else {
        await this.createTreeForUnityObject(obj.info, rootNode + '-' + name, true);
      }
      // await this.createTreeForObject(obj.fileID, rootNode + '-' + name, 'fileID');
      // await this.createTreeForObject(obj.pathID, rootNode + '-' + name, 'pathID');
    } else if (obj instanceof TypeTreeReference) {
      await this.createTreeForTypeTree(obj, rootNode);
    } else if (typeof obj.constructor.exposedAttributes != 'undefined' || typeof obj.exposedAttributes != 'undefined') {
      const exposedAttributes = obj.constructor.exposedAttributes ?? obj.exposedAttributes;
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      for (let attr of exposedAttributes) {
        let val = obj[attr];
        if (val instanceof Uint8Array) {
          val = `<Uint8Array: ${val.length}>`;  // we probably shouldn't render this
        }
        if (typeof val == 'undefined') {
          // Try calling a function to get the value - maybe it's dynamic
          if (typeof obj.get == 'function') {
            val = obj.get(attr);
          } else {
            // throw new Error(`value "${attr}" not present in object and no getter function found`);
            val = null;
          }
        }
        await this.createTreeForObject(val, rootNode + '-' + name, attr);
      }
    } else if (obj instanceof Array) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      for (let i = 0; i < obj.length; i++) {
        await this.createTreeForObject(obj[i], rootNode + '-' + name, i);
      }
    } else {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon, true);
    }
  }

  async setupResolver() {
    const preview = document.getElementById('preview');
    document.body.addEventListener('bundle-resolve-request', data => {
      if (this.isExporting) {
        return false;  // another listener is set up
      }
      let path = data.detail;
      console.log('Received bundle resolution request for path', path);
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
          } else if (path === '') {  // some textures have this -- not sure how to handle it
            document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: false, data: null}}));
          } else {
            console.warn('no matches, left with path:', path);
            const text = document.createElement('h2');
            text.classList.add('no-preview');
            text.innerText = `Requires file: ${path}`;
            const br = document.createElement('br');
            const input = document.createElement('input');
            input.id = 'ext' + 'xxxxxxxx'.replaceAll('x', () => Math.floor(Math.random() * 256).toString(16));
            input.classList.add('external-input');
            input.type = 'file';
            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.classList.add('external-input-button');
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
              }
              reader.readAsArrayBuffer(input.files[0]);
            });
            function cancelListener() {
              document.body.removeEventListener('destroy-preview', cancelListener);
              document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: false, data: null}}));
            }
            document.body.addEventListener('destroy-preview', cancelListener);

            text.appendChild(br);
            text.appendChild(input);
            text.appendChild(label);
            preview.innerHTML = '';
            preview.appendChild(text);
            return true;
          }
        }
      }
      document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: true, data: match}}));
    });
  }

  async exportAssets(root, parser) {
    let objects = root.folder('Objects');
    let objectInfo = objects.folder('Info');
    let typetrees = root.folder('Type trees');
    let externals = root.folder('Externals');
    let reftypes = root.folder('Reference types');
    let i = 0;
    let total = parser.objects.objects.length;
    for (let obj of parser.objects.objects) {
      try {
        let object = obj.object;
        let name = object.name;
        if (name === '<unnamed>' || name === '<empty>' || (typeof name == 'undefined') || name === '') {
          name = getClassName(obj.classID);
        }
        document.body.dispatchEvent(new CustomEvent('export-progress-update', {
          detail: {
            percent: i / parser.objects.objects.length * 100,
            index: i,
            total: total,
            name: name
          }
        }));
        await object.saveInfo(objectInfo, name + '_' + i);
        try {
          await object.saveObject(objects, name + '_' + i);
        } catch (e) {
          objects.file('ERROR_' + name + '_' + i, 'ERROR: Failed to export object:' + e.toString());
        }
      } catch (e) {
        console.error(`Error while exporting asset #${i}:`, e);
      }
      i++;
    }
  }

  async exportResource(root) {
    root.file(
      'README.txt',
      `This file is a resource file, which contains raw data and has no use being exported.
It was likely used while exporting other files (such as images or meshes), and contained
data like pixels, vertices, and UV maps used by the asset.`
    );
  }

  async exportOther(root) {
    root.file(
      'README.txt',
      'Could not export file: could not determine file type.'
    );
  }

  async exportFile(folder, type, parser) {
    switch (type) {
      case FileType.Assets:
        await this.exportAssets(folder, parser);
        break;
      case FileType.Bundle:
        break;
      case FileType.Resource:
        await this.exportResource(folder);
        break;
      default:
        await this.exportOther(folder)
        break;
    }
  }

  async createZip() {
    let zip = new JSZip();
    if (this.parser instanceof AssetFile) {
      await this.exportFile(zip, FileType.Assets, this.parser);
    } else {
      for (let file of this.treeFiles) {
        let folder = zip.folder(file.fileName);
        await this.exportFile(folder, file.type, file.parser.parser);
      }
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

  applyObjectClassFilter() {
    this.forEachObject(obj => {
      const isHidden = !this.filterAllOfKey('objectclass', obj.data.data.getClassName());
      this.tree.jstree('show_node', obj);
      if (this.hideFiltered) {
        if (isHidden) {
          this.tree.jstree('hide_node', obj);
        }
      } else {
        this.tree.jstree(
          'rename_node',
          obj,
          this.styleObject(
            obj.data.data,
            isHidden
          )
        );
      }
    });
    this.tree.jstree(true).redraw(true);
  }

  applyFilter() {
    this.applyObjectClassFilter();
  }

  async loadBundle() {
    await this.createTreeForObject(this.parser, '#', 'Bundle', 'bundle', 'icon-bundle');
    await this.setupResolver();
  }

  async loadAssets() {
    await this.createTreeForObject(this.parser, '#', 'Asset', 'asset', 'icon-asset');
    await this.setupResolver();
  }

  async loadWeb() {
    await this.createNode('#', 'base', this.styleTextAs('Asset', 'asset'), 'icon-asset');
    for (const file of this.parser.files) {
      const data = this.parser.get(file.path);
      const f = new UnityFS(data);
      f.parseHeader();
      let fileParser;
      switch (f.fileType) {
        case FileType.Bundle:
          fileParser = new BundleFile(new BinaryReader(data));
          await fileParser.parse();
          await this.createTreeForObject(fileParser, 'base', 'Bundle', 'bundle', 'icon-bundle');
          break;
        case FileType.Assets:
          fileParser = new AssetFile(new BinaryReader(data));
          await fileParser.parse();
          await this.createTreeForObject(fileParser, 'base', 'Asset', 'bundle', 'icon-asset');
          break;
        case FileType.Web:
          fileParser = new WebFile(new BinaryReader(data));
          await fileParser.parse();
          await this.createTreeForObject(fileParser, 'base', 'Asset', 'bundle', 'icon-asset');
          break;
      }
    }
  }

  async onNodeSelect(evt, data) {
    const preview = document.getElementById('preview');
    console.log(data.node.data.data);
    if (data.node.data.type === 'object') {
      if (data.node.data.isNone) return;
      document.body.dispatchEvent(new CustomEvent('destroy-preview'));
      let object = data.node.data.data;
      preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
      object.getPreview().then(prev => {
        preview.innerHTML = '';
        preview.appendChild(prev);
      });
      let name = object.object.m_Name;
      if (name === '<unnamed>' || name === '<empty>' || (typeof name == 'undefined') || name === '') {
        name = getClassName(data.node.data.data.classID);
      }

      document.getElementById('download-info').onclick = async () => {
        saveBlob(name + '.json', [JSON.stringify(
          await object.getInfo(),
          (_, v) => typeof v === 'bigint' ? v.toString() : v,
          2)]);
      };
      document.getElementById('download-object').onclick = async () => {
        saveBlob(name + object.exportExtension, [await object.getAnyExport()]);
      };
      document.getElementById('download-raw').onclick = async () => {
        saveBlob(name + '.dat', [object._raw]);
      };
    } else if (data.node.data.type === 'pptr') {
      let pptr = data.node.data.data;
      pptr.resolve();
    }
  }

  async onNodeOpen(evt, data) {
    let parent = data.node.id;
    let dataDesc = data.node.data;
    if (dataDesc.type === 'object' && !dataDesc.data.hasRenderedOn.includes(parent)) {
      await this.createNode(parent, parent + 'classID', this.styleKeyValue('classID', dataDesc.data.classID), 'icon-generic');
      await this.createNode(parent, parent + 'isDestroyed', this.styleKeyValue('isDestroyed', dataDesc.data.isDestroyed), 'icon-generic');
      await this.createNode(parent, parent + 'offset', this.styleKeyValue('offset', dataDesc.data.offset), 'icon-generic');
      await this.createNode(parent, parent + 'pathID', this.styleKeyValue('pathID', dataDesc.data.pathID), 'icon-generic');
      await this.createNode(parent, parent + 'scriptTypeIndex', this.styleKeyValue('scriptTypeIndex', dataDesc.data.scriptTypeIndex), 'icon-generic');
      await this.createNode(parent, parent + 'size', this.styleKeyValue('size', dataDesc.data.size), 'icon-generic');
      await this.createNode(parent, parent + 'stripped', this.styleKeyValue('stripped', dataDesc.data.stripped), 'icon-generic');
      await this.createTreeForObject(dataDesc.data.object, parent, 'object');
      dataDesc.data.hasRenderedOn.push(parent);

      await this.removeNode(parent + '-placeholder');
    } else if (dataDesc.type === 'typetree' && !(dataDesc.data.classID + '_' + dataDesc.data.scriptTypeIndex in this.typeTrees)) {
      await this.createNode(parent, parent + 'classID', this.styleKeyValue('classID', dataDesc.data.classID), 'icon-generic');
      await this.createNode(parent, parent + 'offset', this.styleKeyValue('offset', dataDesc.data.offset), 'icon-generic');
      await this.createNode(parent, parent + 'scriptTypeIndex', this.styleKeyValue('scriptTypeIndex', dataDesc.data.scriptTypeIndex), 'icon-generic');
      await this.createNode(parent, parent + 'isStripped', this.styleKeyValue('isStripped', dataDesc.data.isStripped), 'icon-generic');
      await this.createTreeForObject(dataDesc.data.tree, parent, 'tree');
      this.typeTrees[dataDesc.data.classID + '_' + dataDesc.data.scriptTypeIndex] = parent + '-tree';

      await this.removeNode(parent + '-placeholder');
    }
  }

  async loadFile(data) {
    this.treeFiles = [];
    this.treeObjects = {};

    this.objectBranches = {};
    this.typeTrees = {};

    this.providedExternals = {};

    this.isExporting = false;

    if (this.parser) this.parser.destroy();

    this.parser = new UnityFS(data);
    await this.parser.parse();

    this.activeFilter = [];

    this.initTree();
    this.initListeners();
    this.initFilter(
      [
        // 'type',
        // 'name',
        'objectclass',
      ],
      {
        // type: [
        //   'bundle',
        //   'asset',
        //   'typetree',
        //   'object',
        //   'external',
        //   'reftype',
        //   'value'
        // ],
        objectclass: classNames
      }
    )

    const fileType = this.parser.fileType;

    if (typeof this.parser.parser != 'undefined') {
      this.parser = this.parser.parser;
    }

    switch (fileType) {
      case FileType.Bundle:
        await this.loadBundle();
        break;
      case FileType.Assets:
        await this.loadAssets();
        break;
      case FileType.Web:
        await this.loadWeb();
        break;
    }

    this.postInit();
  }
}
