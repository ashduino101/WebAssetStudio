import {BinaryReader} from "../unityfs/reader";

export function FSB5Format(value) {
    for (let k in FSB5Format) {
        if (FSB5Format[k]?.value === value) {
            return FSB5Format[k];
        }
    }
    return FSB5Format.NONE;
}

FSB5Format.NONE = {name: 'None', value: 0};
FSB5Format.PCM8 = {name: 'PCM (8-bit)', value: 1};
FSB5Format.PCM16 = {name: 'PCM (16-bit)', value: 2};
FSB5Format.PCM24 = {name: 'PCM (24-bit)', value: 3};
FSB5Format.PCM32 = {name: 'PCM (32-bit)', value: 4};
FSB5Format.PCMFLOAT = {name: 'PCM (float)', value: 5};
FSB5Format.GCADPCM = {name: 'GC ADPCM', value: 6};
FSB5Format.IMAADPCM = {name: 'IMA ADPCM', value: 7};
FSB5Format.VAG = {name: 'VAG', value: 8};
FSB5Format.HEVAG = {name: 'HE-VAG', value: 9};
FSB5Format.XMA = {name: 'XMA', value: 10};
FSB5Format.MPEG = {name: 'MPEG-3', value: 11};
FSB5Format.CELT = {name: 'CELT', value: 12};
FSB5Format.AT9 = {name: 'AT9', value: 13};
FSB5Format.XWMA = {name: 'XWMA', value: 14};
FSB5Format.VORBIS = {name: 'Vorbis', value: 15};

export class FSB5Sample {
    constructor(value) {
        this.nextChunk = value & 1;
        this.frequency = (value  & 0x1f) >> 1;
        this.numChannels = ((value  & 0x3f) >> 5) + 1;
        this.dataOffset = (value & 0x3ffffffff) >> 6;
        // JS fuckery not allowing bitshifts with an rvalue greater than 32 -
        // we have to use division instead (this constant is equivalent to 1 << 34)
        this.sampleRate = Math.floor(value / 0x400000000);
    }
}

export class FSB5SampleChunk {
    constructor(value) {
        this.nextChunk = value & 1;
        this.chunkSize = (value & 0x1ffffff) >> 1;
        this.chunkType = (value & 0xffffffff) >> 25;
    }
}

export class FSB5 {
    constructor(data) {
        this.reader = new BinaryReader(data);
        this.reader.endian = 'little';
    }

    parse() {
        let _start = this.reader.tell();
        this.start = _start;

        if ((this.magic = this.reader.readChars(4)) !== 'FSB5') {
            throw Error('Invalid magic "' + this.magic + '"!');
        }

        this.version = this.reader.readInt32();
        this.numSamples = this.reader.readInt32();
        this.sampleHeaderSize = this.reader.readUInt32();
        this.nameTableSize = this.reader.readUInt32();
        this.dataSize = this.reader.readUInt32();
        this.format = FSB5Format(this.reader.readInt32());
        this._u1 = this.reader.readUInt64();  // seems to be 1 if the sampleHeaderSize is greater than 36
        this.hash = this.reader.read(16);
        this._u2 = this.reader.readUInt64();

        this.samples = [];
        for (let i = 0; i < this.numSamples; i++) {
            let sample = new FSB5Sample(Number(this.reader.readUInt64()));
            let nextChunk = sample.nextChunk;
            sample.chunks = [];
            while (nextChunk) {
                let chunk = new FSB5SampleChunk(this.reader.readUInt32());
                nextChunk = chunk.nextChunk;
                chunk.data = this.reader.read(chunk.chunkSize);
                sample.chunks.push(chunk);
            }
            this.samples.push(sample);
        }

        if (this.nameTableSize > 0) {
            let nameOffsets = [];
            for (let i = 0; i < this.numSamples; i++) {
                nameOffsets.push(this.reader.readUInt32());
            }

            for (let i = 0; i < this.numSamples; i++) {
                this.reader.seek(_start + nameOffsets[i]);
                this.samples[i].name = this.reader.readCString();
            }
        }

        this.reader.seek(_start + 60 + this.sampleHeaderSize + this.nameTableSize);
        for (let i = 0; i < this.numSamples; i++) {
            this.samples[i].data = this.reader.read(this.dataSize);
        }

        return this.reader.offset;
    }
}