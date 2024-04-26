// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './dotnet.js'

const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);

const input = document.getElementById('file-input');
input.addEventListener('change', e => {
  let f = e.target.files[0];
  let reader = new FileReader();
  reader.onloadend = async b => {
    let arr = new Uint8Array(reader.result);
    exports.Decompiler.Load(arr, f.name);
    let modules = exports.Decompiler.ListTypes(f.name);
    console.log(modules);
    console.log('done');
    // document.getElementById('out').textContent = text;
  }
  reader.readAsArrayBuffer(f);
});

await dotnet.run();