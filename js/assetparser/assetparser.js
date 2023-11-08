import * as wasm from "./assetparser_bg.wasm";
import { __wbg_set_wasm } from "./assetparser_bg.js";
__wbg_set_wasm(wasm);
export * from "./assetparser_bg.js";
