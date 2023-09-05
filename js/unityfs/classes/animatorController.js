import {ValueArrayConstant} from "./animationClip";
import {RuntimeAnimatorController} from "./runtimeAnimatorController";
import {KVPair} from "../basicTypes";
import {PPtr} from "./pptr";

export class HumanPoseMask {
  exposedAttributes = [
    'word0',
    'word1',
    'word2'
  ];

  constructor(reader) {
    this.word0 = reader.readUInt32();
    this.word1 = reader.readUInt32();
    if (reader.versionGTE(5, 2)) {
      this.word2 = reader.readUInt32();
    }
  }
}

export class SkeletonMaskElement {
  exposedAttributes = [
    'pathHash',
    'weight'
  ];

  constructor(reader) {
    this.pathHash = reader.readUInt32();
    this.weight = reader.readFloat32();
  }
}

export class SkeletonMask {
  exposedAttributes = [
    'data'
  ];

  constructor(reader) {
    let numElements = reader.readInt32();
    this.data = [];
    for (let i = 0; i < numElements; i++) {
      this.data.push(new SkeletonMaskElement(reader));
    }
  }
}

export class LayerConstant {
  exposedAttributes = [
    'stateMachineIndex',
    'stateMachineMotionSetIndex',
    'bodyMask',
    'skeletonMask',
    'binding',
    'layerBlendingMode',
    'defaultWeight',
    'ikPass',
    'syncedLayerAffectsTiming'
  ];

  constructor(reader) {
    this.stateMachineIndex = reader.readUInt32();
    this.stateMachineMotionSetIndex = reader.readUInt32();
    this.bodyMask = new HumanPoseMask(reader);
    this.skeletonMask = new SkeletonMask(reader);
    this.binding = reader.readUInt32();
    this.layerBlendingMode = reader.readUInt32();
    if (reader.versionGTE(4, 2)) {
      this.defaultWeight = reader.readFloat32();
    }
    this.ikPass = reader.readBool();
    if (reader.versionGTE(4, 2)) {
      this.syncedLayerAffectsTiming = reader.readBool();
    }
    reader.align(4);
  }
}

export class ConditionConstant {
  exposedAttributes = [
    'conditionMode',
    'eventID',
    'eventThreshold',
    'exitTime'
  ];

  constructor(reader) {
    this.conditionMode = reader.readUInt32();
    this.eventID = reader.readUInt32();
    this.eventThreshold = reader.readFloat32();
    this.exitTime = reader.readFloat32();
  }
}

export class TransitionConstant {
  exposedAttributes = [
    'conditionConstants',
    'destinationState',
    'fullPathID',
    'id',
    'userID',
    'transitionDuration',
    'transitionOffset',
    'exitTime',
    'hasExitTime',
    'hasFixedDuration',
    'interruptionSource',
    'orderedInterruption',
    'canTransitionToSelf'
  ];

  constructor(reader) {
    let numConditions = reader.readInt32();
    this.conditionConstants = [];
    for (let i = 0; i < numConditions; i++) {
      this.conditionConstants.push(new ConditionConstant(reader));
    }
    this.destinationState = reader.readUInt32();
    if (reader.version[0] >= 5) {
      this.fullPathID = reader.readUInt32();
    }
    this.id = reader.readUInt32();
    this.userID = reader.readUInt32();
    this.transitionDuration = reader.readFloat32();
    this.transitionOffset = reader.readFloat32();

    if (reader.version[0] >= 5) {
      this.exitTime = reader.readFloat32();
      this.hasExitTime = reader.readBool();
      this.hasFixedDuration = reader.readBool();
      reader.align(4);
      this.interruptionSource = reader.readInt32();
      this.orderedInterruption = reader.readBool();
    } else {
      this.atomic = reader.readBool();
    }

    if (reader.versionGTE(4, 5)) {
      this.canTransitionToSelf = reader.readBool();
    }

    reader.align(4);
  }
}

export class LeafInfoConstant {
  exposedAttributes = [
    'idArray',
    'indexOffset'
  ];

  constructor(reader) {
    this.idArray = reader.readArrayT(reader.readUInt32.bind(reader), reader.readUInt32());
    this.indexOffset = reader.readUInt32();
  }
}

export class MotionNeighbourList {
  exposedAttributes = [
    'neighbours'
  ];
  constructor(reader) {
    this.neighbours = reader.readArrayT(reader.readUInt32.bind(reader), reader.readUInt32());
  }
}

export class Blend2DDataConstant {
  exposedAttributes = [
    'childPositions',
    'childMagnitudes',
    'childPairVectors',
    'childPairAvgMagsInv',
    'childNeighbourLists'
  ];

  constructor(reader) {
    this.childPositions = reader.readArrayT(reader.readVector2.bind(reader), reader.readUInt32());
    this.childMagnitudes = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    this.childPairVectors = reader.readArrayT(reader.readVector2.bind(reader), reader.readUInt32());
    this.childPairAvgMagsInv = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());

    let numNeighbours = reader.readInt32();
    this.childNeighbourLists = [];
    for (let i = 0; i < numNeighbours; i++) {
      this.childNeighbourLists.push(new MotionNeighbourList(reader));
    }
  }
}

export class Blend1DDataConstant {
  exposedAttributes = [
    'childThresholds'
  ];

  constructor(reader) {
    this.childThresholds = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
  }
}

export class BlendDirectDataConstant {
  exposedAttributes = [
    'childBlendEventIDs',
    'normalizedBlendValues'
  ];

  constructor(reader) {
    this.childBlendEventIDs = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
    this.normalizedBlendValues = reader.readBool();
    reader.align(4);
  }
}

export class BlendTreeNodeConstant {
  exposedAttributes = [
    'blendType',
    'blendEventID',
    'blendEventYID',
    'childIndices',
    'blend1DData',
    'blend2DData',
    'blendDirectData',
    'clipID',
    'duration',
    'cycleOffset',
    'mirror'
  ];

  constructor(reader) {
    if (reader.versionGTE(4, 1)) {
      this.blendType = reader.readUInt32();
    }
    this.blendEventID = reader.readUInt32();
    if (reader.versionGTE(4, 1)) {
      this.blendEventYID = reader.readUInt32();
      this.childIndices = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
    }
    if (reader.versionLT(4, 1)) {
      this.childThresholds = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    }
    if (reader.versionGTE(4, 1)) {
      this.blend1DData = new Blend1DDataConstant(reader);
      this.blend2DData = new Blend2DDataConstant(reader);
    }
    if (reader.version[0] >= 5) {
      this.blendDirectData = new BlendDirectDataConstant(reader);
    }
    this.clipID = reader.readUInt32();
    if (reader.version[0] === 4 && reader.version[1] >= 5) {
      this.clipIndex = reader.readUInt32();
    }
    this.duration = reader.readFloat32();
    if (reader.version[0] > 4
      || (reader.version[0] === 4 && reader.version[1] > 1)
      || (reader.version[0] === 4 && reader.version[1] === 1 && reader.version[2] >= 3)) { // 4.1.3+
      this.cycleOffset = reader.readFloat32();
      this.mirror = reader.readBool();
      reader.align(4);
    }
  }
}

export class BlendTreeConstant {
  exposedAttributes = [
    'nodes'
  ];

  constructor(reader) {
    let numNodes = reader.readInt32();
    this.nodes = [];
    for (let i = 0; i < numNodes; i++) {
      this.nodes.push(new BlendTreeNodeConstant(reader));
    }
    if (reader.versionLT(4, 5)) {
      this.blendEvents = new ValueArrayConstant(reader);
    }
  }
}

export class StateConstant {
  exposedAttributes = [
    'transitionConstants',
    'blendTreeConstantIndices',
    'blendTreeConstants',
    'nameID',
    'pathID',
    'fullPathID',
    'tagID',
    'speedParamID',
    'mirrorParamID',
    'cycleOffsetParamID',
    'speed',
    'cycleOffset',
    'ikOnFeet',
    'writeDefaultValues',
    'loop',
    'mirror'
  ];

  constructor(reader) {
    let numTransitions = reader.readInt32();
    this.transitionConstants = [];
    for (let i = 0; i < numTransitions; i++) {
      this.transitionConstants.push(new TransitionConstant(reader));
    }
    this.blendTreeConstantIndices = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
    if (reader.versionLT(5, 2)) {
      let numInfos = reader.readInt32();
      this.leafInfoArray = [];
      for (let i = 0; i < numInfos; i++) {
        this.leafInfoArray.push(new LeafInfoConstant(reader));
      }
    }
    let numBlends = reader.readInt32();
    this.blendTreeConstants = [];
    for (let i = 0; i < numBlends; i++) {
      this.blendTreeConstants.push(new BlendTreeConstant(reader));
    }
    this.nameID = reader.readUInt32();
    if (reader.versionGTE(4, 3)) {
      this.pathID = reader.readUInt32();
    }
    if (reader.version[0] >= 5) {
      this.fullPathID = reader.readUInt32();
    }
    this.tagID = reader.readUInt32();
    if (reader.versionGTE(5, 1)) {
      this.speedParamID = reader.readUInt32();
      this.mirrorParamID = reader.readUInt32();
      this.cycleOffsetParamID = reader.readUInt32();
    }
    if (reader.versionGTE(2017, 2)) {
      this.timeParamID = reader.readUInt32();
    }
    this.speed = reader.readFloat32();
    if (reader.versionGTE(4, 1)) {
      this.cycleOffset = reader.readFloat32();
    }
    this.ikOnFeet = reader.readBool();
    if (reader.version[0] >= 5) {
      this.writeDefaultValues = reader.readBool();
    }
    this.loop = reader.readBool();
    if (reader.versionGTE(4, 1)) {
      this.mirror = reader.readBool();
    }
    reader.align(4);
  }
}

export class SelectorTransitionConstant {
  exposedAttributes = [
    'destination',
    'conditionConstants'
  ];

  constructor(reader) {
    this.destination = reader.readUInt32();
    let numConditions = reader.readInt32();
    this.conditionConstants = [];
    for (let i = 0; i < numConditions; i++) {
      this.conditionConstants.push(new ConditionConstant(reader));
    }
  }
}

export class SelectorStateConstant {
  exposedAttributes = [
    'transitionConstants',
    'fullPathID',
    'isEntry'
  ];

  constructor(reader) {
    let numTransitions = reader.readInt32();
    this.transitionConstants = [];
    for (let i = 0; i < numTransitions; i++) {
      this.transitionConstants.push(new SelectorTransitionConstant(reader));
    }
    this.fullPathID = reader.readUInt32();
    this.isEntry = reader.readBool();
    reader.align(4);
  }
}

export class StateMachineConstant {
  exposedAttributes = [
    'stateConstants',
    'anyStateTransitionConstants',
    'selectorStateConstants',
    'defaultState',
    'motionSetCount'
  ];

  constructor(reader) {
    let numStates = reader.readInt32();
    this.stateConstants = [];
    for (let i = 0; i < numStates; i++) {
      this.stateConstants.push(new StateConstant(reader));
    }
    let numAnyStates = reader.readInt32();
    this.anyStateTransitionConstants = [];
    for (let i = 0; i < numAnyStates; i++) {
      this.anyStateTransitionConstants.push(new TransitionConstant(reader));
    }
    if (reader.version[0] >= 5) {
      let numSelectors = reader.readInt32();
      this.selectorStateConstants = [];
      for (let i = 0; i < numSelectors; i++) {
        this.selectorStateConstants.push(new SelectorStateConstant(reader));
      }
    }
    this.defaultState = reader.readUInt32();
    this.motionSetCount = reader.readUInt32();
  }
}

export class ValueArray {
  exposedAttributes = [
    'positionValues',
    'quaternionValues',
    'scaleValues',
    'floatValues',
    'intValues',
    'boolValues'
  ];

  constructor(reader) {
    if (reader.versionLT(5, 5)) {
      this.boolValues = reader.readArrayT(reader.readBool.bind(reader), reader.readUInt32());
      reader.align(4);
      this.intValues = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
      this.floatValues = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
    }
    if (reader.versionLT(4, 3)) {
      this.vectorValues = reader.readArrayT(reader.readVector4.bind(reader), reader.readUInt32());
    } else {
      let numPosValues = reader.readInt32();
      this.positionValues = [];
      for (let i = 0; i < numPosValues; i++) {
        this.positionValues.push(reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4());
      }

      this.quaternionValues = reader.readArrayT(reader.readQuaternion.bind(reader), reader.readUInt32());

      let numScaleValues = reader.readInt32();
      this.scaleValues = [];
      for (let i = 0; i < numScaleValues; i++) {
        this.scaleValues.push(reader.versionGTE(5, 4) ? reader.readVector3() : reader.readVector4());
      }

      if (reader.versionGTE(5, 5)) {
        this.floatValues = reader.readArrayT(reader.readFloat32.bind(reader), reader.readUInt32());
        this.intValues = reader.readArrayT(reader.readInt32.bind(reader), reader.readUInt32());
        this.boolValues = reader.readArrayT(reader.readBool.bind(reader), reader.readUInt32());
        reader.align(4);
      }
    }
  }
}

export class ControllerConstant {
  exposedAttributes = [
    'layers',
    'stateMachines',
    'values',
    'defaultValues'
  ];

  constructor(reader) {
    let numLayers = reader.readInt32();
    this.layers = [];
    for (let i = 0; i < numLayers; i++) {
      this.layers.push(new LayerConstant(reader));
    }

    let numStates = reader.readInt32();
    this.stateMachines = [];
    for (let i = 0; i < numStates; i++) {
      this.stateMachines.push(new StateMachineConstant(reader));
    }

    this.values = new ValueArrayConstant(reader);
    this.defaultValues = new ValueArray(reader);
  }
}

export class AnimatorController extends RuntimeAnimatorController {
  exposedAttributes = [
    'controllerSize',
    'controller',
    'tos',
    'animationClips'
  ];

  constructor(reader) {
    super(reader);

    this.controllerSize = reader.readUInt32();
    this.controller = new ControllerConstant(reader);

    let numTos = reader.readInt32();
    this.tos = [];
    for (let i = 0; i < numTos; i++) {
      let key = reader.readUInt32();
      this.tos.push(new KVPair(key, reader.readAlignedString()));
    }

    let numClips = reader.readInt32();
    this.animationClips = [];
    for (let i = 0; i < numClips; i++) {
      this.animationClips.push(new PPtr(reader));
    }
  }
}
