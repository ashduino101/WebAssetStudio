import {AssetTree} from "../treeview";
import {GodotFile} from "./godotFile";
import {fileTypes} from "../fileHandler";

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
            children: []
          }
          currentNode.push(newNode);
          currentNode = newNode.children;
        }
      }
    }
    const createPath = async (parent, elem) => {
      await this.createNode(
        parent,
        parent + '-' + elem.text,
        this.styleTextAs(elem.text, 'generic'),
        elem.children.length === 0 ? 'icon-generic' : 'icon-dir'
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
        await this.loadResource();
        break;
    }

    this.postInit();
  }
}
