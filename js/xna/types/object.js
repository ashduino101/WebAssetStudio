import {BaseType} from "./baseType";

export class XNBObject extends BaseType {
  constructor(reader, typeReaders) {
    super(reader);
    this.value = typeReaders[reader.readVarInt() - 1]?.read(reader) ?? null;
  }
}