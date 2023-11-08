import 'jstree';
import '../css/vendor/jstree/style.min.css';
import FileHandler from "./fileHandler";

async function onFile(f) {
  const h = new FileHandler('#tree');
  await h.loadFile(f);
  const tree = await h.getTree();
  document.getElementById('export-zip').onclick = () => tree.exportZip();
}

// MAIN
function main() {
  const input = document.getElementById('file-input');
  input.addEventListener('change', async e => onFile(e.target.files[0]));
  const fileOverlay = document.getElementById('file-overlay');
  document.body.addEventListener('dragover', () => fileOverlay.style.display = 'block');
  document.body.addEventListener('dragleave', () => fileOverlay.style.display = 'none');
  document.body.addEventListener('drop', e => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFile(files[0]);
    }
    fileOverlay.style.display = 'none'
  }, true);
}

// function test() {
//   const input = document.getElementById('file-input');
//   input.addEventListener('change', e => {
//     let f = e.target.files[0];
//     let reader = new FileReader();
//     reader.onloadend = async b => {
//       let arr = new Uint8Array(reader.result);
//       const obj = parse_xnb(arr);
//       console.log(obj);
//     }
//     reader.readAsArrayBuffer(f);
//   });
// }

main();
// test()

