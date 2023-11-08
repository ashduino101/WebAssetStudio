/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @returns {XNB}
*/
export function parse_xnb(data: Uint8Array): XNB;
/**
*/
export class TypeReader {
  free(): void;
/**
* @param {string} typename
* @param {number} version
* @returns {TypeReader}
*/
  static new(typename: string, version: number): TypeReader;
/**
*/
  readonly typename: string;
/**
*/
  version: number;
}
/**
*/
export class XNB {
  free(): void;
/**
*/
  is_compressed: boolean;
/**
*/
  is_hi_def: boolean;
/**
*/
  readonly platform: string;
/**
*/
  size: number;
/**
*/
  readonly type_readers: (TypeReader)[];
/**
*/
  uncompressed_size: number;
/**
*/
  version: number;
}
