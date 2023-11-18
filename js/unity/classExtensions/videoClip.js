import {Extension} from "../extension";
import {requestExternalData} from "../utils";

export class VideoClipExtension extends Extension {
  exportExtension = '.mp4';
  constructor(videoClip) {
    super();
    this.videoClip = videoClip;
  }

  async loadData() {
    this.data = await requestExternalData({
      offset: this.videoClip.m_ExternalResources.m_Offset,
      size: this.videoClip.m_ExternalResources.m_Size,
      path: this.videoClip.m_ExternalResources.m_Source
    });
  }

  async createPreview() {
    await this.loadData();
    const video = document.createElement('video');
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.src = URL.createObjectURL(new Blob([this.data]));
    return video;
  }

  async getExport() {
    await this.loadData();
    return this.data;
  }
}