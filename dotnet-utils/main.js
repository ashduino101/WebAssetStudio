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
    const text = exports.MyClass.Decompile(arr, f.name);
    document.getElementById('out').textContent = text;
  }
  reader.readAsArrayBuffer(f);
});

await dotnet.run();