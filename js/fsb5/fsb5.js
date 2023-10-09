import FMODModule from "../vendor/fmod/fmod";
import {BinaryWriter} from "../binaryWriter";

export class FSB5 {
  constructor(data) {
    this.data = data;

    this.fmodModule = null;
    this.system = null;
  }

  async _initModule() {
    return new Promise(resolve => {
      if (typeof window.global_fmodModule != "undefined") {
        this.fmodModule = window.global_fmodModule;
      }
      if (typeof window.global_fmodSystem != "undefined") {
        this.system = window.global_fmodSystem;
      }
      if (this.fmodModule != null && this.system != null) {
        resolve();
        return;
      }
      this.fmodModule = {};
      this.system = {};
      this.fmodModule['preRun'] = () => {
      }
      this.fmodModule['onRuntimeInitialized'] = () => {
        const systemOut = {};
        if (this.fmodModule.System_Create(systemOut) !== 0) {
          console.error('Failed to initialize FMOD system');
        }
        this.system = systemOut.val;
        if (this.system.init(1024, this.fmodModule.INIT_NORMAL, null) !== 0) {
          console.error('Failed to initialize FMOD system');
        }
        window.global_fmodModule = this.fmodModule;
        window.global_fmodSystem = this.system;
        resolve();
      };
      this.fmodModule['INITIAL_MEMORY'] = 64 * 1024 * 1024;
      FMODModule(this.fmodModule);
    });
  }

  async reset() {
    window.global_fmodModule = undefined;
    window.global_fmodSystem = undefined;
    await this._initModule();
  }

  async getSound() {
    if (this.system == null) {
      await this._initModule();
    }

    const info = new this.fmodModule.CREATESOUNDEXINFO();
    info.length = this.data.length;
    const soundOut = {};
    if (this.system.createSound(this.data, this.fmodModule.OPENMEMORY, info, soundOut) !== 0) {
      console.error('Could not create sound');
    }
    const sound = soundOut.val;
    let numSubSounds = {};
    if (sound.getNumSubSounds(numSubSounds) !== 0) {
      console.error('Could not get number of subsounds');
    }
    let subSound;
    if (numSubSounds.val > 0) {
      const subSoundOut = {};
      if (sound.getSubSound(0, subSoundOut) !== 0) {
        console.error('Could not get subsound');
      }
      subSound = subSoundOut.val;
    } else {
      subSound = sound;
    }
    return subSound;
  }

  async getAudio(isRetry=false) {
    try {
      const sound = await this.getSound();
      const wav = await this.convertSound(sound);
      sound.release();
      this.fmodModule.Memory_Free(sound.$$.ptr);  // releasing doesn't actually free the memory
      return wav;
    } catch (e) {
      if (isRetry) {
        console.error('failed on retry - not exporting');
        return null;
      }
      console.warn('error exporting - resetting module and retrying');
      console.warn(e.name);
      await this.reset();
      return await this.getAudio(true);
    }
  }

  async playAudio() {
    if (this.system == null) {
      await this._initModule();
    }
    document.body.click();  // stupid hack to focus the page
    this.system.playSound(await this.getSound(), null, false, {});
  }

  async convertSound(sound) {
    let type = {};
    let format = {};
    let channels = {};
    let bits = {};
    if (sound.getFormat(type, format, channels, bits) !== 0) {
      console.error('Could not get sound format');
    }
    channels = channels.val;
    bits = bits.val;
    format = format.val;
    const frequency = {};
    const priority = {};
    if (sound.getDefaults(frequency, priority) !== 0) {
      console.error('Could not get sound frequency');
    }
    const sampleRate = Math.floor(frequency.val);
    let length = {};
    if (sound.getLength(length, this.fmodModule.TIMEUNIT_PCMBYTES) !== 0) {
      console.error('Could not get sound length');
    }
    length = length.val;
    // console.log(channels, bits, sampleRate, length);

    // if ((res = sound.lock(0, 128, ptr1, ptr2, len1, len2)) !== 0) {  // lock to read 128 bytes (0-128)
    //   console.error('Could not lock sound for reading', res);
    // }

    // i fucking hate proprietary software
    // there's a bug in fmod where Sound.lock doesn't
    // work at all so we have to parse the WASM heap to get the audio data
    const sndOffset = new DataView(
      this.fmodModule.HEAPU8.slice(sound.$$.ptr, sound.$$.ptr + 4).buffer
    ).getUint32(0, true);
    const intSndOffset = new DataView(
      this.fmodModule.HEAPU8.slice(sndOffset + 228, sndOffset + 232).buffer
    ).getUint32(0, true);
    const soundData = this.fmodModule.HEAPU8.slice(intSndOffset, intSndOffset + length);

    // encode WAV
    const writer = new BinaryWriter(soundData.length + 44, 'little');
    writer.writeChars('RIFF');  // RIFF header
    writer.writeUInt32(soundData.length + 36);  // Length (minus RIFF/length)
    writer.writeChars('WAVE');  // RIFF format
    // Format chunk
    writer.writeChars('fmt ');  // Header
    writer.writeUInt32(16);  // Length
    let wavFormat = 0;
    switch (format) {
      case this.fmodModule.SOUND_FORMAT_PCM8:
      case this.fmodModule.SOUND_FORMAT_PCM16:
      case this.fmodModule.SOUND_FORMAT_PCM24:
      case this.fmodModule.SOUND_FORMAT_PCM32:
        wavFormat = 1;  // PCM
        break;
      case this.fmodModule.SOUND_FORMAT_PCMFLOAT:
        wavFormat = 3;  // Float
        break;
      default:
        console.error(`Unsupported sound format ${format}!`);
        return null;
    }
    writer.writeUInt16(wavFormat);  // Format
    writer.writeUInt16(channels);  // # of channels
    writer.writeUInt32(sampleRate);  // Sample rate
    writer.writeUInt32(sampleRate * channels * bits / 8);  // Byte rate
    writer.writeUInt16(channels * bits / 8);  // Block align
    writer.writeUInt16(bits);  // Bits per sample
    // Data chunk
    writer.writeChars('data');  // Header
    writer.writeUInt32(soundData.length);  // Length
    writer.write(soundData);  // Data

    return writer.data;
  }
}
