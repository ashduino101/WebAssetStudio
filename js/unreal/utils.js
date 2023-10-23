import pako from 'pako';

export function decompress(data, method) {
  switch (method) {
    case 'Zlib':
    case 'GZip':
      return pako.inflate(data);
    case 'Oodle':
      console.error('Oodle not supported');
      return data;
    case 'None':
      return data;
    default:
      console.error(`Unknown/unsupported compression method ${method}!`);
  }
}
