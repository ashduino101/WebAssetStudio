import {AssetTree} from "./treeview";

export default class DefaultTree extends AssetTree {
  async loadFile() {
    // can't do much here
    this.tree[0].children[0].innerText = 'No tree available';
  }
}