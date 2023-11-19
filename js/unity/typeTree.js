import {GeneratedObject} from "./generatedObject";
import {PPtr} from "./pptr";


const SUPPORTED_TYPES = {
  'bool': 'reader.readBool()',

  'SInt8': 'reader.readInt8()',
  'UInt8': 'reader.readUInt8()',
  'char': 'reader.readUInt8()',

  'SInt16': 'reader.readInt16()',
  'short': 'reader.readInt16()',
  'UInt16': 'reader.readUInt16()',
  'unsigned short': 'reader.readUInt16()',

  'SInt32': 'reader.readInt32()',
  'int': 'reader.readInt32()',
  'UInt32': 'reader.readUInt32()',
  'unsigned int': 'reader.readUInt32()',
  'Type*': 'reader.readUInt32()',

  'long long': 'Number(reader.readInt64())',
  'SInt64': 'Number(reader.readInt64())',
  'unsigned long long': 'Number(reader.readUInt64())',
  'UInt64': 'Number(reader.readUInt64())',
  'FileSize': 'Number(reader.readUInt64())',

  'float': 'reader.readFloat32()',
  'double': 'reader.readFloat64()',

  'Vector2f': 'reader.readVector2()',
  'Vector3f': 'reader.readVector3()',
  'Vector4f': 'reader.readVector4()',
  'Quaternionf': 'reader.readQuaternion()',

  'ColorRGBA': 'reader.readColor()',

  'Matrix4x4f': 'reader.readMatrix()',
  'GUID': 'reader.readGUID()',
  'Hash128': 'reader.readGUID()',

  'TypelessData': 'reader.read(reader.readUInt32())',

  'string': 'reader.readAlignedString()'  // strings are always aligned
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
        s += `return new PPtr(reader);`;
      } else {
        s += `${obj}["${tree.name}"]=new PPtr(reader);`;
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
      s += `${obj}["${tree.name}"][i]=(function(reader){const obj = {};${await this._generateParser(tree.children[1], 'obj', true)}})(reader);`;
      s += `if (typeof ${obj}["${tree.name}"][i]=='object')${obj}["${tree.name}"][i].exposedAttributes=Object.keys(${obj}["${tree.name}"][i]).filter(i =>  i !== 'exposedAttributes');`;
      s += `}`;
      if (ret) {
        rs = 'return this;';
      }
    } else if (tree.type === 'vector') {
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
      s += 'reader.align(4);';
    }
    if (ret) {
      s += rs;
    }
    return s;
  }

  async compile() {
    let s = `const PPtr=this.PPtr;return(class ${this.type} extends this.GeneratedObject{constructor(reader){super(reader);`
    for (const child of this.children) {
      s += await this._generateParser(child);
    }
    s += `}static exposedAttributes=[${this.children.map(c => `"${c.name}"`)}]});`;
    window.global__compileStats = window.global__compileStats ?? {};
    window.global__compileStats.total = window.global__compileStats.total ?? 0;
    window.global__compileStats.total += s.length;
    console.log('Total:', window.global__compileStats.total);
    return Function(s).bind({GeneratedObject, PPtr})();
  }
}