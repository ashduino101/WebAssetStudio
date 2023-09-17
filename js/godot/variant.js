import {KVPair} from "../unityfs/basicTypes";

const
  VARIANT_NIL = 1,
  VARIANT_BOOL = 2,
  VARIANT_INT = 3,
  VARIANT_FLOAT = 4,
  VARIANT_STRING = 5,
  VARIANT_VECTOR2 = 10,
  VARIANT_RECT2 = 11,
  VARIANT_VECTOR3 = 12,
  VARIANT_PLANE = 13,
  VARIANT_QUATERNION = 14,
  VARIANT_AABB = 15,
  VARIANT_BASIS = 16,
  VARIANT_TRANSFORM3D = 17,
  VARIANT_TRANSFORM2D = 18,
  VARIANT_COLOR = 20,
  VARIANT_NODE_PATH = 22,
  VARIANT_RID = 23,
  VARIANT_OBJECT = 24,
  VARIANT_INPUT_EVENT = 25,
  VARIANT_DICTIONARY = 26,
  VARIANT_ARRAY = 30,
  VARIANT_PACKED_BYTE_ARRAY = 31,
  VARIANT_PACKED_INT32_ARRAY = 32,
  VARIANT_PACKED_FLOAT32_ARRAY = 33,
  VARIANT_PACKED_STRING_ARRAY = 34,
  VARIANT_PACKED_VECTOR3_ARRAY = 35,
  VARIANT_PACKED_COLOR_ARRAY = 36,
  VARIANT_PACKED_VECTOR2_ARRAY = 37,
  VARIANT_INT64 = 40,
  VARIANT_DOUBLE = 41,
  VARIANT_CALLABLE = 42,
  VARIANT_SIGNAL = 43,
  VARIANT_STRING_NAME = 44,
  VARIANT_VECTOR2I = 45,
  VARIANT_RECT2I = 46,
  VARIANT_VECTOR3I = 47,
  VARIANT_PACKED_INT64_ARRAY = 48,
  VARIANT_PACKED_FLOAT64_ARRAY = 49,
  VARIANT_VECTOR4 = 50,
  VARIANT_VECTOR4I = 51,
  VARIANT_PROJECTION = 52,
  OBJECT_EMPTY = 0,
  OBJECT_EXTERNAL_RESOURCE = 1,
  OBJECT_INTERNAL_RESOURCE = 2,
  OBJECT_EXTERNAL_RESOURCE_INDEX = 3,
  FORMAT_VERSION = 5,
  FORMAT_VERSION_CAN_RENAME_DEPS = 1,
  FORMAT_VERSION_NO_NODEPATH_PROPERTY = 3;


export function getString(reader, stringTable) {
  const id = reader.readInt32();
  if ((id & 0x80000000) !== 0) {
    const len = id & 0x7FFFFFFF;
    return reader.readChars(len);
  }
  return stringTable[id];
}

function _padToLen(reader, len) {
  const extra = 4 - (len % 4);
  if (extra < 4) {
    reader.read(extra);
  }
}


export class Variant {
  constructor(reader, formatVersion, stringTable=[]) {
    this.typeID = reader.readInt32();
    switch (this.typeID) {
      case VARIANT_NIL:
        this.value = null;
        break;
      case VARIANT_BOOL:
        this.value = !!reader.readUInt32();
        break;
      case VARIANT_INT:
        this.value = reader.readInt32();
        break;
      case VARIANT_INT64:
        this.value = reader.readInt64();
        break;
      case VARIANT_FLOAT:
        this.value = reader.readFloat32();
        break;
      case VARIANT_DOUBLE:
        this.value = reader.readFloat64();
        break;
      case VARIANT_STRING:
        this.value = reader.readString();
        break;
      case VARIANT_VECTOR2:
        this.value = reader.readVector2();
        break;
      case VARIANT_VECTOR2I:
        this.value = reader.readIVector2();
        break;
      case VARIANT_RECT2:
        this.value = {
          position: reader.readVector2(),
          size: reader.readVector2()
        }
        break;
      case VARIANT_RECT2I:
        this.value = {
          position: reader.readIVector2(),
          size: reader.readIVector2()
        }
        break;
      case VARIANT_VECTOR3:
        this.value = reader.readVector3();
        break;
      case VARIANT_VECTOR3I:
        this.value = reader.readIVector3();
        break;
      case VARIANT_VECTOR4:
        this.value = reader.readVector4();
        break;
      case VARIANT_VECTOR4I:
        this.value = reader.readIVector4();
        break;
      case VARIANT_PLANE:
        this.value = {
          normal: reader.readVector3(),
          d: reader.readFloat32()
        }
        break;
      case VARIANT_QUATERNION:
        this.value = reader.readQuaternion();
        break;
      case VARIANT_AABB:
        this.value = {
          position: reader.readVector3(),
          size: reader.readVector3()
        }
        break;
      case VARIANT_TRANSFORM2D:
        this.value = {
          columns: [
            reader.readVector2(),
            reader.readVector2(),
            reader.readVector2()
          ]
        }
        break;
      case VARIANT_BASIS:
        this.value = {
          rows: [
            reader.readVector3(),
            reader.readVector3(),
            reader.readVector3()
          ]
        }
        break;
      case VARIANT_TRANSFORM3D:
        this.value = {
          rows: [
            reader.readVector3(),
            reader.readVector3(),
            reader.readVector3()
          ],
          origin: reader.readVector3()
        }
        break;
      case VARIANT_PROJECTION:
        this.value = {
          columns: [
            reader.readVector4(),
            reader.readVector4(),
            reader.readVector4(),
            reader.readVector4()
          ]
        }
        break;
      case VARIANT_COLOR:
        this.value = reader.readColor();
        break;
      case VARIANT_STRING_NAME:
        this.value = reader.readString();
        break;
      case VARIANT_NODE_PATH:
        const numNames = reader.readInt16();
        let numSubNames = reader.readInt16();
        const abs = numSubNames & 0x8000;
        numSubNames &= 0x7FFF;
        if (formatVersion < FORMAT_VERSION_NO_NODEPATH_PROPERTY) {
          numSubNames++;
        }
        let names = [];
        for (let i = 0; i < numNames; i++) {
          names.push(getString(reader, stringTable));
        }
        let subNames = [];
        for (let i = 0; i < numSubNames; i++) {
          subNames.push(getString(reader, stringTable));
        }
        this.value = {
          names: names,
          subnames: subNames,
          absolute: !!abs
        }
        break;
      case VARIANT_RID:
        this.value = reader.readInt32();
        break;
      case VARIANT_OBJECT:
        const objType = reader.readInt32();
        switch (objType) {
          case OBJECT_EMPTY:
            break;
          case OBJECT_INTERNAL_RESOURCE:
            this.value = {
              internalID: reader.readInt32()
            }
            break;
          case OBJECT_EXTERNAL_RESOURCE:
            const extType = reader.readString();
            const path = reader.readString();
            this.value = {
              externalType: extType,
              path: path
            }
            break;
          case OBJECT_EXTERNAL_RESOURCE_INDEX:
            this.value = {
              externalID: reader.readInt32()
            }
            break;
        }
        break;
      case VARIANT_CALLABLE:
        this.value = {};  // ...
        break;
      case VARIANT_SIGNAL:
        this.value = {};  //
        break;
      case VARIANT_DICTIONARY:
        const len = reader.readInt32() & 0x7FFFFFFF;
        this.value = [];
        for (let i = 0; i < len; i++) {
          const key = new Variant(reader, formatVersion, stringTable);
          const value = new Variant(reader, formatVersion, stringTable);
          this.value.push(new KVPair(key, value));
        }
        break;
      case VARIANT_ARRAY:
        const arrLen = reader.readInt32() & 0x7FFFFFFF;
        this.value = [];
        for (let i = 0; i < arrLen; i++) {
          this.value.push(new Variant(reader, formatVersion, stringTable));
        }
        break;
      case VARIANT_PACKED_BYTE_ARRAY:
        const bLen = reader.readInt32();
        this.value = reader.read(bLen);
        _padToLen(reader, bLen);
        break;
      case VARIANT_PACKED_INT32_ARRAY:
        this.value = reader.readArrayT(reader.readInt32.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_INT64_ARRAY:
        this.value = reader.readArrayT(reader.readInt64.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_FLOAT32_ARRAY:
        this.value = reader.readArrayT(reader.readFloat32.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_FLOAT64_ARRAY:
        this.value = reader.readArrayT(reader.readFloat64.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_STRING_ARRAY:
        this.value = reader.readArrayT(reader.readString.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_VECTOR2_ARRAY:
        this.value = reader.readArrayT(reader.readVector2.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_VECTOR3_ARRAY:
        this.value = reader.readArrayT(reader.readVector3.bind(reader), reader.readInt32());
        break;
      case VARIANT_PACKED_COLOR_ARRAY:
        this.value = reader.readArrayT(reader.readColor.bind(reader), reader.readInt32());
        break;
    }
  }
}