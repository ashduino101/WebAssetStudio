import * as wasm from "./encoders_bg.wasm";
import { __wbg_set_wasm } from "./encoders_bg.js";
__wbg_set_wasm(wasm);
export * from "./encoders_bg.js";
