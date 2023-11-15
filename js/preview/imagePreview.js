import {BasePreview} from "./basePreview";

export class ImagePreview extends BasePreview {
  constructor(imageCount, imageFn = async _ => {}) {
    super();
    this.imageCount = imageCount;
    this.imageFn = imageFn;
  }

  async create() {
    const container = document.createElement('div');
    container.style.display = 'block';
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';

    const btns = document.createElement('t2d-btns');
    btns.style.zIndex = '10';
    btns.style.position = 'absolute';
    const btnPrev = document.createElement('t2d-tabulate');
    const btnNext = document.createElement('t2d-tabulate');

    btnPrev.style.color = '#fff';
    btnPrev.style.display = 'inline-block';
    btnPrev.style.backgroundColor = '#34f';
    btnPrev.style.borderRadius = '4px';
    btnPrev.style.width = '32px';
    btnPrev.style.height = '32px';
    btnPrev.style.fontSize = '24px';
    btnPrev.style.margin = '2px';
    btnPrev.style.textAlign = 'center';
    btnPrev.style.userSelect = 'none';
    btnPrev.style.cursor = 'pointer';
    btnPrev.textContent = '<';

    btnNext.style.color = '#fff';
    btnNext.style.display = 'inline-block';
    btnNext.style.backgroundColor = '#34f';
    btnNext.style.borderRadius = '4px';
    btnNext.style.width = '32px';
    btnNext.style.height = '32px';
    btnNext.style.fontSize = '24px';
    btnNext.style.margin = '2px';
    btnNext.style.textAlign = 'center';
    btnNext.style.userSelect = 'none';
    btnNext.style.cursor = 'pointer';
    btnNext.textContent = '>';

    btns.appendChild(btnPrev);
    btns.appendChild(btnNext);

    container.appendChild(btns);

    let imageNum = 0;
    let img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.display = 'block';
    img.style.background = 'repeating-conic-gradient(#ddd 0% 25%, #0000004d 0% 50%) 50% / 20px 20px';
    img.style.position = 'relative';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    container.appendChild(img);

    const setDisabled = elem => {
      elem.style.backgroundColor = '#777';
      elem.style.color = '#aaa';
      elem.style.cursor = 'not-allowed';
    }
    const setEnabled = elem => {
      elem.style.backgroundColor = '#34d';
      elem.style.color = '#fff';
      elem.style.cursor = 'pointer';
    }

    const validate = () => {
      if (imageNum <= 0) {
        setDisabled(btnPrev);
      } else {
        setEnabled(btnPrev);
      }
      if ((imageNum + 1) >= this.imageCount) {
        setDisabled(btnNext);
      } else {
        setEnabled(btnNext);
      }
    }

    validate();

    btnPrev.addEventListener('click', async () => {
      if (imageNum > 0) {
        imageNum--;
      }
      validate();
      await preview();
    });

    btnNext.addEventListener('click', async () => {
      if ((imageNum + 1) < this.imageCount) {
        imageNum++;
      }
      validate();
      await preview();
    });

    const preview = async () => {
      img.src = await this.imageFn(imageNum);
    }

    await preview();

    return container;
  }
}