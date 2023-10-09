import { dotnet } from './dotnet/dotnet.js'


export class CSharpDecompiler {
  constructor() {
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    const { getAssemblyExports, getConfig } = await dotnet
      .withDiagnosticTracing(false)
      .withApplicationArgumentsFromQuery()
      .create();
    this.config = getConfig();
    this.exports = await getAssemblyExports(this.config.mainAssemblyName);
    await dotnet.run();
  }

  async decompile(data, name, typeName = null) {
    await this.load();
    return this.exports.MyClass.Decompile(data, name, typeName);
  }
}
