import 'jstree';
import '../css/vendor/jstree/style.min.css';
import FileHandler from "./fileHandler";
import {isDebug} from "./config";

function configureDebug() {
  if (isDebug) {
    document.getElementById('download-raw').style.display = 'inline-block';
  }
}

async function onFile(f) {
  const h = new FileHandler('#tree');
  const res = await h.loadFile(f);
  if (!res) return;
  const tree = await h.getTree();
  document.getElementById('export-zip').onclick = () => tree.exportZip();
}

// MAIN
function main() {
  const input = document.getElementById('file-input');
  input.addEventListener('change', async e => onFile(e.target.files[0]));
  const fileOverlay = document.getElementById('file-overlay');
  // document.body.addEventListener('dragover', () => fileOverlay.style.display = 'block');
  // document.body.addEventListener('dragleave', () => fileOverlay.style.display = 'none');
  document.body.addEventListener('drop', e => {
    e.preventDefault();
    console.log(e.dataTransfer);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFile(files[0]);
    }
    fileOverlay.style.display = 'none'
  }, true);

  configureDebug();
}

main();
