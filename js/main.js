import {AssetFile, ObjectCollection, TypeTreeReference} from "./unityfs/assetFile";
import {FileType, UnityFS} from "./unityfs/unityFile";
import {FSB5} from "./fsb5/fsb5";
import {HexView} from "./hexview";
import $ from 'jquery';
import 'jstree';
import '../css/vendor/jstree/style.min.css';
import {NodeFile} from "./unityfs/bundleFile";
import {getClassName} from "./unityfs/utils";
import JSZip from 'jszip';
import {Resource} from "./godot/resource";
import {BinaryReader} from "./binaryReader";
import {PakFile} from "./unreal/pakfile";
import {CSharpDecompiler} from "./cs-decomp/decompiler";

class AssetTree {
  constructor(selector) {
    this.tree = $(selector);

    // this.loadFile(testData);

    this.treeFiles = [];
    this.treeObjects = {};

    this.objectBranches = {};
    this.typeTrees = {};

    this.providedExternals = {};

    this.isExporting = false;
  }

  htmlEscape(text) {
    return new Option(text).innerHTML;
  }

  styleTextAs(text, style) {
    return `<span class="tree-label label-${style}">${this.htmlEscape(text)}</span>`;
  }

  styleKeyValue(key, value) {
    let valueClass = 'generic'
    switch (typeof value) {
      case 'number':
      case 'bigint':
        valueClass = 'numeric';
        break;
      case 'string':
        valueClass = 'string';
        break;
      case 'boolean':
        valueClass = 'bool';
        break;
      case 'object':  // probably shouldn't be
      case 'symbol':
        valueClass = 'object';
        break;
      case 'undefined':
        valueClass = 'undefined';
        break;
    }
    return `<span class="tree-label label-generic">${this.htmlEscape(key)}: </span>
            <span class="tree-value value-${valueClass}">${this.htmlEscape(value)}</span>`;
  }

  styleObject(object) {
    return `<span class="tree-label label-objectname">${this.htmlEscape(object.name)}</span>
            <span class="tree-label label-generic"> : </span>
            <span class="tree-label label-objecttype">${this.htmlEscape(object.getClassName())}</span>
            <span class="tree-label label-objectid"> @ ${this.htmlEscape(object.pathID)}</span>`;
  }

  async createNode(parent, nodeID, nodeText, nodeIcon, isOpen = false, data = {}) {
    return new Promise(resolve => {
      this.tree.jstree('create_node', parent, {
        "id": nodeID,
        "text": nodeText,
        "icon": nodeIcon,
        "opened": isOpen,
        "data": data
      }, "last", function() {
        resolve();
      });
    });
  }

  async removeNode(nodeID) {
    return new Promise(resolve => {
      this.tree.jstree().delete_node(nodeID);
      resolve();
    });
  }

  async createTreeForObjectCollection(collection, rootNode) {
    await this.createNode(rootNode, rootNode + '-objects', this.styleTextAs('objects', 'generic'), 'icon-generic', true);
    for (let obj of collection.objects) {
      obj.setCaching(false);
      await this.createNode(
        rootNode + '-objects',
        rootNode + '-objects-' + obj.pathID,
        this.styleObject(obj),
        'icon-object',
        true,
        // {pathID: obj.pathID, fileID: collection.fileID}
        {type: 'object', data: obj, root: rootNode}
      );
      await this.createNode(
        rootNode + '-objects-' + obj.pathID,
        rootNode + '-objects-' + obj.pathID + '-placeholder',
        '&lt;not loaded&gt;',
        'icon-generic'
      );
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
    if (typeof obj.constructor.exposedAttributes != 'undefined') {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      for (let attr of obj.constructor.exposedAttributes) {
        let val = obj[attr];
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
      // Special types
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
          file.parse();
          await this.createTreeForObject(file.parser, rootNode + '-' + name, 'Bundle', 'bundle', 'icon-bundle');
        } else if (file.fileType === FileType.Assets) {
          file.parse();
          await this.createTreeForObject(file.parser, rootNode, obj.node.path, 'asset', 'icon-asset');
        } else {
          await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(obj.node.path, newStyle), newIcon, isOpened);
        }
      } else if (obj instanceof ObjectCollection) {
        await this.createTreeForObjectCollection(obj, rootNode);
      } else if (obj instanceof TypeTreeReference) {
        await this.createTreeForTypeTree(obj, rootNode);
      } else {
        await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon, true);
      }
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
            document.body.addEventListener('destroy-preview', cancelListener)

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

  async exportZip() {
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

  saveBlob(filename, data, type) {
    const file = new Blob(data, {type: type});
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  async downloadZip() {
    return this.saveBlob('bundle.zip', [await this.exportZip()], 'application/zip');
  }

  async loadBundle() {
    await this.createTreeForObject(this.parser, '#', 'Bundle', 'bundle', 'icon-bundle');
    await this.setupResolver();
  }

  async loadAssets() {
    await this.createTreeForObject(this.parser, '#', 'Asset', 'asset', 'icon-asset');
    await this.setupResolver();
  }

  async loadFile(data) {
    this.parser = new UnityFS(data);
    this.parser.parse();

    this.tree.empty();
    this.tree.jstree({
      "core" : {
        "themes" : {
          "responsive": false
        },
        "check_callback" : true,
        "data": [],
      },
      "types" : {
        "asset" : {
          "icon" : "icon-asset"
        },
        "bundle" : {
          "icon" : "icon-bundle"
        }
      },
      "plugins": ["types"]
    });

    const preview = document.getElementById('preview');
    this.tree.on("select_node.jstree", async (evt, data) => {
      if (data.node.data.type === 'object') {
        document.body.dispatchEvent(new CustomEvent('destroy-preview'));
        let object = data.node.data.data.object;
        if (typeof object.createPreview === 'function') {
          preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
          object.createPreview().then(prev => {
            preview.innerHTML = '';
            preview.appendChild(prev);
          });
        }
        let name = object.name;
        if (name === '<unnamed>' || name === '<empty>' || (typeof name == 'undefined') || name === '') {
          name = getClassName(data.node.data.data.classID);
        }

        document.getElementById('download-info').onclick = async () => {
          this.saveBlob(name + '.json', [JSON.stringify(await object.getInfo(), undefined, 2)]);
        };
        document.getElementById('download-object').onclick = async () => {
          this.saveBlob(name + object.exportExtension, [await object.getAnyExport()]);
        };
      }
    })

    this.tree.on("open_node.jstree", async (evt, data) => {
      let parent = data.node.id;
      let dataDesc = data.node.data;
      if (dataDesc.type === 'object' && !(dataDesc.data.pathID in this.objectBranches)) {
        await this.createNode(parent, parent + 'classID', this.styleKeyValue('classID', dataDesc.data.classID), 'icon-generic');
        await this.createNode(parent, parent + 'isDestroyed', this.styleKeyValue('isDestroyed', dataDesc.data.isDestroyed), 'icon-generic');
        await this.createNode(parent, parent + 'offset', this.styleKeyValue('offset', dataDesc.data.offset), 'icon-generic');
        await this.createNode(parent, parent + 'pathID', this.styleKeyValue('pathID', dataDesc.data.pathID), 'icon-generic');
        await this.createNode(parent, parent + 'scriptTypeIndex', this.styleKeyValue('scriptTypeIndex', dataDesc.data.scriptTypeIndex), 'icon-generic');
        await this.createNode(parent, parent + 'size', this.styleKeyValue('size', dataDesc.data.size), 'icon-generic');
        await this.createNode(parent, parent + 'stripped', this.styleKeyValue('stripped', dataDesc.data.stripped), 'icon-generic');
        await this.createTreeForObject(dataDesc.data.object, parent, 'object');
        this.objectBranches[dataDesc.data.pathID] = parent + '-object';

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
    })

    const fileType = this.parser.fileType;

    if (typeof this.parser.parser != 'undefined') {
      this.parser = this.parser.parser;
    }
    console.log(this.parser)

    switch (fileType) {
      case FileType.Bundle:
        await this.loadBundle();
        break;
      case FileType.Assets:
        await this.loadAssets();
        break;
    }
  }
}

function hexTest() {
  let hexContainer = document.createElement('div');
  hexContainer.style.position = 'absolute';
  hexContainer.style.right = '0';
  hexContainer.style.top = '0';
  const hexView = new HexView(testData, hexContainer);
  document.body.appendChild(hexContainer);
}

// inputTest();
// hexTest();

async function exportZip(tree) {
  tree.isExporting = true;
  const darken = document.getElementById('darken');
  const modal = document.getElementById('modal');
  darken.style.display = 'block';

  let bar = document.createElement('div');
  bar.classList.add('progress-bar');
  let innerBar = document.createElement('div');
  innerBar.classList.add('progress-bar-inner');
  let title = document.createElement('h2');
  title.classList.add('modal-title');
  title.textContent = 'Export progress';
  let subtitle = document.createElement('p');
  subtitle.classList.add('modal-subtitle');
  bar.appendChild(innerBar);
  modal.appendChild(title);
  modal.appendChild(bar);
  modal.appendChild(subtitle);
  document.body.addEventListener('export-progress-update', e => {
    let percent = e.detail.percent;
    innerBar.style.width = `${percent}%`;
    subtitle.textContent = `${e.detail.index + 1} / ${e.detail.total} : ${e.detail.name}`;
  });
  document.body.addEventListener('bundle-resolve-request', data => {
    let path = data.detail;
    // console.log('From exporter: Received bundle resolution request for path', path);
    if (path.startsWith('archive:/')) {
      path = path.substring('archive:/'.length, path.length);
    }
    let matches = tree.treeFiles.filter(f => f.fileName === path);
    let match;
    if (matches.length > 0) {
      match = matches[0].parser.reader.data;
    } else {
      path = path.substring(path.indexOf('/') + 1, path.length);
      matches = tree.treeFiles.filter(f => f.fileName === path);
      if (matches.length > 0) {
        match = matches[0].parser.reader.data;
      } else {
        if (tree.providedExternals[path] !== undefined) {
          match = tree.providedExternals[path];
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
              tree.providedExternals[path] = new Uint8Array(reader.result);
              document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {
                detail: {
                  status: true,
                  data: tree.providedExternals[path]
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
    tree.downloadZip().then(() => {
      tree.isExporting = false;
      darken.style.display = 'none';
    });
  }, 0);
}

// MAIN
function main() {
  const tree = new AssetTree('#tree');
  const input = document.getElementById('file-input');
  input.addEventListener('change', e => {
    let f = e.target.files[0];
    let reader = new FileReader();
    reader.onloadend = async b => {
      let arr = new Uint8Array(reader.result);
      await tree.loadFile(arr);
      document.getElementById('export-zip').onclick = async () => setTimeout(() => exportZip(tree), 0);
    }
    reader.readAsArrayBuffer(f);
  });
}

function testClass() {
  const input = document.getElementById('file-input');
  input.addEventListener('change', e => {
    let f = e.target.files[0];
    let reader = new FileReader();
    reader.onloadend = async b => {
      let arr = new Uint8Array(reader.result);
      const obj = new FSB5(arr);
      await obj.playAudio();
    }
    reader.readAsArrayBuffer(f);
  });
}

main();
// testClass();
