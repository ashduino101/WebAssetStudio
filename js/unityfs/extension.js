export class Extension {
  constructor(props) {
  }

  async createPreview() {
    const elem = document.createElement('h2');
    elem.classList.add('no-preview');
    elem.textContent = 'No preview available';
    return elem;
  }

  async getExport() {
    return null;
  }
}