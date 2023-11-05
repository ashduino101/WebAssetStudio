import {AssetTree} from "./treeview";

export default class DefaultTree extends AssetTree {
  async loadFile() {
    // can't do much here
    this.tree[0].innerHTML = '<h2 class="no-preview" id="no-tree">No tree available</h2>';
  }
}