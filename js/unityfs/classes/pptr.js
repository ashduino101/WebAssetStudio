export class PPtr {
  constructor(reader) {
    this.fileID = reader.readInt32();
    this.pathID = reader.fileVersion < 14 ? BigInt(reader.readInt32()) : reader.readInt64();
    this.object = null;
    this.info = null;
    document.body.addEventListener(`pptr-resolve-response_${this.fileID}_${this.pathID}`, this.handleEvent.bind(this));
  }

  handleEvent(data) {
    console.log(`from path ID resolve handler ${this.pathID}`);
    let {status, fileID, object} = data.detail;
    if (status && this.pathID === object.pathID && this.fileID === fileID) {
      this.info = object;
      this.object = this.info.object;
      document.body.removeEventListener(`pptr-resolve-response_${this.fileID}_${this.pathID}`, this.handleEvent.bind(this));
    }
  }

  resolve() {
    if (this.fileID !== 0) {
      console.error('cross-file externals unsupported');
      return;
    }
    if (this.object != null) return;
    document.body.dispatchEvent(new CustomEvent('pptr-resolve-request', {detail: {fileID: this.fileID, pathID: this.pathID}}));
  }
}