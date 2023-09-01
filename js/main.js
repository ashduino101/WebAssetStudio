import {decodeETC2} from "./unityfs/texture2d";
import {AssetFile, ObjectCollection, ObjectInfo, TypeTreeReference} from "./unityfs/assetFile";
import {BinaryReader} from "./unityfs/reader";
import {FileType, UnityFS} from "./unityfs/unityFile";
import {FSB5} from "./fsb5/fsb5";
import {testData} from "./test";
import {HexView} from "./hexview";
import $ from 'jquery';
import 'jstree';
import '../css/vendor/jstree/style.min.css';
import {BundleFile, NodeFile} from "./unityfs/bundleFile";
import ClassIDType from "./unityfs/classIDType";
import {getClassName} from "./unityfs/utils";

function fsb5Test(data) {
  let len = data.length;
  let offset = 0;
  let reader = new BinaryReader(data);
  reader.endian = 'little';
  while (reader.offset < len) {
    const parser = new FSB5();
    parser.reader = reader;
    parser.parse();
    if (parser.format.name === 'IMA ADPCM') {
      console.log(parser);
    }
  }
  console.log('done');
}

function imgTest(data) {
  console.log(decodeETC2(data, 100, 100));
}

function inputTest() {
  const input = document.getElementById('file-input');
  input.addEventListener('change', e => {
    let f = e.target.files[0];
    // f.slice(0, 16).arrayBuffer().then(s => console.log(new Uint8Array(s)));
    let reader = new FileReader();
    reader.onloadend = b => {
      let arr = new Uint8Array(reader.result);

      const fsReader = new UnityFS(arr);
      fsReader.parse();
      // fsb5Test(arr);
    }
    reader.readAsArrayBuffer(f);
  });
}

function dataTest() {
  const reader = new UnityFS(testData);
  reader.parse();
}

class AssetTree {
  constructor(selector) {
    this.tree = $(selector);

    // this.loadFile(testData);

    this.treeFiles = [];
    this.treeObjects = {};

    this.objectBranches = {};
    this.typeTrees = {};
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
      '&lt;not loaded&gt;',
      'icon-generic'
    );
  }

  async createTreeForObject(obj, rootNode, name, style = 'generic', icon = 'icon-generic', isOpened = false) {
    if (typeof obj.exposedAttributes != 'undefined') {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(name, style), icon, isOpened);
      for (let attr of obj.exposedAttributes) {
        let val = obj[attr];
        if (typeof val == 'undefined') {
          // Try calling a function to get the value - maybe it's dynamic
          if (typeof obj.get == 'function') {
            val = obj.get(attr);
          } else {
            throw new Error(`value "${attr}" not present in object and no getter function found`);
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
        // we can just load bundles now
        if (file.fileType === FileType.Bundle) {
          file.parse();
          await this.createTreeForObject(file.parser, rootNode + '-' + name, 'Bundle', 'bundle', 'icon-bundle');
        } else {
          this.treeFiles.push({  // only asset/resource files
            treeNode: rootNode + '-' + name,
            fileName: obj.node.path,
            parser: file,
          });
          if (file.fileType === FileType.Assets) {
            file.parse();
            // this.treeObjects[name] = file.parser.objects.objects;
            // file.parser.objects.fileID = name;
            await this.createTreeForObject(file.parser, rootNode, obj.node.path, 'asset', 'icon-asset');
          } else {
            await this.createNode(rootNode, rootNode + '-' + name, this.styleTextAs(obj.node.path, newStyle), newIcon, isOpened);
          }
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

  async loadBundle() {
    await this.createTreeForObject(this.parser, '#', 'Bundle', 'bundle', 'icon-bundle');

    document.body.addEventListener('bundle-resolve-request', data => {
      let path = data.detail;
      if (path.startsWith('archive:/')) {
        path = path.substring('archive:/'.length, path.length);
      }
      let matches = this.treeFiles.filter(f => f.fileName === path);
      let match;
      if (matches.length > 0) {
        match = matches[0];
      } else {
        path = path.substring(path.indexOf('/') + 1, path.length);
        matches = this.treeFiles.filter(f => f.fileName === path);
        if (matches.length > 0) {
          match = matches[0];
        } else {
          console.warn('no matches, left with path:', path);
          document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: false, data: null}}));
          return false;
        }
      }
      let outData = match.parser.reader.data;
      document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: true, data: outData}}));
    });
  }

  async loadAssets() {
    await this.createTreeForObject(this.parser, '#', 'Asset', 'asset', 'icon-asset');

    document.body.addEventListener('bundle-resolve-request', data => {
      let path = data.detail;
      if (path.startsWith('archive:/')) {
        path = path.substring('archive:/'.length, path.length);
      }
      let matches = this.treeFiles.filter(f => f.fileName === path);
      let match;
      if (matches.length > 0) {
        match = matches[0];
      } else {
        path = path.substring(path.indexOf('/') + 1, path.length);
        matches = this.treeFiles.filter(f => f.fileName === path);
        if (matches.length > 0) {
          match = matches[0];
        } else {
          console.warn('no matches, left with path:', path);
          document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: false, data: null}}));
          return false;
        }
      }
      let outData = match.parser.reader.data;
      document.body.dispatchEvent(new CustomEvent('bundle-resolve-response', {detail: {status: true, data: outData}}));
    });
  }

  async loadFile(data) {
    this.parser = new UnityFS(data);
    this.parser.parse();

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
        let object = data.node.data.data.object;
        if (typeof object.createPreview === 'function') {
          preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
          object.createPreview().then(prev => {
            preview.innerHTML = '';
            preview.appendChild(prev);
          });
        }
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
    }
    reader.readAsArrayBuffer(f);
  });
}

main();
