import {NamedObject} from "./namedObject";
import {AnimTransform} from "./animationClip";
import {KVPair} from "../basicTypes";

export class AvatarNode {
  static exposedAttributes = [
    'parentID',
    'axesID'
  ];

  constructor(reader) {
    this.parentID = reader.readInt32();
    this.axesID = reader.readInt32();
  }
}

export class Limit {
  static exposedAttributes = [
    'min',
    'max',
  ];

  constructor(reader) {
    if (reader.versionGTE(5, 4)) {
      this.min = reader.readVector3();
      this.max = reader.readVector3();
    } else {
      this.min = reader.readVector4();
      this.max = reader.readVector4();
    }
  }
}

export class Axes {
  static exposedAttributes = [
    'preQ',
    'postQ',
    'sgn',
    'limit',
    'length',
    'type'
  ];

  constructor(reader) {
    this.preQ = reader.readVector4();
    this.postQ = reader.readVector4();
    if (reader.versionGTE(5, 4)) {
      this.sgn = reader.readVector3();
    } else {
      this.sgn = reader.readVector4();
    }
    this.limit = new Limit(reader);
    this.length = reader.readFloat32();
    this.type = reader.readUInt32();
  }
}

export class Skeleton {
  static exposedAttributes = [
    'nodes',
    'id',
    'axes',
  ];

  constructor(reader) {
    let numNodes = reader.readInt32();
    this.nodes = [];
    for (let i = 0; i < numNodes; i++) {
      this.nodes.push(new AvatarNode(reader));
    }
    this.id = reader.readArrayT(() => reader.readUInt32(), reader.readUInt32());

    let numAxes = reader.readInt32();
    this.axes = [];
    for (let i = 0; i < numAxes; i++) {
      this.axes.push(new Axes(reader));
    }
  }
}

export class SkeletonPose {
  static exposedAttributes = [
    'transforms',
  ];
  constructor(reader) {
    let numTransforms = reader.readInt32();
    this.transforms = [];
    for (let i = 0; i < numTransforms; i++) {
      this.transforms.push(new AnimTransform(reader));
    }
  }
}

export class Hand {
  static exposedAttributes = [
    'handBoneIndex',
  ];
  constructor(reader) {
    this.handBoneIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());
  }
}

export class Handle {
  static exposedAttributes = [
    'transform',
    'parentHumanIndex',
    'id',
  ];
  constructor(reader) {
    this.transform = new AnimTransform(reader);
    this.parentHumanIndex = reader.readUInt32();
    this.id = reader.readUInt32();
  }
}

export class Collider {
  static exposedAttributes = [
    'transform',
    'type',
    'xMotionType',
    'yMotionType',
    'zMotionType',
    'minLimitX',
    'maxLimitX',
    'maxLimitY',
    'maxLimitZ',
  ];
  constructor(reader) {
    this.transform = new AnimTransform(reader);
    this.type = reader.readUInt32();
    this.xMotionType = reader.readUInt32();
    this.yMotionType = reader.readUInt32();
    this.zMotionType = reader.readUInt32();
    this.minLimitX = reader.readFloat32();
    this.maxLimitX = reader.readFloat32();
    this.maxLimitY = reader.readFloat32();
    this.maxLimitZ = reader.readFloat32();
  }
}

export class Human {
  static exposedAttributes = [
    'rootTransform',
    'skeleton',
    'skeletonPose',
    'leftHand',
    'rightHand',
    'humanBoneIndex',
    'humanBoneMass',
    'scale',
    'armTwist',
    'foreArmTwist',
    'upperLegTwist',
    'legTwist',
    'armStretch',
    'legStretch',
    'feetSpacing',
    'hasLeftHand',
    'hasRightHand',
    'hasTDoF',
  ];
  constructor(reader) {
    this.rootTransform = new AnimTransform(reader);
    this.skeleton = new Skeleton(reader);
    this.skeletonPose = new SkeletonPose(reader);
    this.leftHand = new Hand(reader);
    this.rightHand = new Hand(reader);

    if (reader.versionLT(2018, 2)) {
      let numHandles = reader.readInt32();
      this.handles = [];
      for (let i = 0; i < numHandles; i++) {
        this.handles.push(new Handle(reader));
      }
      let numColliders = reader.readInt32();
      this.colliders = [];
      for (let i = 0; i < numColliders; i++) {
        this.colliders.push(new Collider(reader));
      }
    }

    this.humanBoneIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());
    this.humanBoneMass = reader.readArrayT(() => reader.readFloat32(), reader.readUInt32());

    if (reader.versionLT(2018, 2)) {
      this.colliderIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());
    }

    this.scale = reader.readFloat32();
    this.armTwist = reader.readFloat32();
    this.foreArmTwist = reader.readFloat32();
    this.upperLegTwist = reader.readFloat32();
    this.legTwist = reader.readFloat32();
    this.armStretch = reader.readFloat32();
    this.legStretch = reader.readFloat32();
    this.feetSpacing = reader.readFloat32();
    this.hasLeftHand = reader.readBool();
    this.hasRightHand = reader.readBool();

    if (reader.versionGTE(5, 2)) {
      this.hasTDoF = reader.readBool();
    }
    reader.align(4);
  }
}

export class AvatarConstant {
  static exposedAttributes = [
    'avatarSkeleton',
    'avatarSkeletonPose',
    'defaultPose',
    'skeletonNameIDArray',
    'human',
    'humanSkeletonIndex',
    'humanSkeletonReverseIndex',
    'rootMotionBoneIndex',
    'rootMotionBoneTransform',
    'rootMotionSkeleton',
    'rootMotionSkeletonPose',
    'rootMotionSkeletonIndex',
  ];
  constructor(reader) {
    this.avatarSkeleton = new Skeleton(reader);
    this.avatarSkeletonPose = new SkeletonPose(reader);

    if (reader.versionGTE(4, 3)) {
      this.defaultPose = new SkeletonPose(reader);
      this.skeletonNameIDArray = reader.readArrayT(() => reader.readUInt32(), reader.readUInt32());
    }

    this.human = new Human(reader);
    this.humanSkeletonIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());

    if (reader.versionGTE(4, 3)) {
      this.humanSkeletonReverseIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());
    }

    this.rootMotionBoneIndex = reader.readInt32();
    this.rootMotionBoneTransform = new AnimTransform(reader);

    if (reader.versionGTE(4, 3)) {
      this.rootMotionSkeleton = new Skeleton(reader);
      this.rootMotionSkeletonPose = new SkeletonPose(reader);
      this.rootMotionSkeletonIndex = reader.readArrayT(() => reader.readInt32(), reader.readUInt32());
    }
  }
}

export class Avatar extends NamedObject {
  static exposedAttributes = [
    'name',
    'avatarSize',
    'avatar',
    'tos',
  ];
  constructor(reader) {
    super(reader);
    this.avatarSize = reader.readUInt32();
    this.avatar = new AvatarConstant(reader);

    let numTOS = reader.readInt32();
    this.tos = [];
    for (let i = 0; i < numTOS; i++) {
      let key = reader.readUInt32();
      this.tos.push(new KVPair(key, reader.readAlignedString()));
    }
  }
}
