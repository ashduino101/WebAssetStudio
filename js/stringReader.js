const NUMBER_PATTERN = /[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?/i;

export default class StringReader {
  constructor(string) {
    this.data = string;
    this.pos = 0;
  }

  set(string) {
    this.data = string;
    this.pos = 0;
  }

  canRead(length = 0) {
    return this.pos + length < this.data.length;
  }

  read(n) {
    return this.data.slice(this.pos, this.pos += n);
  }

  peek(n = 1) {
    return this.data.slice(this.pos, this.pos + n);
  }

  skipWhitespace() {
    while (this.canRead() && this.peek() === ' ') {
      this.read(1);
    }
  }

  readStringUntil(term) {
    let res = "";
    let escaped = false;
    while (this.canRead()) {
      let c = this.read(1);
      if (escaped) {
        if (c === term || c === '\\') {
          res += c;
          escaped = false;
        } else {
          this.pos -= 1;
          throw new Error("Invalid escape sequence");
        }
      } else if (c === '\\') {
        escaped = true;
      } else if (c === term) {
        return res;
      } else {
        res += c;
      }
    }

    throw new Error("EOF while parsing input");
  }

  isAllowedInUnquotedString(c) {
    return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.+'.includes(c);
  }

  isQuotedStringStart(c) {
    return c === '"' || c === '\'';
  }

  readUnquotedString() {
    let res = '';
    while (this.canRead() && this.isAllowedInUnquotedString(this.peek())) {
      res += this.read(1);
    }
    return res;
  }

  readQuotedString() {
    if (!this.canRead()) {
      return '';
    }

    let next = this.read(1);
    if (!this.isQuotedStringStart(next)) {
      throw new Error("Expected start of string");
    }

    return this.readStringUntil(next);
  }

  readString() {
    this.skipWhitespace();
    if (!this.canRead()) {
      throw new Error("Expected string");
    }
    let next = this.peek();
    if (this.isQuotedStringStart(next)) {
      this.read(1);
      return this.readStringUntil(next);
    }
    return this.readUnquotedString();
  }

  parsePrimitive(s) {
    if (s.match(NUMBER_PATTERN)) {
      return parseFloat(s);
    }
    if (s.toLowerCase() === 'true') {
      return true;
    }
    if (s.toLowerCase() === 'false') {
      return false;
    }
    return s;
  }

  parseElement() {
    this.skipWhitespace();
    let pos = this.pos;
    if (this.isQuotedStringStart(this.peek())) {
      return this.readQuotedString();
    }
    let s = this.readUnquotedString();
    if (s === '') {
      this.pos = pos;
      throw new Error("Expected value");
    }
    return this.parsePrimitive(s);
  }
}