import StringReader from "../stringReader";

const isIdentifierValid = c => {
  return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.includes(c);
}


const TOKEN_NAMES = [
  "'{'",
  "'}'",
  "'['",
  "']'",
  "'('",
  "')'",
  "identifier",
  "string",
  "string_name",
  "number",
  "color",
  "':'",
  "','",
  "'.'",
  "'='",
  "EOF",
  "ERROR"
];

export const TokenType =  {
  TK_CURLY_BRACKET_OPEN: 0,
  TK_CURLY_BRACKET_CLOSE: 1,
  TK_BRACKET_OPEN: 2,
  TK_BRACKET_CLOSE: 3,
  TK_PARENTHESIS_OPEN: 4,
  TK_PARENTHESIS_CLOSE: 5,
  TK_IDENTIFIER: 6,
  TK_STRING: 7,
  TK_STRING_NAME: 8,
  TK_NUMBER: 9,
  TK_COLOR: 10,
  TK_COLON: 11,
  TK_COMMA: 12,
  TK_PERIOD: 13,
  TK_EQUAL: 14,
  TK_EOF: 15,
  TK_ERROR: 16,
  TK_MAX: -1
};

const Expecting = {
  EXPECT_OBJECT: 0,
  EXPECT_OBJECT_KEY: 1,
  EXPECT_COLON: 2,
  EXPECT_OBJECT_VALUE: 3,
};

const CONSTRUCT_TYPES = {
  'Vector2': ['x', 'y'],
  'Vector2i': ['x', 'y'],
  'Rect2': ['x', 'y', 'w', 'h'],
  'Rect2i': ['x', 'y', 'w', 'h'],
  'Vector3': ['x', 'y', 'z'],
  'Vector3i': ['x', 'y', 'z'],
  'Vector4': ['x', 'y', 'z', 'w'],
  'Vector4i': ['x', 'y', 'z', 'w'],
  'Transform2D': ['xx', 'xy', 'yx', 'yy', 'ox', 'oy'],
  'Matrix32': ['xx', 'xy', 'yx', 'yy', 'ox', 'oy'],
  'Plane': ['normal.x', 'normal.y', 'normal.z', 'd'],
  'Quaternion': ['x', 'y', 'z', 'w'],
  'Quat': ['x', 'y', 'z', 'w'],
  'AABB': ['pos.x', 'pos.y', 'pos.z', 'size.x', 'size.y', 'size.z'],
  'Rect3': ['pos.x', 'pos.y', 'pos.z', 'size.x', 'size.y', 'size.z'],
  'Basis': ['xx', 'xy', 'xz', 'yx', 'yy', 'yz', 'zx', 'zy', 'zz'],
  'Matrix3': ['xx', 'xy', 'xz', 'yx', 'yy', 'yz', 'zx', 'zy', 'zz'],
  'Transform3D': ['basis.xx', 'basis.xy', 'basis.xz', 'basis.yx', 'basis.yy',
    'basis.yz', 'basis.zx', 'basis.zy', 'basis.zz', 'origin.x', 'origin.y', 'origin.z'],
  'Transform': ['basis.xx', 'basis.xy', 'basis.xz', 'basis.yx', 'basis.yy',
    'basis.yz', 'basis.zx', 'basis.zy', 'basis.zz', 'origin.x', 'origin.y', 'origin.z'],
  'Projection': ['xx', 'xy', 'xz', 'xw', 'yx', 'yy', 'yz', 'yw', 'zx', 'zy', 'zz', 'zw', 'wx', 'wy', 'wz', 'ww'],
  'Color': ['r', 'g', 'b', 'a'],
  'PackedByteArray': null,
  'PoolByteArray': null,
  'ByteArray': null,
  'PackedInt32Array': null,
  'PackedIntArray': null,
  'PoolPackedIntArray': null,
  'IntArray': null,
  'PackedInt64Array': null,
  'PackedFloat32Array': null,
  'PackedRealArray': null,
  'PoolRealArray': null,
  'FloatArray': null,
  'PackedFloat64Array': null,
}

class Token {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  getName() {
    return TOKEN_NAMES[this.type];
  }
}

class Tag {
  constructor(name, fields) {
    this.name = name;
    this.fields = fields;
  }
}

export class VariantParser {
  constructor(data) {
    this.stream = new StringReader(data.split('\0')[0].replaceAll('\r', '') + '\n\n');  // stupid hack: add a newline so that eofs don't truncate the data when we readahead 2 bytes
  }

  getToken() {
    let stringName = false;
    let token = new Token(null, null);
    let line = 0;
    let err = null;

    while (true) {
      if (!this.stream.canRead()) {
        token.type = TokenType.TK_EOF;
        return {token, line, err};
      }

      let char = this.stream.read(1);

      switch (char) {
        case '\n':
          line++;
          break;
        case '{':
          token.type = TokenType.TK_CURLY_BRACKET_OPEN;
          return {token, line, err};
        case '}':
          token.type = TokenType.TK_CURLY_BRACKET_CLOSE;
          return {token, line, err};
        case '[':
          token.type = TokenType.TK_BRACKET_OPEN;
          return {token, line, err};
        case ']':
          token.type = TokenType.TK_BRACKET_CLOSE;
          return {token, line, err};
        case '(':
          token.type = TokenType.TK_PARENTHESIS_OPEN;
          return {token, line, err};
        case ')':
          token.type = TokenType.TK_PARENTHESIS_CLOSE;
          return {token, line, err};
        case ':':
          token.type = TokenType.TK_COLON;
          return {token, line, err};
        case ';':
          while (true) {
            if (!this.stream.canRead()) {
              token.type = TokenType.TK_EOF;
              return {token, line, err};
            }
            let ch = this.stream.read(1);
            if (ch === '\n') {
              line++;
              break;
            }
          }
          break;
        case ',':
          token.type = TokenType.TK_COMMA;
          return {token, line, err};
        case '.':
          token.type = TokenType.TK_PERIOD;
          return {token, line, err};
        case '=':
          token.type = TokenType.TK_EQUAL;
          return {token, line, err};
        case '#':
          let col = '#';
          while (true) {
            if (!this.stream.canRead()) {
              token.type = TokenType.TK_EOF;
              return {token, line, err};
            }
            let c = this.stream.peek(1);
            if ('0123456789abcdef'.includes(c)) {
              col += this.stream.read(1);
            } else {
              break;
            }
          }

          token.value = col;
          token.type = TokenType.TK_COLOR;
          return {token, line, err};
        case '@':
        case '&':
          let c = this.stream.read(1);
          if (c !== '"') {
            err = 'Expected \'"\' after \'&\'';
            token.type = TokenType.TK_ERROR;
            return {token, line, err};
          }

          stringName = true;
        // eslint-disable-next-line no-fallthrough
        case '"':
          let str = '';
          while (true) {
            let ch = this.stream.read(1);
            if (ch === 0) {
              err = 'Unterminated string';
              token.type = TokenType.TK_ERROR;
              return {token, line, err};
            } else if (ch === '"') {
              break;
            } else if (ch === '\\') {
              if (!this.stream.canRead()) {
                err = 'Unterminated string';
                token.type = TokenType.TK_ERROR;
                return {token, line, err};
              }
              let next = this.stream.read(1);
              let res = 0;

              switch (next) {
                case 'b':
                  res = '\b';
                  break;
                case 't':
                  res = '\t';
                  break;
                case 'n':
                  res = '\n';
                  break;
                case 'f':
                  res = '\f';
                  break;
                case 'r':
                  res = '\r';
                  break;
                case 'u':
                case 'U':
                  let hexLen = (next === 'U') ? 6 : 4;
                  let uc = 0;
                  for (let i = 0; i < hexLen; i++) {
                    if (!this.stream.canRead()) {
                      err = 'Unterminated string';
                      token.type = TokenType.TK_ERROR;
                      return {token, line, err};
                    }
                    let c = this.stream.read(1);
                    if (!'0123456789abcdef'.includes(c)) {
                      err = 'Malformed hex constant in string';
                      token.type = TokenType.TK_ERROR;
                      return {token, line, err};
                    }
                    uc <<= 4;
                    uc |= parseInt(c, 16);
                  }
                  res = String.fromCharCode(uc);
                  break;
                default:
                  res = next;
              }

              str += res;
            } else {
              if (ch === '\n') {
                line++;
              }

              str += ch;
            }
          }

          if (stringName) {
            token.type = TokenType.TK_STRING_NAME;
          } else {
            token.type = TokenType.TK_STRING;
          }
          token.value = str;
          return {token, line, err};
        default:
          let code = char.charCodeAt(0);
          if (code <= 32) {
            break;
          }

          if (char === '-' || code >= 48 & char <= 57) {  // (-)0 to 9
            let num = '';
            const READING_INT = 1;
            const READING_DEC = 2;
            const READING_EXP = 3;
            const READING_DONE = 4;
            let reading = READING_INT;

            if (char === '-') {
              num += '-';
            } else {
              this.stream.backtrack(1);
            }

            let expSign = false;
            let expBeg = false;
            let isFloat = false;

            while (this.stream.canRead(1)) {
              let c = this.stream.read(1);
              switch (reading) {
                case READING_INT:
                  if ('0123456789'.includes(c)) {

                  } else if (c === '.') {
                    reading = READING_DEC;
                    isFloat = true;
                  } else if (c === 'e') {
                    reading = READING_EXP;
                    isFloat = true;
                  } else {
                    reading = READING_DONE;
                  }
                  break;
                case READING_DEC:
                  if ('0123456789'.includes(c)) {

                  } else if (c === 'e') {
                    reading = READING_EXP;
                  } else {
                    reading = READING_DONE;
                  }
                  break;
                case READING_EXP:
                  if ('0123456789'.includes(c)) {
                    expBeg = true;
                  } else if ((c === '-' || c === '+') && !expSign && !expBeg) {
                    expSign = true;
                  } else {
                    reading = READING_DONE;
                  }
                  break;
              }
              if (reading === READING_DONE) {
                break;
              }
              num += c;
            }

            this.stream.backtrack(1);

            token.type = TokenType.TK_NUMBER;
            if (isFloat) {
              token.value = parseFloat(num);
            } else {
              token.value = parseInt(num);
            }

            return {token, line, err};
          } else if (isIdentifierValid(char) || char === '_') {
            let id = '';
            let first = true;
            while (isIdentifierValid(char) || char === '_') {
              id += char;
              char = this.stream.read(1);
              first = false;
            }
            this.stream.backtrack(1);
            token.type = TokenType.TK_IDENTIFIER;
            token.value = id;
            return {token, line, err};
          } else {
            err = 'Unexpected character';
            token.type = TokenType.TK_ERROR;
            return {token, line, err};
          }
      }
    }
  }

  parseConstruct() {
    let {token, line, err} = this.getToken();
    let construct = [];
    if (token.type !== TokenType.TK_PARENTHESIS_OPEN) {
      err = 'Expected \'(\' in constructor';
      return {construct: null, line, err};
    }

    let first = true;
    while (true) {
      if (!first) {
        let {token, line, err} = this.getToken();
        if (token.type === TokenType.TK_COMMA) {

        } else if (token.type === TokenType.TK_PARENTHESIS_CLOSE) {
          break;
        } else {
          err = 'Expected \',\' or \')\' in constructor';
          return {construct: null, line, err};
        }
      }
      let r = this.getToken();

      if (first && r.token.type === TokenType.TK_PARENTHESIS_CLOSE) {
        break;
      } else if (r.token.type !== TokenType.TK_NUMBER) {
        let valid = false;
        if (r.token.type === TokenType.TK_IDENTIFIER && r.token.value !== -1) {
          r.token.type = TokenType.TK_NUMBER;
          valid = true;
        }
        if (!valid) {
          err = 'Expected float in constructor';
          return {construct: null, line, err};
        }
      }
      construct.push(r.token.value);
      first = false;
    }

    return {construct: construct, line, err};
  }

  parseArray() {
    let needComma = false;
    let array = [];

    while (true) {
      if (!this.stream.canRead()) {
        return {value: null, err: 'Unexpected EOF while parsing array'};
      }

      let {token, line, err} = this.getToken();
      if (err) return {value: null, line, err};

      if (token.type === TokenType.TK_BRACKET_CLOSE) {
        return {value: array, line, err: null};
      }

      if (needComma) {
        if (token.type !== TokenType.TK_COMMA) {
          return {value: null, line, err: 'Expected \',\''};
        } else {
          needComma = false;
          continue;
        }
      }

      let {value, err: valErr} = this.parseValue(token);
      if (valErr) return {value: null, line, err: valErr};

      array.push(value);
      needComma = true;
    }
  }

  parseDictionary() {
    let atKey = true;
    let needComma = false;
    let key = null;
    let dict = {};

    while (true) {
      if (!this.stream.canRead()) {
        return {value: null, line: null, err: 'Unexpected EOF while parsing dictionary'};
      }

      if (atKey) {
        let {token, line, err} = this.getToken();
        if (err) return {value: null, line, err};

        if (token.type === TokenType.TK_CURLY_BRACKET_CLOSE) {
          return {value: dict, line, err: null};
        }

        if (needComma) {
          if (token.type !== TokenType.TK_COMMA) {
            return {value: null, line, err: 'Expected \'}\' or \',\''};
          } else {
            needComma = false;
            continue;
          }
        }

        let {value, err: valErr} = this.parseValue(token);
        if (valErr) return {value: null, line, valErr};

        key = value;

        let t = this.getToken();

        if (t.err) return {value: null, line: t.line, err: t.err};

        if (t.token.type !== TokenType.TK_COLON) {
          return {value: null, line: t.line, err: 'Expected \':\''};
        }
        atKey = false;
      } else {
        let {token, line, err} = this.getToken();
        if (err) return {value: null, line, err};

        let {value: pValue, err: valErr} = this.parseValue(token);
        if (valErr) return {value: null, line, err: valErr};

        dict[key] = pValue;
        needComma = true;
        atKey = true;
      }
    }
  }

  parseValue(token) {
    if (token.type === TokenType.TK_CURLY_BRACKET_OPEN) {
      return this.parseDictionary();
    } else if (token.type === TokenType.TK_BRACKET_OPEN) {
      return this.parseArray();
    } else if (token.type === TokenType.TK_IDENTIFIER) {
      let value = token.value;
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === 'null' || value === 'nil') {
        value = null;
      } else if (value === 'inf') {
        value = Infinity;
      } else if (value === 'inf_neg') {
        value = -Infinity;
      } else if (value === 'nan') {
        value = NaN;
      } else if (value in CONSTRUCT_TYPES) {
        let c = this.parseConstruct();
        let def = CONSTRUCT_TYPES[value];
        if (def) {
          if (c.construct) {
            if (c.construct.length !== def.length) {
              return {value: null, line: c.line, err: `Expected ${def.length} arguments for constructor`};
            }
            const f = {};
            let i = 0;
            for (const attr of def) {
              if (attr.includes('.')) {
                let sect = attr.split('.');
                f[sect[0]] = f[sect[0]] ?? {};
                f[sect[0]][sect[1]] = c.construct[i];
              } else {
                f[attr] = c.construct[i];
              }
              i++;
            }
            value = f;
          } else {
            value = c.construct;
          }
        }
      } else if (value === 'NodePath') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }
        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_STRING) {
          return {value: null, line: tok.line, err: 'Expected string as argument for NodePath()'};
        }

        value = tok.token.value;

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_CLOSE) {
          return {value: null, line: tok.line, err: 'Expected \')\''};
        }
      } else if (value === 'RID') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }

        tok = this.getToken();
        if (tok.token.type === TokenType.TK_PARENTHESIS_CLOSE) {
          value = null;
          return {value, line: tok.line, err: null};
        } else if (tok.token.type !== TokenType.TK_NUMBER) {
          return {value: null, line: tok.line, err: 'Expected number as RID argument'};
        }

        value = tok.token.value;

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_CLOSE) {
          return {value: null, line: tok.line, err: 'Expected \')\''};
        }
      } else if (value === 'Signal') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }

        value = null;

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_CLOSE) {
          return {value: null, line: tok.line, err: 'Expected \')\''};
        }
      } else if (value === 'Object') {
        throw new Error('TODO: object parsing');
      } else if (value === 'Resource' || value === 'SubResource' || value === 'ExtResource') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }
        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_STRING) {
          return {value: null, line: tok.line, err: 'Expected string as an argument for Resource()'};
        }

        value = tok.token.value;

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_CLOSE) {
          return {value: null, line: tok.line, err: 'Expected \')\''};
        }
      } else if (value === 'Array') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_BRACKET_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_IDENTIFIER) {
          return {value: null, line: tok.line, err: 'Expected type identifier'};
        }

        let {value: arr, err} = this.parseArray();
        if (err) return {value: null, line: tok.line, err}

        tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_CLOSE) {
          return {value: null, line: tok.line, err: 'Expected \')\''};
        }

        value = arr;
      } else if (value === 'PackedStringArray' || value === 'PoolStringArray' || value === 'StringArray') {
        let tok = this.getToken();
        if (tok.token.type !== TokenType.TK_PARENTHESIS_OPEN) {
          return {value: null, line: tok.line, err: 'Expected \'(\''};
        }

        let cs = [];

        let first = true;
        while (true) {
          if (!first) {
            let {token, line, err} = this.getToken();
            if (token.type === TokenType.TK_COMMA) {

            } else if (token.type === TokenType.TK_PARENTHESIS_CLOSE) {
              break;
            } else {
              return {value: null, line, err: 'Expected \',\' or \')\''};
            }
          }

          let {token, line, err} = this.getToken();

          if (token.type === TokenType.TK_PARENTHESIS_CLOSE) {
            break;
          } else if (token.type !== TokenType.TK_STRING) {
            return {value: null, line, err: 'Expected string'};
          }

          first = false;
          cs.push(token.value);
        }

        value = cs;
      } else {
        return {value: null, line: token.line, err: `Unexpected identifier '${value}'`};
      }
      return {value, line: token.line, err: null};
    } else if ([TokenType.TK_NUMBER, TokenType.TK_STRING, TokenType.TK_STRING_NAME, TokenType.TK_CURLY_BRACKET_OPEN]
      .includes(token.type)) {
      return {value: token.value, line: token.line, err: null};
    } else {
      return {value: null, line: token.line, err: `Expected value, got ${TOKEN_NAMES[token.type]}`};
    }
  }

  parseTag(token) {
    if (token.type !== TokenType.TK_BRACKET_OPEN) {
      return {value: null, line: token.line, err: 'Expected \'[\''};
    }

    // TODO: support complex tags

    let tagName = '';
    let escaping = false;

    while (true) {
      let c = this.stream.read(1);
      if (!this.stream.canRead()) {
        return {value: null, err: `Unexpected EOF while parsing tag`};
      }
      if (c === ']') {
        if (escaping) {
          escaping = false;
        } else {
          break;
        }
      }
      tagName += c;
    }

    return {value: tagName, line: token.line, err: null};
  }

  parseResource() {
    let currentTag = null;
    let res = {};
    let cur = {}
    while (true) {
      if (!this.stream.canRead(2)) break;

      let {token, line, err} = this.getToken();
      if (token.type === TokenType.TK_EOF) break;
      if (err) return {value: null, line, err};

      if (token.type === TokenType.TK_BRACKET_OPEN) {
        // A tag
        if (currentTag != null) {
          res[currentTag] = Object.freeze(cur);
          cur = {};
        }
        currentTag = this.parseTag(token).value
        this.stream.skipWhitespace();
      }

      token = new Token();
      let tagEnd = false;
      while (this.stream.canRead(2)) {
        let key = '';
        while (this.stream.canRead(1)) {
          let c = this.stream.read(1);
          if (c === '[') {
            tagEnd = true;
            this.stream.backtrack(1);
            break;
          }
          if (c === ' ') continue;
          if (c === '=') break;
          key += c;
        }
        key = key.replaceAll(/[ \n]/g, '');
        if (tagEnd) break;
        let {token, line, err} = this.getToken();
        if (token.type === TokenType.TK_EOF) break;
        if (err) return {value: null, line, err};
        let val = this.parseValue(token);
        if (val.err) return {value: null, line, err: val.err};
        const recAssign = (c, p, v) => {
          if (p.length > 1) {
            let part = p.pop();
            c[part] = c[part] ?? {}
            recAssign(c[part], p, v);
          } else {
            c[p[0]] = v;
          }
        }
        recAssign(cur, key.split('/').reverse(), val.value);
      }
    }
    res[currentTag] = Object.freeze(cur);
    return {value: res, err: null}
  }
}
