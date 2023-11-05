import $ from "jquery";
import {compareFilter, saveBlob} from "./utils";
import Filter from "./filter";

export class AssetTree {
  constructor(selector) {
    this.tree = $(selector);
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

  styleObject(object, isHidden = false) {
    return `<span class="tree-label label-objectname ${isHidden ? "hidden" : ""}">Not overridden -- this is a bug!</span>`;
  }

  async createNode(parent, nodeID, nodeText, nodeIcon, isOpen = false, data = {}) {
    return new Promise(resolve => {
      this.tree.jstree('create_node', parent, {
        "id": nodeID,
        "text": nodeText,
        "icon": nodeIcon,
        "opened": isOpen,
        "data": data
      }, "last", resolve);
    });
  }

  async removeNode(nodeID) {
    return new Promise(resolve => {
      this.tree.jstree().delete_node(nodeID);
      resolve();
    });
  }

  forEachObject(fn) {
    Object.values($(this.tree.jstree().get_json('#', {
      flat: true
    }))).filter(v => v.data?.type === 'object').forEach(fn);
  }

  async createZip() {
    console.error('This needs to be overridden by the child class!');
  }

  onExportStart() {
    this.isExporting = true;
    const darken = document.getElementById('darken');
    const modal = document.getElementById('modal');
    darken.style.display = 'block';
    modal.innerHTML = '';

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
    return {
      bar,
      innerBar,
      subtitle
    }
  }

  onExportEnd() {
    const darken = document.getElementById('darken');
    this.isExporting = false;
    darken.style.display = 'none';
  }

  async exportZip() {
    console.error('This should be overridden by the child class! ' +
      'Remember to call `onExportStart` and `onExportEnd`, and `downloadZip` to create the zip.');
  }

  async downloadZip() {
    return saveBlob('bundle.zip', [await this.createZip()], 'application/zip');
  }

  applyFilter() {
    console.error('This should be overridden by the child class.');
  }

  setFilter(filter) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  hasFilter(key) {
    return this.activeFilter.filter(f => f.key === key).length > 0;
  }

  filterAllOfKey(key, value) {
    let filters = this.activeFilter.filter(f => f.key === key);
    let res = [];
    for (let f of filters) {
      res.push(compareFilter(f.op, f.val, value));
    }
    return !res.includes(false);
  }

  initTree() {
    const preview = document.getElementById('preview');

    document.body.dispatchEvent(new CustomEvent('destroy-preview'));
    preview.innerHTML = '<h2 class="no-preview">Select an object to preview</h2>';

    this.tree.jstree("destroy").empty();
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
  }

  initFilter(validKeys, valueSuggestions) {
    this.activeFilter = [];

    this.filter = new Filter();
    this.filter.validKeys = validKeys;
    this.filter.valueSuggestions = valueSuggestions;
    this.filter.onFilter = this.setFilter.bind(this);

    document.getElementById('hide-filtered').addEventListener('input', e => {
      this.hideFiltered = e.target.checked;
      this.applyFilter();
    });
    this.hideFiltered = document.getElementById('hide-filtered').checked;
  }

  initListeners() {
    this.tree.on("select_node.jstree", this.onNodeSelect.bind(this));
    this.tree.on("open_node.jstree", this.onNodeOpen.bind(this));
  }

  postInit() {
    this.filter.onSubmit(this.filter.input.value);
  }

  async init() {
    console.error('This method should be overridden by the child class! ' +
      'Remember to call initTree, initListeners, and initFilter, as well as postInit at the end.');
  }

  async onNodeOpen(evt, data) {
    console.error('This method should be overridden by the child class!');
  }

  async onNodeSelect(evt, data) {
    console.error('This method should be overridden by the child class!');
  }

  async loadFile(data) {
    console.error('This method should be overridden by the child class!');
  }
}
