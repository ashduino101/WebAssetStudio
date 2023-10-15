import StringReader from "./stringReader";

class FilterReader extends StringReader {
  constructor(string) {
    super(string);
  }

  readOperator() {
    this.skipWhitespace();
    let next = this.peek();
    if (!('<>!='.includes(next))) {
      throw new Error("Invalid operator");
    }
    this.read(1)
    if ('<>'.includes(next) && this.peek() !== '=') {
      return next;
    }
    this.read(1);
    return next + '=';  // All operators are 2 characters except for `<` and `>`
  }

  readBoolOp() {
    this.skipWhitespace();
    if (!(['&&'].includes(this.peek(2)))) {
      throw new Error("Invalid boolean operation");
    }
    return this.read(2);
  }

  parseFilter() {
    let out = [];
    while (this.canRead()) {
      let sep = null;
      if (this.pos > 0) {
        sep = this.readBoolOp();
      }
      let key = this.readString();
      let op = this.readOperator();
      let val = this.parseElement();
      out.push({key, op, val, sep});
    }
    return out;
  }

  getLastToken() {
    let out = null;
    let type = null;
    while (this.canRead()) {
      if (this.pos > 0) {
        this.skipWhitespace()
        if (this.canRead()) {
          out = this.readBoolOp();
          type = 'separator';
        } else {
          return {
            type: 'invalid',
            value: null
          };
        }
      }
      this.skipWhitespace()
      if (this.canRead()) {
        out = this.readString();
        type = 'name';
      }
      this.skipWhitespace()
      if (this.canRead()) {
        out = this.readOperator();
        type = 'operator';
      }
      this.skipWhitespace()
      if (this.canRead()) {
        out = this.parseElement();
        type = 'value';
      }
    }
    return {
      type: type,
      value: out
    };
  }
}

export default class Filter {
  constructor() {
    this.input = document.getElementById('filter-input')
    this.input.addEventListener('change', () => this.onSubmit(this.input.value));
    this.input.addEventListener('input', () => this.onChange(this.input.value));
    this.autoSuggest = document.getElementById('filter-suggest');
    this.reader = new FilterReader('');
    this.validKeys = [];
    this.valueSuggestions = {};
    this.lastSuggestKey = null;
    this.input.addEventListener('mouseup', () => this.autoSuggest.style.display = 'block');
    document.body.addEventListener('mousedown', () => this.autoSuggest.style.display = 'none');
  }

  validate(value) {
    this.reader.set(value);
    try {
      this.input.classList.remove('invalid');
      this.reader.parseFilter();
      return true;
    } catch (e) {
      this.input.classList.add('invalid');
    }
    return false;
  }

  fillSuggestions(value) {
    this.reader.set(value);
    let last = this.reader.getLastToken();
    let values = [];
    if (last.type === 'operator') {
      values = ['==', '!=', '<', '<=', '>', '>='];
      if (this.reader.data[this.reader.pos - 2] === ' ') {
        if (this.valueSuggestions[this.lastSuggestKey]) {
          values = this.valueSuggestions[this.lastSuggestKey];
        }
      }
    } else if (last.type === 'name') {
      values = this.validKeys;
      this.lastSuggestKey = last.value ?? '';
    } else if (last.type === 'separator') {
      values = ['&&'];
    } else if (last.type === 'value') {
      if (this.valueSuggestions[this.lastSuggestKey]) {
        values = this.valueSuggestions[this.lastSuggestKey];
      }
    }

    values = values.filter(v => v !== last.value);
    values.unshift(last.value);

    this.autoSuggest.innerHTML = '';
    for (let val of values) {
      let node = document.createElement('p');
      node.classList.add('suggest-item');
      node.textContent = val;
      this.autoSuggest.append(node);
    }
  }

  onChange(value) {
    this.fillSuggestions(value);
    this.validate(value);
  }

  onSubmit(value) {
    if (this.validate(value)) {
      this.reader.set(value);
      this.onFilter(this.reader.parseFilter());
    }
  }

  onFilter(filter) {}
}