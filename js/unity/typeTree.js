import {GeneratedObject} from "./generatedObject";
import {PPtr} from "./pptr";
import {CompressedMesh} from "./compressedMesh";


const SUPPORTED_TYPES = {
  'bool': 'r.readBool()',

  'SInt8': 'r.readInt8()',
  'UInt8': 'r.readUInt8()',
  'char': 'r.readUInt8()',

  'SInt16': 'r.readInt16()',
  'short': 'r.readInt16()',
  'UInt16': 'r.readUInt16()',
  'unsigned short': 'r.readUInt16()',

  'SInt32': 'r.readInt32()',
  'int': 'r.readInt32()',
  'UInt32': 'r.readUInt32()',
  'unsigned int': 'r.readUInt32()',
  'Type*': 'r.readUInt32()',

  'long long': 'Number(r.readInt64())',
  'SInt64': 'Number(r.readInt64())',
  'unsigned long long': 'Number(r.readUInt64())',
  'UInt64': 'Number(r.readUInt64())',
  'FileSize': 'Number(r.readUInt64())',

  'float': 'r.readFloat32()',
  'double': 'r.readFloat64()',

  'Vector2f': 'r.readVector2()',
  'Vector3f': 'r.readVector3()',
  'Vector4f': 'r.readVector4()',
  'Quaternionf': 'r.readQuaternion()',

  'ColorRGBA': 'r.readColor()',

  'Matrix4x4f': 'r.readMatrix()',
  'GUID': 'r.readGUID()',
  'Hash128': 'r.readGUID()',

  'TypelessData': 'r.read(reader.readUInt32())',

  'string': 'r.readAlignedString()',  // strings are always aligned

  // though this is provided in the type tree, it's a bit hard to
  // tell if it's an int or a float vector, so we just handle the
  // entire compressed mesh as a class
  'CompressedMesh': 'new CompressedMesh(r)'
}

const SUPPORTED_ARRAY_OVERRIDES = {
  'SInt8': 'Int8Array',
  'UInt8': 'Uint8Array',
  'char': 'Uint8Array',

  'SInt16': 'Int16Array',
  'short': 'Int16Array',
  'UInt16': 'Uint16Array',
  'unsigned short': 'Uint16Array',

  'SInt32': 'Int32Array',
  'int': 'Int32Array',
  'UInt32': 'Uint32Array',
  'unsigned int': 'Uint32Array',

  'float': 'Float32Array',
  'double': 'Float64Array'
}


export class BaseTypeTree {
  constructor() {
    this.version = null;
    this.level = null;
    this.typeFlags = null;
    this.type = null;
    this.name = null;
    this.size = null;
    this.index = null;
    this.metaFlag = null;

    this.children = [];
    this.textDecoder = new TextDecoder('utf-8');
  }

  async _generateParser(tree, obj = 'this', ret = false) {
    let s = '';
    let rs = '';
    if (tree.type in SUPPORTED_TYPES) {
      if (ret) {
        s += `return ${SUPPORTED_TYPES[tree.type]};`;
      } else {
        s += `${obj}["${tree.name}"]=${SUPPORTED_TYPES[tree.type]};`;
      }
    } else if (tree.type.match(/PPtr<[a-zA-Z0-9_]+>/g)) {
      if (ret) {
        s += `return new PPtr(r);`;
      } else {
        s += `${obj}["${tree.name}"]=new PPtr(r);`;
      }
    } else if (tree.type === 'Array') {
      const len_name = `L_${Math.random().toString(36).substring(2)}`;
      s += `const ${len_name}=${SUPPORTED_TYPES[tree.children[0].type]};`;
      if (tree.children[1].type in SUPPORTED_ARRAY_OVERRIDES) {
        s += `${obj}["${tree.name}"]=new ${SUPPORTED_ARRAY_OVERRIDES[tree.children[1].type]}(${len_name});`;
      } else {
        s += `${obj}["${tree.name}"]=new Array(${len_name});`;
      }
      s += `for (let i=0;i<${len_name};i++){`;
      s += `${obj}["${tree.name}"][i]=(function(r){const obj = {};${await this._generateParser(tree.children[1], 'obj', true)}})(r);`;
      s += `if (typeof ${obj}["${tree.name}"][i]=='object')${obj}["${tree.name}"][i].exposedAttributes=Object.keys(${obj}["${tree.name}"][i]).filter(i =>  i !== 'exposedAttributes');`;
      s += `}`;
      if (ret) {
        rs = 'return this;';
      }
    } else if (tree.children.length === 1 && tree.children[0].typeFlags === 1) {
      const arrChild = tree.children[0];
      arrChild.name = tree.name;
      return await this._generateParser(arrChild, obj);
    } else {
      for (const child of tree.children) {
        s += `${obj}["${tree.name}"]=${obj}["${tree.name}"]??{};`;
        s += await this._generateParser(child, `${obj}["${tree.name}"]`);
        s += `${obj}["${tree.name}"]["exposedAttributes"]=Object.keys(${obj}["${tree.name}"]).filter(i =>  i !== 'exposedAttributes');`;
      }
      if (ret) {
        rs = `return ${obj};`;
      }
    }
    if ((tree.metaFlag & 16384) === 16384) {
      s += 'r.align(4);';
    }
    if (ret) {
      s += rs;
    }
    return s;
  }

  async compile() {
    let s = `const PPtr=this.PPtr;const CompressedMesh=this.CompressedMesh;
    return(class ${this.type} extends this.GeneratedObject{constructor(reader){super(reader);const r=reader;`;
    for (const child of this.children) {
      s += await this._generateParser(child);
    }
    s += `}static exposedAttributes=[${this.children.map(c => `"${c.name}"`)}]});`;
    window.global__compileStats = window.global__compileStats ?? {};
    window.global__compileStats.total = window.global__compileStats.total ?? 0;
    window.global__compileStats.numCompiled = window.global__compileStats.numCompiled ?? 0;
    window.global__compileStats.total += s.length;
    window.global__compileStats.numCompiled += 1;
    return Function(s).bind({GeneratedObject, PPtr, CompressedMesh})();
  }
}