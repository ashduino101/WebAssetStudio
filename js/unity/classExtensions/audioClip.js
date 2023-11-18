import {requestExternalData} from "../utils";
import {FSB5} from "../../fsb5/fsb5";
import {Extension} from "../extension";
import {AudioPreview} from "../../preview/audioPreview";

export class AudioClipExtension extends Extension {
  exportExtension = '.wav';
  constructor(audioClip) {
    super();
    this.audioClip = audioClip;
  }

  async loadFSB() {
    if (typeof this.data == 'undefined') {
      this.data = await requestExternalData({
        offset: this.audioClip.m_Resource.m_Offset,
        size: this.audioClip.m_Resource.m_Size,
        path: this.audioClip.m_Resource.m_Source
      });
    }
    if (typeof this.fsb == 'undefined') {
      this.fsb = new FSB5(this.data);
    }
  }

  async createDataUrl() {
    let wavData = await this.fsb.getAudio();
    return URL.createObjectURL(new Blob([wavData], {type: 'audio/wav'}));
  }

  async getExport() {
    await this.loadFSB();
    return await this.fsb.getAudio();
  }

  async createPreview() {
    await this.loadFSB();
    return new AudioPreview().create(await this.fsb.getAudio());
  }
}