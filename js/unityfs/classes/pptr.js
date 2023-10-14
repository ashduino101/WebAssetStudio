export class PPtr {
  constructor(reader) {
    this.fileID = reader.readInt32();
    this.pathID = reader.fileVersion < 14 ? BigInt(reader.readInt32()) : reader.readInt64();
    this.object = null;
    document.body.addEventListener('pptr-resolve-response', data => {
      let {status, fileID, object} = data.detail;
      if (status && this.pathID === object.pathID && this.fileID === fileID) {
        this.object = object.object;
      }
    });
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