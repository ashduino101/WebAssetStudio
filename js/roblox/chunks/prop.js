import {Chunk} from "./chunk";
import {BinaryReader} from "../../binaryReader";
import {readRFloat32, readZInt32, readZInt64} from "../zigzag";
import {decodeReferences} from "./inst";

const rotationIDs = {
  0x02: [+1, +0, +0, +0, +1, +0, +0, +0, +1],
  0x03: [+1, +0, +0, +0, +0, -1, +0, +1, +0],
  0x05: [+1, +0, +0, +0, -1, +0, +0, +0, -1],
  0x06: [+1, +0, -0, +0, +0, +1, +0, -1, +0],
  0x07: [+0, +1, +0, +1, +0, +0, +0, +0, -1],
  0x09: [+0, +0, +1, +1, +0, +0, +0, +1, +0],
  0x0A: [+0, -1, +0, +1, +0, -0, +0, +0, +1],
  0x0C: [+0, +0, -1, +1, +0, +0, +0, -1, +0],
  0x0D: [+0, +1, +0, +0, +0, +1, +1, +0, +0],
  0x0E: [+0, +0, -1, +0, +1, +0, +1, +0, +0],
  0x10: [+0, -1, +0, +0, +0, -1, +1, +0, +0],
  0x11: [+0, +0, +1, +0, -1, +0, +1, +0, -0],
  0x14: [-1, +0, +0, +0, +1, +0, +0, +0, -1],
  0x15: [-1, +0, +0, +0, +0, +1, +0, +1, -0],
  0x17: [-1, +0, +0, +0, -1, +0, +0, +0, +1],
  0x18: [-1, +0, -0, +0, +0, -1, +0, -1, -0],
  0x19: [+0, +1, -0, -1, +0, +0, +0, +0, +1],
  0x1B: [+0, +0, -1, -1, +0, +0, +0, +1, +0],
  0x1C: [+0, -1, -0, -1, +0, -0, +0, +0, -1],
  0x1E: [+0, +0, +1, -1, +0, +0, +0, -1, +0],
  0x1F: [+0, +1, +0, +0, +0, -1, -1, +0, +0],
  0x20: [+0, +0, +1, +0, +1, -0, -1, +0, +0],
  0x22: [+0, -1, +0, +0, +0, +1, -1, +0, +0],
  0x23: [+0, +0, -1, +0, -1, -0, -1, +0, -0]
}

class PropValue {
  constructor(reader, typeID) {
    switch (typeID) {
      case 0x01:
        this.value = reader.readString();
        break;
      case 0x02:
        this.value = reader.readBool();
        break;
      case 0x03:
        this.value = readZInt32(reader);
        break;
      case 0x04:
        this.value = readRFloat32(reader);
        break;
      case 0x05:
        this.value = reader.readFloat64();
        break;
      case 0x06:
        this.value = {
          scale: readRFloat32(reader),
          offset: readZInt32(reader)
        }
        break;
      case 0x07:
        this.value = {
          scaleX: readRFloat32(reader),
          scaleY: readRFloat32(reader),
          offsetX: readZInt32(reader),
          offsetY: readZInt32(reader)
        }
        break;
      case 0x08:
        this.value = {
          originX: reader.readFloat32(),
          originY: reader.readFloat32(),
          originZ: reader.readFloat32(),
          directionX: reader.readFloat32(),
          directionY: reader.readFloat32(),
          directionZ: reader.readFloat32()
        }
        break;
      case 0x09:
        let faceBits = reader.readUInt8();
        this.value = {
          right: (faceBits & 1) === 1,
          top: (faceBits & 2) === 2,
          back: (faceBits & 4) === 4,
          left: (faceBits & 8) === 8,
          bottom: (faceBits & 16) === 16,
          front: (faceBits & 32) === 32,
        }
        break;
      case 0x0A:
        let axesBits = reader.readUInt8();
        this.value = {
          x: (axesBits & 1) === 1,
          y: (axesBits & 2) === 2,
          z: (axesBits & 4) === 4
        }
        break;
      case 0x0B:
        this.value = new BinaryReader(reader.read(4), 'big').readUInt32();
        break;
      case 0x0C:
        this.value = {
          r: readRFloat32(reader),
          g: readRFloat32(reader),
          b: readRFloat32(reader)
        }
        break;
      case 0x0D:
        this.value = {
          x: readRFloat32(reader),
          y: readRFloat32(reader)
        }
        break;
      case 0x0E:
        this.value = {
          x: readRFloat32(reader),
          y: readRFloat32(reader),
          z: readRFloat32(reader)
        }
        break;
      case 0x0F:
        this.value = {
          x: reader.readInt16(),
          y: reader.readInt16()
        }
        break;
      case 0x10:
        let rotID = reader.readUInt8();
        this.value = {
          rotation: {
            id: rotID,
            values: rotID === 0 ? reader.readArrayT(reader.readFloat32.bind(reader), 9) : rotationIDs[rotID]
          },
          position: {
            x: readRFloat32(reader),
            y: readRFloat32(reader),
            z: readRFloat32(reader)
          }
        }
        break;
      case 0x11:
        let quatID = reader.readUInt8();
        this.value = {
          rotation: {
            id: quatID,
            qx: quatID > 0 ? reader.readFloat32() : null,
            qy: quatID > 0 ? reader.readFloat32() : null,
            qz: quatID > 0 ? reader.readFloat32() : null,
            qw: quatID > 0 ? reader.readFloat32() : null
          },
          position: {
            x: readRFloat32(reader),
            y: readRFloat32(reader),
            z: readRFloat32(reader)
          }
        }
        break;
      case 0x12:
        this.value = new BinaryReader(reader.read(4), 'big').readUInt32();
        break;
      case 0x13:
        this.value = readZInt32(reader);
        break;
      case 0x14:
        this.value = {
          x: reader.readInt16(),
          y: reader.readInt16(),
          z: reader.readInt16()
        }
        break;
      case 0x15:
        this.value = {
          keypoints: reader.readArrayT(() => {return {
            time: reader.readFloat32(),
            value: reader.readFloat32(),
            envelope: reader.readFloat32()
          }}, reader.readUInt32())
        }
        break;
      case 0x16:
        this.value = {
          keypoints: reader.readArrayT(() => {return {
            time: reader.readFloat32(),
            r: reader.readFloat32(),
            g: reader.readFloat32(),
            b: reader.readFloat32(),
            envelope: reader.readFloat32()
          }}, reader.readUInt32())
        }
        break;
      case 0x17:
        this.value = {
          min: reader.readFloat32(),
          max: reader.readFloat32()
        }
        break;
      case 0x18:
        this.value = {
          min: {
            x: readRFloat32(reader),
            y: readRFloat32(reader)
          },
          max: {
            x: readRFloat32(reader),
            y: readRFloat32(reader)
          }
        }
        break;
      case 0x19:
        let customPhysics = reader.readBool();
        this.value = {
          customPhysics,
          density: customPhysics ? reader.readFloat32() : null,
          friction: customPhysics ? reader.readFloat32() : null,
          elasticity: customPhysics ? reader.readFloat32() : null,
          frictionWeight: customPhysics ? reader.readFloat32() : null,
          elasticityWeight: customPhysics ? reader.readFloat32() : null,
        }
        break;
      case 0x1A:
        this.value = {
          r: reader.readUInt8(),
          g: reader.readUInt8(),
          b: reader.readUInt8()
        }
        break;
      case 0x1B:
        this.value = readZInt64(reader);
        break;
      case 0x1C:
        this.value = new BinaryReader(reader.read(4), 'big').readUInt32();
        break;
      case 0x1E:
        this.value = {
          values: new PropValues(reader),
          presence: new PropValues(reader)
        }
        break;
      case 0x1F:
        let tr = new BinaryReader(reader.read(16), 'big');
        this.value = {
          index: tr.readUInt32(),
          time: tr.readUInt32(),
          random: tr.readUInt64()
        }
        break;
      case 0x20:
        this.value = {
          family: reader.readString(),
          weight: reader.readUInt16(),
          style: reader.readUInt8(),
          cachedFaceID: reader.readString()
        }
    }
  }
}

class PropValues {
  constructor(reader) {
    this.typeID = reader.readUInt8();
    this.values = [];
    while (reader.tell() < reader.size) {
      this.values.push(new PropValue(reader, this.typeID));
    }
  }
}

export class PropChunk extends Chunk {
  constructor(reader) {
    super(reader);
    this.classID = reader.readInt32();
    this.name = reader.readString();
    try {
      this.values = new PropValues(reader);
    } catch {
      console.error(`failed parsing classID ${this.classID}`);
    }
  }
}