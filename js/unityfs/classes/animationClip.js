import {PPtr} from "./pptr";
import {BinaryReader} from "../binaryReader";
import {Quaternion} from "../basicTypes";

export class Keyframe {
  exposedAttributes = [
    'time',
    'value',
    'inSlope',
    'outSlope'
  ];

  constructor(reader, func) {
    this.time = reader.readFloat32();
    this.value = func();
    this.inSlope = func();
    this.outSlope = func();
    if (reader.version[0] > 2018) {
      this.weightedMode = reader.readInt32();
      this.inWeight = func();
      this.outWeight = func();
    }
  }
}

export class AnimationCurve {
  exposedAttributes = [
    'curve',
    'preInfinity',
    'postInfinity',
    'rotationOrder',
  ];

  constructor(reader, func) {
    let numCurves = reader.readInt32();
    this.curve = [];
    for (let i = 0; i < numCurves; i++) {
      this.curve.push(new Keyframe(reader, func));
    }
    this.preInfinity = reader.readInt32();
    this.postInfinity = reader.readInt32();
    if (reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 3)) {
      this.rotationOrder = reader.readInt32();
    }
  }
}

export class QuaternionCurve {
  exposedAttributes = [
    'curve',
    'path'
  ];

  constructor(reader) {
    this.curve = new AnimationCurve(reader, reader.readQuaternion);
    this.path = reader.readAlignedString();
  }
}

export class PackedFloatVector {
  exposedAttributes = [
    'length',
    'range',
    'start',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();
    this.range = reader.readFloat32();
    this.start = reader.readFloat32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack(chunkItemCount, chunkStride, start = 0, numChunks = -1) {
    let bitPos = this.bitSize * start;
    let indexPos = bitPos / 8;
    bitPos %= 8;
    let scale = 1 / this.range;
    if (numChunks === -1) {
      numChunks = Math.floor(this.length / chunkItemCount);
    }
    let end = chunkStride * numChunks / 4;
    let data = [];
    for (let index = 0; index < end; index += chunkStride / 4) {
      for (let i = 0; i < chunkItemCount; i++) {
        let x = 0;
        let bits = 0;
        while (bits < this.bitSize) {
          x |= (this.data[indexPos] >> bitPos) << bits;
          let num = Math.min(this.bitSize - bits, 8 - bitPos);
          bitPos += num;
          bits += num;
          if (bitPos >= 8) {
            indexPos++;
            bitPos = 0;
          }
        }
        x &= (1 << this.bitSize) - 1;
        data.push(x / (scale * ((1 << this.bitSize) - 1)) + this.start);
      }
    }
    return data;
  }
}

export class PackedIntVector {
  exposedAttributes = [
    'length',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack() {
    let data = [];
    let indexPos = 0;
    let bitPos = 0;
    for (let i = 0; i < this.length; i++) {
      let bits = 0;
      let x = 0;
      while (bits < this.bitSize) {
        x |= (this.data[indexPos] >> bitPos) << bits;
        let num = Math.min(this.bitSize - bits, 8 - bitPos);
        bitPos += num;
        bits += num;
        if (bitPos >= 8) {
          indexPos++;
          bitPos = 0;
        }
      }
      x &= (1 << this.bitSize) - 1;
      data.push(x);
    }
    return data;
  }
}

export class PackedQuaternionVector {
  exposedAttributes = [
    'length',
    'bitSize'
  ];

  constructor(reader) {
    this.length = reader.readUInt32();

    this.data = reader.read(reader.readUInt32());
    reader.align(4);

    this.bitSize = reader.read(1)[0];
    reader.align(4);
  }

  unpack() {
    let data = [];
    let indexPos = 0;
    let bitPos = 0;
    for (let i = 0; i < this.length; i++) {
      let flags = 0;
      let bits = 0;
      while (bits < 3) {
        flags |= (this.data[indexPos] >> bitPos) << bits;
        let num = Math.min(3 - bits, 8 - bitPos);
        bitPos += num;
        bits += num;
        if (bitPos >= 8) {
          indexPos++;
          bitPos = 0;
        }
      }
      flags &= 7;

      let quat = new Quaternion();
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        if (j !== (flags & 3)) {
          let bitSize = j === (((flags & 3) + 1) % 4) ? 9 : 10;
          let x = 0;
          let bits = 0;
          while (bits < bitSize) {
            x |= (this.data[indexPos] >> bitPos) << bits;
            let num = Math.min(bitSize - bits, 8 - bitPos);
            bitPos += num;
            bits += num;
            if (bitPos >= 8) {
              indexPos++;
              bitPos = 0;
            }
          }
          x &= (1 << bitSize) - 1;
          quat.setIndex(j, x / (0.5 * ((1 << bitSize) - 1)) - 1);
          sum += quat.getIndex(j) ** 2;
        }
      }

      let lastComponent = flags & 3;
      quat.setIndex(lastComponent, Math.sqrt(1 - sum));
      if ((flags & 4) !== 0) {
        quat.setIndex(lastComponent, -quat.getIndex(lastComponent));
      }
      data.push(quat);
    }
    return data;
  }
}

export class CompressedAnimationCurve {
  exposedAttributes = [
    'path',
    'times',
    'values',
    'slopes',
    'preInfinity',
    'postInfinity',
  ];

  constructor(reader) {
    this.path = reader.readAlignedString();
    this.times = new PackedIntVector(reader);
    this.values = new PackedQuaternionVector(reader);
    this.slopes = new PackedFloatVector(reader);
    this.preInfinity = reader.readInt32();
    this.postInfinity = reader.readInt32();
  }
}

export class Vector3Curve {
  exposedAttributes = [
    'curve',
    'path'
  ];

  constructor(reader) {
    this.curve = new AnimationCurve(reader, reader.readVector3);
    this.path = reader.readAlignedString();
  }
}

export class FloatCurve {
  exposedAttributes = [
    'curve',
    'attribute',
    'path',
    'classID',
    'script',
  ];

  constructor(reader) {
    this.curve = new AnimationCurve(reader, reader.readFloat32);
    this.attribute = reader.readAlignedString();
    this.path = reader.readAlignedString();
    this.classID = reader.readInt32();
    this.script = new PPtr(reader);
  }
}

export class PPtrKeyframe {
  exposedAttributes = [
    'time',
    'value',
  ];

  constructor(reader) {
    this.time = reader.readFloat32();
    this.value = new PPtr(reader);
  }
}

export class PPtrCurve {
  exposedAttributes = [
    'curve',
    'attribute',
    'path',
    'classID',
    'script',
  ];

  constructor(reader) {
    let numCurves = reader.readUInt32();
    this.curve = [];
    for (let i = 0; i < numCurves; i++) {
      this.curve.push(new PPtrKeyframe(reader));
    }
    this.attribute = reader.reader.readAlignedString();
    this.path = reader.readAlignedString();
    this.classID = reader.readInt32();
    this.script = new PPtr(reader);
  }
}

export class AABB {
  exposedAttributes = [
    'center',
    'extent',
  ];

  constructor(reader) {
    this.center = reader.readVector3();
    this.extent = reader.readVector3();
  }
}

export class AnimTransform {
  exposedAttributes = [
    't',
    'q',
    's',
  ];

  constructor(reader) {
    this.t = reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 4) ? reader.readVector3() : reader.readVector4();
    this.q = reader.readQuaternion();
    this.s = reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 4) ? reader.readVector3() : reader.readVector4();
  }
}

export class HandPose {
  exposedAttributes = [
    'grabX',
    'doFArray',
    'override',
    'closeOpen',
    'inOut',
    'grab',
  ];

  constructor(reader) {
    this.grabX = new AnimTransform(reader);
    this.doFArray = reader.readArrayT(reader.readFloat32, reader.readUInt32());
    this.override = reader.readFloat32();
    this.closeOpen = reader.readFloat32();
    this.inOut = reader.readFloat32();
    this.grab = reader.readFloat32();
  }
}

export class HumanGoal {
  exposedAttributes = [
    'x',
    'weightT',
    'weightR',
    'hintT',
    'hintWeightT',
  ];

  constructor(reader) {
    this.x = new AnimTransform(reader);
    this.weightT = reader.readFloat32();
    this.weightR = reader.readFloat32();
    if (reader.version[0] >= 5) {
      this.hintT = reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 4) ? reader.readVector3() : reader.readVector4();
      this.hintWeightT = reader.readFloat32();
    }
  }
}

export class HumanPose {
  exposedAttributes = [
    'rootX',
    'lookAtPosition',
    'lookAtWeight',
    'goals',
    'leftHandPose',
    'rightHandPose',
    'doFArray',
    'tDoFArray',
  ];

  constructor(reader) {
    this.rootX = new AnimTransform(reader);
    this.lookAtPosition = reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 4) ? reader.readVector3() : reader.readVector4();
    this.lookAtWeight = reader.readVector4();

    let numGoals = reader.readInt32();
    this.goals = [];
    for (let i = 0; i < numGoals; i++) {
      this.goals.push(new HumanGoal(reader));
    }
    this.leftHandPose = new HandPose(reader);
    this.rightHandPose = new HandPose(reader);

    this.doFArray = reader.readArrayT(reader.readFloat32, reader.readUInt32());
    if (reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 2)) {
      let numTDoF = reader.readUInt32();
      this.tDoFArray = [];
      for (let i = 0; i < numTDoF; i++) {
        this.tDoFArray.push(reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 4) ? reader.readVector3() : reader.readVector4());
      }
    }
  }
}

export class StreamedCurveKey {
  exposedAttributes = [
    'index',
    'coefficient',
    'outSlope',
    'value',
  ];

  constructor(reader) {
    this.index = reader.readInt32();
    this.coefficient = reader.readArrayT(reader.readFloat32, 4);
    this.outSlope = this.coefficient[2];
    this.value = this.coefficient[2];
  }

  calculateNextInSlope(dx, rhs) {
    if (this.coefficient[0] === 0 && this.coefficient[1] === 0 && this.coefficient[2] === 0) {
      return Infinity;
    }
    dx = Math.max(dx, 0.0001);
    let dy = rhs.value - this.value;
    let length = 1 / (dx * dx);
    let d1 = this.outSlope * dx;
    let d2 = dy + dy + dy - d1 - d1 - this.coefficient[1] / length;
    return d2 / dx;
  }
}

export class StreamedFrame {
  exposedAttributes = [
    'time',
    'keys',
  ];

  constructor(reader) {
    this.time = reader.readFloat32();
    let numKeys = reader.readInt32();
    this.keys = [];
    for (let i = 0; i < numKeys; i++) {
      this.keys.push(new StreamedCurveKey(reader));
    }
  }
}

export class StreamedClip {
  exposedAttributes = [
    'curveCount',
  ];

  constructor(reader) {
    this.data = new BinaryReader(reader.read(reader.readUInt32() * 4));
    this.curveCount = reader.readUInt32();
    this.reader = reader;
  }

  readData() {
    let frameList = [];
    while (this.data.offset < this.data.data.length) {
      frameList.push(new StreamedFrame(this.reader));
    }
    for (let frameIndex = 2; frameIndex < frameList.length - 1; frameIndex++) {
      let frame = frameList[frameIndex];
      for (let curveKey of frame.keys) {
        for (let i = frameIndex - 1; i >= 0; i--) {
          let preFrame = frameList[i];
          let preCurveKey = preFrame.keys.filter(x => x.index = curveKey.index);
          if (preCurveKey !== undefined) {
            curveKey.inSlope = preCurveKey.calculateNextInSlope(frame.time - preFrame.time, curveKey);
            break;
          }
        }
      }
    }
    return frameList;
  }
}

export class DenseClip {
  exposedAttributes = [
    'frameCount',
    'curveCount',
    'sampleRate',
    'beginTime',
    'samples',
  ];

  constructor(reader) {
    this.frameCount = reader.readInt32();
    this.curveCount = reader.readUInt32();
    this.sampleRate = reader.readFloat32();
    this.beginTime = reader.readFloat32();
    this.samples = reader.readArrayT(reader.readFloat32, reader.readUInt32());
  }
}

export class ConstantClip {
  exposedAttributes = [
    'data'
  ];

  constructor(reader) {
    this.data = reader.readArrayT(reader.readFloat32, reader.readUInt32());
  }
}
