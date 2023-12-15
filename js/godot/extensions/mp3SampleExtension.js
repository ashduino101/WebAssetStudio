import {BaseExtension} from "./baseExtension";
import {AudioPreview} from "../../preview/audio";

export class Mp3SampleExtension extends BaseExtension {
  static type = 'variant';
  static extension = '.mp3';

  constructor() {
    super();
  }

  async createPreview(resource) {
    return new AudioPreview().create(resource.resource.properties.data, false, true);
  }

  exportFile(res) {
    return res.resource.properties.data;
  }
}
