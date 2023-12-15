import {BasePreview} from './basePreview';

export class AudioPreview extends BasePreview {
  create(data, isOGG = false, isMP3 = false) {
    const url = URL.createObjectURL(new Blob([data],
      {type: isMP3 ? 'audio/mp3' : (isOGG ? 'audio/ogg' : 'audio/wav')}
    ));
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