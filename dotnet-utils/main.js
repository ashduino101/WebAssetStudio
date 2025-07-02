console.log('Loading decompiler, please wait...');
let bundleData = new xzwasm.XzReadableStream((await fetch("./decompiler.bin.xz")).body);
let rdr = bundleData.getReader();
let buf = new Uint8Array();
while (true) {
  let { value, done } = await rdr.read();
  if (done) break;
  let newBuf = new Uint8Array(buf.length + value.length);
  newBuf.set(buf, 0);
  newBuf.set(value, buf.length);
  buf = newBuf;
}
bundleData = buf;
console.log('Starting up...');
const { config, dotnet } = await (
    new (async function () {}.constructor)(
        'data',
        new TextDecoder('utf-8')
        .decode(bundleData.slice(
            new DataView(bundleData.buffer)
                .getUint32(0, true),  // init script offset
            bundleData.length
        ))
    )(bundleData)
);

const { getAssemblyExports, runMain } = await dotnet
.withDiagnosticTracing(false)
.withConfig(config)
.withApplicationArgumentsFromQuery()
.create();

const exports = window.exports = await getAssemblyExports(config.mainAssemblyName);

const input = document.getElementById('file-input');
input.addEventListener('change', e => {
  let f = e.target.files[0];
  let reader = new FileReader();
  reader.onloadend = async b => {
    let arr = new Uint8Array(reader.result);
    const decompiler = window.decompiler = exports.Decompiler.New(f.name, arr);
    let modules = JSON.parse(exports.Decompiler.ListNamespaces(decompiler));
    console.log(modules);
    // let types = JSON.parse(exports.Decompiler.GetTopLevelTypes(decompiler, modules[0].assemblyName));
    // console.log(types);
    console.log('done');

    let types = new Set();
    for (const module of modules) {
      for (const type of module.types) {
        if (types.has(type)) continue;
        console.log(exports.Decompiler.DecompileTypeAsString(decompiler, type));
        types.add(type);
      }
    }
    // document.getElementById('out').textContent = text;
  }
  reader.readAsArrayBuffer(f);
});

await runMain();
