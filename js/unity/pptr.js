
window._global__destroyable = window._global__destroyable ?? [];

export class PPtr {
  constructor(reader) {
    this.fileID = reader.readInt32();
    this.pathID = reader.fileVersion < 14 ? BigInt(reader.readInt32()) : reader.readInt64();
    this._object = null;
    this.info = null;
    this._boundEventHandler = this.handleEvent.bind(this);

    document.body.addEventListener(`pptr-resolve-response_${this.fileID}_${this.pathID}`, this._boundEventHandler);

    window._global__destroyable.push(() => this.destroy());
  }

  get object() {
    this.resolve();
    return this._object;
  }

  handleEvent(data) {
    let {status, fileID, object} = data.detail;
    if (status && this.pathID === object.pathID && this.fileID === fileID) {
      this.info = object;
      this._object = this.info.object;
    }
  }

  resolve() {
    if (this.fileID !== 0) {
      console.error('cross-file externals unsupported');
      return;
    }
    if (this._object != null) return;
    document.body.dispatchEvent(new CustomEvent('pptr-resolve-request', {detail: {fileID: this.fileID, pathID: this.pathID}}));
  }

  destroy() {
    document.body.removeEventListener(`pptr-resolve-response_${this.fileID}_${this.pathID}`, this._boundEventHandler);
  }
}