export function compareFilter(op, a, b) {
  switch (op) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
  }
  return false;
}

export function arraysEqual(a, b) {
  return (a.length === b.length) && a.every(function(element, index) {
    return element === b[index];
  });
}

export function saveBlob(filename, data, type) {
  const file = new Blob(data, {type: type});
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}
