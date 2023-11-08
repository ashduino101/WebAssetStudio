import 'jstree';
import '../css/vendor/jstree/style.min.css';
import FileHandler from "./fileHandler";
import {parse_xnb} from "./assetparser";

// MAIN
function main() {
  const input = document.getElementById('file-input');
  input.addEventListener('change', async e => {
    let f = e.target.files[0];
    const h = new FileHandler('#tree');
    await h.loadFile(f);
    const tree = await h.getTree();
    document.getElementById('export-zip').onclick = () => tree.exportZip();
  });
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

