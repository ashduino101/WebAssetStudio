import {typeReaders} from "../readers";

export class BaseType {
  exportExtension = '.dat';
  canExport = false;

  constructor(reader) {
  }

  async createPreview() {
    return document.createElement('div');
  }

  getClassName() {
    // TODO this is bad
    return Object.values(typeReaders).filter(v => v[0].name === this.constructor.name)[0][1];
  }

  getJSON(object) {
    return new TextEncoder().encode(JSON.stringify(object, (_, v) => v instanceof Uint8Array ? null : v, 2));
  }

  async getExport() {
    console.error('Override this function in the child class!');
  }

  async getAnyExport() {
    return this.canExport ? await this.getExport() : this.getJSON();
  }
}