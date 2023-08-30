import '../css/hexview.css';

export class HexView {
  constructor(data, rootElement) {
    // TODO: buffering
    this.data = data;
    this.root = rootElement;
    this.root.classList.add('hex-view');
    this.rowOffset = 0;

    this.lineHeight = 20;
    this.cellWidth = 16;
    this.cellsPerRow = 16;

    this.rowsPerScreen = window.innerHeight / this.lineHeight;
    document.addEventListener('resize', () => {
      this.rowsPerScreen = window.innerHeight / this.lineHeight;
    });

    this._decoder = new TextDecoder('866');

    this.highlights = [];

    this.render();
  }

  decodeChar(c) {
    if (c < 32) {
      return '.';
    }
    return this._decoder.decode(new Uint8Array([c]));
  }

  createRow(rowOffset) {
    let row = document.createElement('div');
    row.classList.add('hex-row');
    row.style.height = `${this.lineHeight}px`;
    let hexCells = [];
    let textCells = [];
    for (let i = 0; i < this.cellsPerRow; i++) {
      let cell = document.createElement('span');
      cell.classList.add('hex-cell');
      cell.classList.add(`hex-cell-${rowOffset * this.cellsPerRow + i}`);
      cell.style.width = `${this.cellWidth}px`;
      cell.style.height = `${this.lineHeight}px`;
      cell.textContent = this.data[rowOffset * this.cellsPerRow + i].toString(16).padStart(2, '0').toUpperCase();
      cell.addEventListener('mouseenter', () => {
        cell.style.backgroundColor = '#ddddff';
        textCells[i].style.backgroundColor = '#ddddff';
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.backgroundColor = '#ffffff';
        textCells[i].style.backgroundColor = '#ffffff';
      });
      row.appendChild(cell);
      hexCells.push(cell);
    }
    let spacer = document.createElement('div');
    spacer.classList.add('hex-cell-spacer');
    row.appendChild(spacer);
    for (let i = 0; i < this.cellsPerRow; i++) {
      let cell = document.createElement('span');
      cell.classList.add('hex-cell-text');
      cell.classList.add(`hex-cell-${rowOffset * this.cellsPerRow + i}-text`);
      cell.style.width = `${this.cellWidth / 2}px`;
      cell.style.maxHeight = `${this.lineHeight}px`;
      cell.textContent = this.decodeChar(this.data[rowOffset * this.cellsPerRow + i]);
      cell.addEventListener('mouseenter', () => {
        hexCells[i].style.backgroundColor = '#ddddff';
        cell.style.backgroundColor = '#ddddff';
      });
      cell.addEventListener('mouseleave', () => {
        hexCells[i].style.backgroundColor = '#ffffff';
        cell.style.backgroundColor = '#ffffff';
      });
      row.appendChild(cell);
      textCells.push(cell);
    }
    let spacer2 = document.createElement('div');
    spacer2.classList.add('hex-cell-spacer');
    row.appendChild(spacer2);
    return row;
  }

  render() {
    while(this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    for (let i = 0; i < this.rowsPerScreen; i++) {
      this.root.appendChild(this.createRow(this.rowOffset + i));
    }
    for (let h of this.highlights) {
      let [start, end, color] = h;
      let range = end - start;
      if (end >= (this.rowOffset * 16) && start < ((this.rowOffset + this.rowsPerScreen) * 16)) {
        
      }
    }
  }

  scrollTo(row) {
    this.render(this.rowOffset = row);
  }

  highlight(start, end, color) {
    this.highlights.push([start, end, color]);
  }
}