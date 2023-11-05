import {BasePreview} from './basePreview';

export class AudioPreview extends BasePreview {
  async create(wavData) {
    const url = URL.createObjectURL(new Blob([wavData], {type: 'audio/wav'}));
    const elem = document.createElement('audio');
    elem.style.display = 'block';
    elem.style.position = 'relative';
    elem.style.top = '50%';
    elem.style.left = '50%';
    elem.style.transform = 'translate(-50%, -50%)';
    elem.src = url;
    elem.controls = true;
    return elem;
  }
}