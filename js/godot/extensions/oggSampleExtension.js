import {BaseExtension} from "./baseExtension";
import {AudioPreview} from "../../preview/audio";

export class OggSampleExtension extends BaseExtension {
  static type = 'variant';
  static extension = '.ogg';

  constructor() {
    super();
  }

  async createPreview(resource) {
    return new AudioPreview().create(resource.resource.properties.data);
  }

  exportFile(res) {
    return res.resource.properties.data;
  }
}