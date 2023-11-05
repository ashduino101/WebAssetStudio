import 'jstree';
import '../css/vendor/jstree/style.min.css';
import FileHandler from "./fileHandler";

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

main();
