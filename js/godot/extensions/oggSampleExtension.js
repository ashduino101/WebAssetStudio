import {BaseExtension} from "./baseExtension";
import {AudioPreview} from "../../preview/audio";

export class OggSampleExtension extends BaseExtension {
  constructor() {
    super();
  }

  createPreview(resource) {
    return new AudioPreview().create(resource.resource.properties.data);
  }
}