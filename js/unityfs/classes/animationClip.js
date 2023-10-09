import {PPtr} from "./pptr";
import {BinaryReader} from "../../binaryReader";
import {Quaternion} from "../basicTypes";
import ClassIDType from "../classIDType";
import {NamedObject} from "./namedObject";
import {getClassName} from "../utils";

export class Keyframe {
  static exposedAttributes = [
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
  static exposedAttributes = [
    'curve',
    'preInfinity',
    'postInfinity',
    'rotationOrder',
  ];

  constructor(reader, func) {
    let numCurves = reader.readInt32();
    this.curve = [];
    for (let i = 0; i < numCurves; i++) {
      this.curve.push(new Keyframe(reader, func.bind(reader)));
    }
    this.preInfinity = reader.readInt32();
    this.postInfinity = reader.readInt32();
    if (reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 3)) {
      this.rotationOrder = reader.readInt32();
    }
  }
}

export class QuaternionCurve {
  static exposedAttributes = [
    'curve',
    'path'
  ];

  constructor(reader) {
    this.curve = new AnimationCurve(reader, reader.readQuaternion);
    this.path = reader.readAlignedString();
  }
}

export class PackedFloatVector {
  static exposedAttributes = [
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
  static exposedAttributes = [
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
  static exposedAttributes = [
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
  static exposedAttributes = [
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
  static exposedAttributes = [
    'curve',
    'path'
  ];

  constructor(reader) {
    this.curve = new AnimationCurve(reader, reader.readVector3);
    this.path = reader.readAlignedString();
  }
}

export class FloatCurve {
  static exposedAttributes = [
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
  static exposedAttributes = [
    'time',
    'value',
  ];

  constructor(reader) {
    this.time = reader.readFloat32();
    this.value = new PPtr(reader);
  }
}

export class PPtrCurve {
  static exposedAttributes = [
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
  static exposedAttributes = [
    'center',
    'extent',
  ];

  constructor(reader) {
    this.center = reader.readVector3();
    this.extent = reader.readVector3();
  }
}

export class AnimTransform {
  static exposedAttributes = [
    't',
    'q',
    's',
  ];

  constructor(reader) {
    this.t = reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4();
    this.q = reader.readQuaternion();
    this.s = reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4();
  }
}

export class HandPose {
  static exposedAttributes = [
    'grabX',
    'doFArray',
    'override',
    'closeOpen',
    'inOut',
    'grab',
  ];

  constructor(reader) {
    this.grabX = new AnimTransform(reader);
    this.doFArray = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    this.override = reader.readFloat32();
    this.closeOpen = reader.readFloat32();
    this.inOut = reader.readFloat32();
    this.grab = reader.readFloat32();
  }
}

export class HumanGoal {
  static exposedAttributes = [
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
      this.hintT = reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4();
      this.hintWeightT = reader.readFloat32();
    }
  }
}

export class HumanPose {
  static exposedAttributes = [
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
    this.lookAtPosition = reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4();
    this.lookAtWeight = reader.readVector4();

    let numGoals = reader.readInt32();
    this.goals = [];
    for (let i = 0; i < numGoals; i++) {
      this.goals.push(new HumanGoal(reader));
    }
    this.leftHandPose = new HandPose(reader);
    this.rightHandPose = new HandPose(reader);

    this.doFArray = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    if (reader.version[0] > 5 || (reader.version[0] === 5 && reader.version[1] >= 2)) {
      let numTDoF = reader.readUInt32();
      this.tDoFArray = [];
      for (let i = 0; i < numTDoF; i++) {
        this.tDoFArray.push(reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4());
      }
    }
  }
}

export class StreamedCurveKey {
  static exposedAttributes = [
    'index',
    'coefficient',
    'outSlope',
    'value',
  ];

  constructor(reader) {
    this.index = reader.readInt32();
    this.coefficient = reader.readArrayT(reader.readFloat32.bind(reader), 4);
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
  static exposedAttributes = [
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
  static exposedAttributes = [
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
  static exposedAttributes = [
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
    this.samples = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
  }
}

export class ConstantClip {
  static exposedAttributes = [
    'data'
  ];

  constructor(reader) {
    this.data = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
  }
}

export class ValueConstant {
  static exposedAttributes = [
    'id',
    'type',
    'index'
  ];

  constructor(reader) {
    this.id = reader.readUInt32();
    if (reader.versionLT(5, 5)) {
      this.typeID = reader.readUInt32();
    }
    this.type = reader.readUInt32();
    this.index = reader.readUInt32();
  }
}

export class ValueArrayConstant {
  static exposedAttributes = [
    'values'
  ];

  constructor(reader) {
    let numValues = reader.readInt32();
    this.values = [];
    for (let i = 0; i < numValues; i++) {
      this.values.push(new ValueConstant(reader));
    }
  }
}

export class Clip {
  static exposedAttributes = [
    'streamedClip',
    'denseClip',
    'constantClip'
  ];

  constructor(reader) {
    this.streamedClip = new StreamedClip(reader);
    this.denseClip = new DenseClip(reader);
    if (reader.versionGTE(4, 3)) {
      this.constantClip = new ConstantClip(reader);
    }
    if (reader.versionLT(2018, 3)) {
      this.binding = new ValueArrayConstant(reader);
    }
  }
}

export class ValueDelta {
  static exposedAttributes = [
    'start',
    'stop'
  ];

  constructor(reader) {
    this.start = reader.readFloat32();
    this.stop = reader.readFloat32();
  }
}

export class ClipMuscleConstant {
  static exposedAttributes = [
    'deltaPose',
    'startX',
    'stopX',
    'leftFootStartX',
    'averageSpeed',
    'clip',
    'startTime',
    'stopTime',
    'orientationOffsetY',
    'level',
    'cycleOffset',
    'averageAngularSpeed',
    'indexArray',
    'valueDeltas',
    'valueReferencePoses',
    'mirror',
    'loopTime',
    'loopBlend',
    'loopBlendOrientation',
    'loopBlendPositionY',
    'loopBlendPositionXZ',
    'startAtOrigin',
    'keepOriginalOrientation',
    'keepOriginalPositionY',
    'keepOriginalPositionXZ',
    'heightFromFeet',
  ];

  constructor(reader) {
    this.deltaPose = new HumanPose(reader);
    this.startX = new AnimTransform(reader);
    if (reader.versionGTE(5, 5)) {
      this.stopX = new AnimTransform(reader);
    }
    this.leftFootStartX = new AnimTransform(reader);
    this.rightFootStartX = new AnimTransform(reader);
    if (reader.version[0] < 5) {
      this.motionStartX = new AnimTransform(reader);
      this.motionStopX = new AnimTransform(reader);
    }
    this.averageSpeed = reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4();
    this.clip = new Clip(reader);
    this.startTime = reader.readFloat32();
    this.stopTime = reader.readFloat32();
    this.orientationOffsetY = reader.readFloat32();
    this.level = reader.readFloat32();
    this.cycleOffset = reader.readFloat32();
    this.averageAngularSpeed = reader.readFloat32();

    this.indexArray = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
    if (reader.versionLT(4, 3)) {
      this.additionalCurveIndexArray = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
    }
    let numDeltas = reader.readInt32();
    this.valueDeltas = [];
    for (let i = 0; i < numDeltas; i++) {
      this.valueDeltas.push(new ValueDelta(reader));
    }
    if (reader.versionGTE(5, 3)) {
      this.valueReferencePoses = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    }
    this.mirror = reader.readBool();
    if (reader.versionGTE(4, 3)) {
      this.loopTime = reader.readBool();
    }
    this.loopBlend = reader.readBool();
    this.loopBlendOrientation = reader.readBool();
    this.loopBlendPositionY = reader.readBool();
    this.loopBlendPositionXZ = reader.readBool();
    if (reader.versionGTE(5, 5)) {
      this.startAtOrigin = reader.readBool();
    }
    this.keepOriginalOrientation = reader.readBool();
    this.keepOriginalPositionY = reader.readBool();
    this.keepOriginalPositionXZ = reader.readBool();
    this.heightFromFeet = reader.readBool();
    reader.align(4);
  }
}

export class GenericBinding {
  static exposedAttributes = [
    'path',
    'attribute',
    'script',
    'typeID',
    'customType',
    'isPPtrCurve',
    'isIntCurve'
  ];

  constructor(reader) {
    this.path = reader.readUInt32();
    this.attribute = reader.readUInt32();
    this.script = new PPtr(reader);
    if (reader.versionGTE(5, 6)) {
      this.typeID = getClassName(reader.readInt32());
    } else {
      this.typeID = getClassName(reader.readUInt16());
    }
    this.customType = reader.readUInt8();
    this.isPPtrCurve = reader.readUInt8();
    if (reader.versionGTE(2022, 1)) {
      this.isIntCurve = reader.readUInt8();
    }
    reader.align(4);
  }
}

export class AnimationClipBindingConstant {
  static exposedAttributes = [
    'genericBindings',
    'pptrCurveMapping'
  ];

  constructor(reader) {
    let numBindings = reader.readInt32();
    this.genericBindings = [];
    for (let i = 0; i < numBindings; i++) {
      this.genericBindings.push(new GenericBinding(reader));
    }
    let numMappings = reader.readInt32();
    this.pptrCurveMapping = [];
    for (let i = 0; i < numMappings; i++) {
      this.pptrCurveMapping.push(new PPtr(reader));
    }
  }
}

export class AnimationEvent {
  static exposedAttributes = [
    'time',
    'functionName',
    'data',
    'objectReferenceParameter',
    'floatParameter',
    'intParameter',
    'messageOptions'
  ];

  constructor(reader) {
    this.time = reader.readFloat32();
    this.functionName = reader.readAlignedString();
    this.data = reader.readAlignedString();
    this.objectReferenceParameter = new PPtr(reader);
    this.floatParameter = reader.readFloat32();
    if (reader.version[0] >= 3) {
      this.intParameter = reader.readInt32();
    }
    this.messageOptions = reader.readInt32();
  }
}

const AnimationType = {
  1: 'Legacy',
  2: 'Generic',
  3: 'Humanoid'
}

export class AnimationClip extends NamedObject {
  static exposedAttributes = [
    'name',
    'legacy',
    'compressed',
    'useHighQualityCurve',
    'rotationCurves',
    'compressedRotationCurves',
    'eulerCurves',
    'positionCurves',
    'scaleCurves',
    'floatCurves',
    'pptrCurves',
    'sampleRate',
    'wrapMode',
    'bounds',
    'muscleClipSize',
    'muscleClip'
  ];

  constructor(reader) {
    super(reader);

    if (reader.version[0] >= 5) {
      this.legacy = reader.readBool();
    } else if (reader.version[0] >= 4) {
      this.animationType = AnimationType[reader.readUInt32()];
      this.legacy = this.animationType === 'Legacy';
    } else {
      this.legacy = true;
    }
    this.compressed = reader.readBool();
    if (reader.versionGTE(4, 3)) {
      this.useHighQualityCurve = reader.readBool();
    }
    reader.align(4);
    let numRCurves = reader.readInt32();
    this.rotationCurves = [];
    for (let i = 0; i < numRCurves; i++) {
      this.rotationCurves.push(new QuaternionCurve(reader));
    }
    let numCRCurves = reader.readInt32();
    this.compressedRotationCurves = [];
    for (let i = 0; i < numCRCurves; i++) {
      this.compressedRotationCurves.push(new CompressedAnimationCurve(reader));
    }
    if (reader.versionGTE(5, 3)) {
      let numEulerCurves = reader.readInt32();
      this.eulerCurves = [];
      for (let i = 0; i < numEulerCurves; i++) {
        this.eulerCurves.push(new Vector3Curve(reader));
      }
    }
    let numPCurves = reader.readInt32();
    this.positionCurves = [];
    for (let i = 0; i < numPCurves; i++) {
      this.positionCurves.push(new Vector3Curve(reader));
    }
    let numSCurves = reader.readInt32();
    this.scaleCurves = [];
    for (let i = 0; i < numSCurves; i++) {
      this.scaleCurves.push(new Vector3Curve(reader));
    }
    let numFCurves = reader.readInt32();
    this.floatCurves = [];
    for (let i = 0; i < numFCurves; i++) {
      this.floatCurves.push(new FloatCurve(reader));
    }
    if (reader.versionGTE(4, 3)) {
      let numPPtrCurves = reader.readInt32();
      this.pptrCurves = [];
      for (let i = 0; i < numPPtrCurves; i++) {
        this.pptrCurves.push(new PPtr(reader));
      }
    }

    this.sampleRate = reader.readFloat32();
    this.wrapMode = reader.readInt32();
    if (reader.versionGTE(3, 4)) {
      this.bounds = new AABB(reader);
    }
    if (reader.version[0] >= 4) {
      this.muscleClipSize = reader.readUInt32();
      this.muscleClip = new ClipMuscleConstant(reader);
    }
  }
}
