import {NamedObject} from "./namedObject";
import {FSB5} from "../../fsb5/fsb5";
import {requestExternalData} from "../utils";

export const FMODSoundType = {
  0: 'Unknown',
  1: 'ACC',
  2: 'AIFF',
  3: 'ASF',
  4: 'AT3',
  5: 'CDDA',
  6: 'DLS',
  7: 'FLAC',
  8: 'FSB',
  9: 'GCADPCM',
  10: 'IT',
  11: 'MIDI',
  12: 'MOD',
  13: 'MPEG',
  14: 'OGGVORBIS',
  15: 'PLAYLIST',
  16: 'RAW',
  17: 'S3M',
  18: 'SF2',
  19: 'USER',
  20: 'WAV',
  21: 'XM',
  22: 'XMA',
  23: 'VAG',
  24: 'AUDIOQUEUE',
  25: 'XWMA',
  26: 'BCWAV',
  27: 'AT9',
  28: 'VORBIS',
  29: 'MEDIA_FOUNDATION'
}

export const AudioCompressionFormat = {
  0: 'PCM',
  1: 'Vorbis',
  2: 'ADPCM',
  3: 'MP3',
  4: 'PSMVAG',
  5: 'HEVAG',
  6: 'XMA',
  7: 'AAC',
  8: 'GCADPCM',
  9: 'ATRAC9'
}

export class AudioClip extends NamedObject {
  exposedAttributes = [
    'name',
    'loadType',
    'channels',
    'frequency',
    'bitsPerSample',
    'length',
    'isTrackerFormat',
    'subsoundIndex',
    'preloadAudioData',
    'loadInBackground',
    'legacy3D',
    'source',
    'offset',
    'size',
    'compressionFormat'
  ];
  constructor(reader) {
    super(reader);
    if (reader.version[0] < 5) {
      this.format = reader.readInt32();
      this.type = FMODSoundType[reader.readInt32()];
      this.is3D = reader.readBool();
      this.useHardware = reader.readBool();
      reader.align(4);

      if (reader.versionGTE(3, 2)) {
        let stream = reader.readInt32();
        this.size = reader.readInt32();
        // Not going to bother implementing unusual logic for loading legacy samples - probably isn't worth it
      } else {
        this.size = reader.readInt32();
      }
    } else {
      this.loadType = reader.readInt32();
      this.channels = reader.readInt32();
      this.frequency = reader.readInt32();
      this.bitsPerSample = reader.readInt32();
      this.length = reader.readFloat32();
      this.isTrackerFormat = reader.readBool();
      reader.align(4);
      this.subsoundIndex = reader.readInt32();
      this.preloadAudioData = reader.readBool();
      this.loadInBackground = reader.readBool();
      this.legacy3D = reader.readBool();
      reader.align(4);

      this.source = reader.readAlignedString();
      this.offset = Number(reader.readInt64());
      this.size = Number(reader.readInt64());
      this.compressionFormat = AudioCompressionFormat[reader.readInt32()];
      console.log('compressed:', this.compressionFormat);
    }
  }

  async loadFSB() {
    if (typeof this.data == 'undefined') {
      this.data = await requestExternalData({offset: this.offset, size: this.size, path: this.source});
    }
    if (typeof this.fsb == 'undefined') {
      this.fsb = new FSB5(this.data);
      this.fsb.parse();
      // console.log('header checksum:', new DataView(this.fsb.samples[0].chunks[0].data.buffer).getUint32(0, true));
      // console.log('vorbis data:', fsb.samples[0].chunks[0].data);
      console.log(this.fsb);
      console.log('sound', this.fsb.getSound(0));
    }
  }

  async createPreview() {
    return document.createElement('div');
  }
}