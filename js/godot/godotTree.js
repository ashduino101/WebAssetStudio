import {AssetTree} from "../treeview";
import {GodotFile} from "./godotFile";
import {fileTypes} from "../fileHandler";
import {VariantParser} from "./variantParser";
import {Resource} from "./resource";
import {BinaryReader} from "../binaryReader";
import {saveBlob} from "../utils";

export class GodotTree extends AssetTree {
  async createTreeForObject(obj, rootNode, name, style = 'generic', icon = 'icon-generic', isOpened = false) {
    if (obj == null) {
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon);
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
      await this.createNode(rootNode, rootNode + '-' + name, this.styleKeyValue(name, obj), icon);
    }
  }

  styleNameClass(name, className) {
    return `<span class="tree-label label-objectname">${this.htmlEscape(name)}</span>
            <span class="tree-label label-generic"> : </span>
            <span class="tree-label label-objecttype">${className}</span>`;
  }

  async onNodeSelect(evt, data) {
    if (data.node.data.type === 'pck_import') {
      const imp = data.node.data.import;
      if (imp.err) {
        console.error(`At line ${imp.line}:`, imp.err);
      } else {
        const remap = imp.value.remap;
        let src = imp.value.deps.source_file;
        if (src) {
          src = src.substring(src.lastIndexOf('/') + 1);
        }
        if (!remap) {
          console.error('no remap available');
          return;
        }
        let path = remap.path;
        let file = this.parser.getFile(path);
        if (!file) {
          console.error('could not get file');
          return;
        }
        let res = new Resource(new BinaryReader(this.parser.getData(file), 'little'));
        await res.load();
        let filename = data.node.data.filename;
        if (filename.endsWith('.import')) {
          filename = filename.substring(0, filename.length - 7);
        }
        document.getElementById('download-object').onclick = () => {
          saveBlob(src ?? filename, [res.getExport()]);
        }
        const preview = document.getElementById('preview');
        preview.innerHTML = '<h2 class="no-preview">Loading preview...</h2>';
        let prevElem = await res.createPreview();
        preview.innerHTML = '';
        preview.appendChild(prevElem);
      }
    }
  }

  async onNodeOpen(evt, data) {

  }

  getIconClass(typeID) {
    switch (typeID) {
      case 'AudioStreamSample':
        return 'icon-wav';
      case 'AudioStreamOGGVorbis':
        return 'icon-ogg';
      case 'AudioStreamMP3':
        return 'icon-mp3';
      case 'StreamTexture':
      case 'CompressedTexture':
        return 'icon-img';
      default:
        return 'icon-generic';
    }
  }

  async createTreeForPck(parent) {
    await this.createNode(parent, parent + '-files', this.styleTextAs('res://', 'generic'), 'icon-dir');
    let nodes = [];
    for (let path of this.parser.pathOrder) {
      if (path.startsWith('res://')) {
        path = path.substring(6);
      }
      let currentNode = nodes;

      let parts = path.split('/');
      for (let part of parts) {
        let existingNode = currentNode.find(function(node) {
          return node.text === part;
        });
        if (existingNode) {
          currentNode = existingNode.children;
        } else {
          let newNode = {
            text: part,
            children: [],
            root: path
          }
          currentNode.push(newNode);
          currentNode = newNode.children;
        }
      }
    }
    const createPath = async (parent, elem) => {
      let d = {type: 'pck_entry'};
      let icon = 'icon-generic';
      let text = this.styleTextAs(elem.text, 'generic');
      if (elem.children.length > 0) {
        d.type = 'pck_dir';
        d.path = elem.root;
        icon = 'icon-dir';
      } else if (elem.text.endsWith('.import')) {
        d.type = 'pck_import';
        d.import = new VariantParser(
          new TextDecoder('utf-8').decode(
            this.parser.getData(
              this.parser.getFile(elem.root)
            )
          )
        ).parseResource();
        d.filename = elem.text;
        let type = d.import.value?.remap?.type ?? 'Unknown';
        icon = this.getIconClass(type);
        text = this.styleNameClass(elem.text, type);
      }
      await this.createNode(
        parent,
        parent + '-' + elem.text,
        text,
        icon,
        false,
        d
      );
      for (const child of elem.children) {
        await createPath(parent + '-' + elem.text, child);
      }
      if (elem.text.startsWith('.')) {
        this.tree.jstree('hide_node', parent + '-' + elem.text);
      }
    }

    for (const node of nodes) {
      await createPath(parent + '-files', node);
    }
  }

  async loadPck() {
    await this.createNode('#', '#-package', this.styleTextAs('Package', 'bundle'), 'icon-bundle');
    await this.createTreeForPck('#-package');

  }

  async loadResource() {

  }

  applyFilter() {

  }

  async loadFile(data, baseOffset = 0) {
    this.treeFiles = [];

    this.objectBranches = {};

    this.isExporting = false;

    this.parser = new GodotFile(data, baseOffset);

    this.activeFilter = [];

    this.initTree();
    this.initListeners();
    this.initFilter(
      [],
      {}
    );

    const fileType = this.parser.fileType;

    if (typeof this.parser.parser != 'undefined') {
      this.parser = this.parser.parser;
    }

    switch (fileType) {
      case fileTypes.GodotPck:
        await this.loadPck();
        break;
      case fileTypes.GodotResource:
        await this.parser.load();
        await this.loadResource();
        break;
    }

    this.postInit();
  }
}
