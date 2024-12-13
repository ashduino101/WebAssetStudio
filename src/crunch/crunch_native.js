
var loadCrunch = (() => {
  var _scriptName = typeof document != 'undefined' ? document.currentScript?.src : undefined;
  if (typeof __filename != 'undefined') _scriptName = _scriptName || __filename;
  return (
function(moduleArg = {}) {
  var moduleRtn;

var c = moduleArg, aa, f, n = new Promise((a, b) => {
  aa = a;
  f = b;
});
"_malloc _free _UnpackCrunch _UnpackUnityCrunch _memory ___indirect_function_table onRuntimeInitialized".split(" ").forEach(a => {
  Object.getOwnPropertyDescriptor(n, a) || Object.defineProperty(n, a, {get:() => q("You are getting " + a + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"), set:() => q("You are setting " + a + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"),});
});
var ba = "object" == typeof window, u = "undefined" != typeof WorkerGlobalScope, w = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node && "renderer" != process.type, ca = !ba && !w && !u, da = Object.assign({}, c), x = "", A, B;
if (w) {
  if ("undefined" == typeof process || !process.release || "node" !== process.release.name) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
  var ea = process.versions.node, C = ea.split(".").slice(0, 3);
  C = 10000 * C[0] + 100 * C[1] + 1 * C[2].split("-")[0];
  if (160000 > C) {
    throw Error("This emscripten-generated code requires node v16.0.0 (detected v" + ea + ")");
  }
  var fs = require("fs"), fa = require("path");
  x = __dirname + "/";
  B = a => {
    a = D(a) ? new URL(a) : fa.normalize(a);
    a = fs.readFileSync(a);
    E(a.buffer);
    return a;
  };
  A = a => {
    a = D(a) ? new URL(a) : fa.normalize(a);
    return new Promise((b, e) => {
      fs.readFile(a, void 0, (d, g) => {
        d ? e(d) : b(g.buffer);
      });
    });
  };
  process.argv.slice(2);
} else if (ca) {
  if ("object" == typeof process && "function" === typeof require || "object" == typeof window || "undefined" != typeof WorkerGlobalScope) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
} else if (ba || u) {
  u ? x = self.location.href : "undefined" != typeof document && document.currentScript && (x = document.currentScript.src);
  _scriptName && (x = _scriptName);
  x.startsWith("blob:") ? x = "" : x = x.substr(0, x.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  if ("object" != typeof window && "undefined" == typeof WorkerGlobalScope) {
    throw Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
  u && (B = a => {
    var b = new XMLHttpRequest();
    b.open("GET", a, !1);
    b.responseType = "arraybuffer";
    b.send(null);
    return new Uint8Array(b.response);
  });
  A = a => D(a) ? new Promise((b, e) => {
    var d = new XMLHttpRequest();
    d.open("GET", a, !0);
    d.responseType = "arraybuffer";
    d.onload = () => {
      200 == d.status || 0 == d.status && d.response ? b(d.response) : e(d.status);
    };
    d.onerror = e;
    d.send(null);
  }) : fetch(a, {credentials:"same-origin"}).then(b => b.ok ? b.arrayBuffer() : Promise.reject(Error(b.status + " : " + b.url)));
} else {
  throw Error("environment detection error");
}
var ha = c.print || console.log.bind(console), F = c.printErr || console.error.bind(console);
Object.assign(c, da);
da = null;
Object.getOwnPropertyDescriptor(c, "fetchSettings") && q("`Module.fetchSettings` was supplied but `fetchSettings` not included in INCOMING_MODULE_JS_API");
G("arguments", "arguments_");
G("thisProgram", "thisProgram");
E("undefined" == typeof c.memoryInitializerPrefixURL, "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
E("undefined" == typeof c.pthreadMainPrefixURL, "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
E("undefined" == typeof c.cdInitializerPrefixURL, "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
E("undefined" == typeof c.filePackagePrefixURL, "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
E("undefined" == typeof c.read, "Module.read option was removed");
E("undefined" == typeof c.readAsync, "Module.readAsync option was removed (modify readAsync in JS)");
E("undefined" == typeof c.readBinary, "Module.readBinary option was removed (modify readBinary in JS)");
E("undefined" == typeof c.setWindowTitle, "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
E("undefined" == typeof c.TOTAL_MEMORY, "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
G("asm", "wasmExports");
G("readAsync", "readAsync");
G("readBinary", "readBinary");
G("setWindowTitle", "setWindowTitle");
E(!ca, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");
var H = c.wasmBinary;
G("wasmBinary", "wasmBinary");
"object" != typeof WebAssembly && F("no native wasm support detected");
var I, J = !1;
function E(a, b) {
  a || q("Assertion failed" + (b ? ": " + b : ""));
}
var ia, K, L;
function ja() {
  var a = I.buffer;
  c.HEAP8 = ia = new Int8Array(a);
  c.HEAP16 = new Int16Array(a);
  c.HEAPU8 = K = new Uint8Array(a);
  c.HEAPU16 = new Uint16Array(a);
  c.HEAP32 = new Int32Array(a);
  c.HEAPU32 = L = new Uint32Array(a);
  c.HEAPF32 = new Float32Array(a);
  c.HEAPF64 = new Float64Array(a);
}
E(!c.STACK_SIZE, "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
E("undefined" != typeof Int32Array && "undefined" !== typeof Float64Array && void 0 != Int32Array.prototype.subarray && void 0 != Int32Array.prototype.set, "JS engine does not provide full typed array support");
E(!c.wasmMemory, "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");
E(!c.INITIAL_MEMORY, "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");
function ka() {
  var a = M();
  E(0 == (a & 3));
  0 == a && (a += 4);
  L[a >> 2] = 34821223;
  L[a + 4 >> 2] = 2310721022;
  L[0] = 1668509029;
}
function N() {
  if (!J) {
    var a = M();
    0 == a && (a += 4);
    var b = L[a >> 2], e = L[a + 4 >> 2];
    34821223 == b && 2310721022 == e || q(`Stack overflow! Stack cookie has been overwritten at ${O(a)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${O(e)} ${O(b)}`);
    1668509029 != L[0] && q("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}
var la = [], ma = [], na = [], P = !1;
function oa() {
  var a = c.preRun.shift();
  la.unshift(a);
}
E(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
E(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
E(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
E(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
var Q = 0, R = null, S = null, U = {};
function pa() {
  Q++;
  c.monitorRunDependencies?.(Q);
  E(!U["wasm-instantiate"]);
  U["wasm-instantiate"] = 1;
  null === R && "undefined" != typeof setInterval && (R = setInterval(() => {
    if (J) {
      clearInterval(R), R = null;
    } else {
      var a = !1, b;
      for (b in U) {
        a || (a = !0, F("still waiting on run dependencies:")), F(`dependency: ${b}`);
      }
      a && F("(end of list)");
    }
  }, 10000));
}
function q(a) {
  c.onAbort?.(a);
  a = "Aborted(" + a + ")";
  F(a);
  J = !0;
  a = new WebAssembly.RuntimeError(a);
  f(a);
  throw a;
}
function qa() {
  q("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
}
c.FS_createDataFile = function() {
  qa();
};
c.FS_createPreloadedFile = function() {
  qa();
};
var ra = a => a.startsWith("data:application/octet-stream;base64,"), D = a => a.startsWith("file://");
function V(a, b) {
  return (...e) => {
    E(P, `native function \`${a}\` called before runtime initialization`);
    var d = W[a];
    E(d, `exported native function \`${a}\` not found`);
    E(e.length <= b, `native function \`${a}\` called with ${e.length} args but expects ${b}`);
    return d(...e);
  };
}
var X;
function sa(a) {
  if (a == X && H) {
    return new Uint8Array(H);
  }
  if (B) {
    return B(a);
  }
  throw "both async and sync fetching of the wasm failed";
}
function ta(a) {
  return H ? Promise.resolve().then(() => sa(a)) : A(a).then(b => new Uint8Array(b), () => sa(a));
}
function ua(a, b, e) {
  return ta(a).then(d => WebAssembly.instantiate(d, b)).then(e, d => {
    F(`failed to asynchronously prepare wasm: ${d}`);
    D(X) && F(`warning: Loading from a file URI (${X}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    q(d);
  });
}
function va(a, b) {
  var e = X;
  return H || "function" != typeof WebAssembly.instantiateStreaming || ra(e) || D(e) || w || "function" != typeof fetch ? ua(e, a, b) : fetch(e, {credentials:"same-origin"}).then(d => WebAssembly.instantiateStreaming(d, a).then(b, function(g) {
    F(`wasm streaming compile failed: ${g}`);
    F("falling back to ArrayBuffer instantiation");
    return ua(e, a, b);
  }));
}
var wa = new Int16Array(1), xa = new Int8Array(wa.buffer);
wa[0] = 25459;
if (115 !== xa[0] || 99 !== xa[1]) {
  throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
}
if (c.ENVIRONMENT) {
  throw Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}
function G(a, b) {
  Object.getOwnPropertyDescriptor(c, a) || Object.defineProperty(c, a, {configurable:!0, get() {
    q(`\`Module.${a}\` has been replaced by \`${b}\`` + " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }});
}
function ya(a) {
  Object.getOwnPropertyDescriptor(c, a) || Object.defineProperty(c, a, {configurable:!0, get() {
    var b = `'${a}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
    "FS_createPath" !== a && "FS_createDataFile" !== a && "FS_createPreloadedFile" !== a && "FS_unlink" !== a && "addRunDependency" !== a && "FS_createLazyFile" !== a && "FS_createDevice" !== a && "removeRunDependency" !== a || (b += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you");
    q(b);
  }});
}
var za = a => {
  for (; 0 < a.length;) {
    a.shift()(c);
  }
}, O = a => {
  E("number" === typeof a);
  return "0x" + (a >>> 0).toString(16).padStart(8, "0");
}, Y = a => {
  Y.g || (Y.g = {});
  Y.g[a] || (Y.g[a] = 1, w && (a = "warning: " + a), F(a));
}, Aa = "undefined" != typeof TextDecoder ? new TextDecoder() : void 0, Ba = (a, b = 0) => {
  for (var e = b + NaN, d = b; a[d] && !(d >= e);) {
    ++d;
  }
  if (16 < d - b && a.buffer && Aa) {
    return Aa.decode(a.subarray(b, d));
  }
  for (e = ""; b < d;) {
    var g = a[b++];
    if (g & 128) {
      var p = a[b++] & 63;
      if (192 == (g & 224)) {
        e += String.fromCharCode((g & 31) << 6 | p);
      } else {
        var v = a[b++] & 63;
        224 == (g & 240) ? g = (g & 15) << 12 | p << 6 | v : (240 != (g & 248) && Y("Invalid UTF-8 leading byte " + O(g) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!"), g = (g & 7) << 18 | p << 12 | v << 6 | a[b++] & 63);
        65536 > g ? e += String.fromCharCode(g) : (g -= 65536, e += String.fromCharCode(55296 | g >> 10, 56320 | g & 1023));
      }
    } else {
      e += String.fromCharCode(g);
    }
  }
  return e;
}, Ca = [null, [], []], Da = a => {
  var b = c["_" + a];
  E(b, "Cannot call unknown function " + a + ", make sure it is exported");
  return b;
}, Ha = (a, b, e, d) => {
  var g = {string:h => {
    var l = 0;
    if (null !== h && void 0 !== h && 0 !== h) {
      for (var k = l = 0; k < h.length; ++k) {
        var r = h.charCodeAt(k);
        127 >= r ? l++ : 2047 >= r ? l += 2 : 55296 <= r && 57343 >= r ? (l += 4, ++k) : l += 3;
      }
      var y = l + 1;
      l = Ea(y);
      E("number" == typeof y, "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
      k = l;
      r = K;
      E("string" === typeof h, `stringToUTF8Array expects a string (got ${typeof h})`);
      if (0 < y) {
        y = k + y - 1;
        for (var T = 0; T < h.length; ++T) {
          var m = h.charCodeAt(T);
          if (55296 <= m && 57343 >= m) {
            var La = h.charCodeAt(++T);
            m = 65536 + ((m & 1023) << 10) | La & 1023;
          }
          if (127 >= m) {
            if (k >= y) {
              break;
            }
            r[k++] = m;
          } else {
            if (2047 >= m) {
              if (k + 1 >= y) {
                break;
              }
              r[k++] = 192 | m >> 6;
            } else {
              if (65535 >= m) {
                if (k + 2 >= y) {
                  break;
                }
                r[k++] = 224 | m >> 12;
              } else {
                if (k + 3 >= y) {
                  break;
                }
                1114111 < m && Y("Invalid Unicode code point " + O(m) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
                r[k++] = 240 | m >> 18;
                r[k++] = 128 | m >> 12 & 63;
              }
              r[k++] = 128 | m >> 6 & 63;
            }
            r[k++] = 128 | m & 63;
          }
        }
        r[k] = 0;
      }
    }
    return l;
  }, array:h => {
    var l = Ea(h.length);
    E(0 <= h.length, "writeArrayToMemory array must have a length (should be an array or typed array)");
    ia.set(h, l);
    return l;
  }};
  a = Da(a);
  var p = [], v = 0;
  E("array" !== b, 'Return type should not be "array".');
  if (d) {
    for (var t = 0; t < d.length; t++) {
      var z = g[e[t]];
      z ? (0 === v && (v = Fa()), p[t] = z(d[t])) : p[t] = d[t];
    }
  }
  e = a(...p);
  return e = function(h) {
    0 !== v && Ga(v);
    "string" === b ? (E("number" == typeof h, `UTF8ToString expects a number (got ${typeof h})`), h = h ? Ba(K, h) : "") : h = "boolean" === b ? !!h : h;
    return h;
  }(e);
}, Ia = {_abort_js:() => q("native code called abort()"), _emscripten_memcpy_js:(a, b, e) => K.copyWithin(a, b, b + e), emscripten_resize_heap:a => {
  var b = K.length;
  a >>>= 0;
  E(a > b);
  if (2147483648 < a) {
    return F(`Cannot enlarge memory, requested ${a} bytes, but the limit is ${2147483648} bytes!`), !1;
  }
  for (var e = 1; 4 >= e; e *= 2) {
    var d = b * (1 + 0.2 / e);
    d = Math.min(d, a + 100663296);
    var g = Math, p = g.min;
    d = Math.max(a, d);
    E(65536, "alignment argument is required");
    g = p.call(g, 2147483648, 65536 * Math.ceil(d / 65536));
    a: {
      p = g;
      d = I.buffer;
      var v = (p - d.byteLength + 65535) / 65536 | 0;
      try {
        I.grow(v);
        ja();
        var t = 1;
        break a;
      } catch (z) {
        F(`growMemory: Attempted to grow heap from ${d.byteLength} bytes to ${p} bytes, but got error: ${z}`);
      }
      t = void 0;
    }
    if (t) {
      return !0;
    }
  }
  F(`Failed to grow the heap from ${b} bytes to ${g} bytes, not enough memory!`);
  return !1;
}, fd_close:() => {
  q("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
}, fd_seek:function(a, b, e) {
  E(b == b >>> 0 || b == (b | 0));
  E(e === (e | 0));
  return 70;
}, fd_write:(a, b, e, d) => {
  for (var g = 0, p = 0; p < e; p++) {
    var v = L[b >> 2], t = L[b + 4 >> 2];
    b += 8;
    for (var z = 0; z < t; z++) {
      var h = a, l = K[v + z], k = Ca[h];
      E(k);
      0 === l || 10 === l ? ((1 === h ? ha : F)(Ba(k)), k.length = 0) : k.push(l);
    }
    g += t;
  }
  L[d >> 2] = g;
  return 0;
}}, W = function() {
  function a(d) {
    W = d.exports;
    I = W.memory;
    E(I, "memory not found in wasm exports");
    ja();
    ma.unshift(W.__wasm_call_ctors);
    Q--;
    c.monitorRunDependencies?.(Q);
    E(U["wasm-instantiate"]);
    delete U["wasm-instantiate"];
    0 == Q && (null !== R && (clearInterval(R), R = null), S && (d = S, S = null, d()));
    return W;
  }
  pa();
  var b = c, e = {env:Ia, wasi_snapshot_preview1:Ia,};
  if (c.instantiateWasm) {
    try {
      return c.instantiateWasm(e, a);
    } catch (d) {
      F(`Module.instantiateWasm callback failed with error: ${d}`), f(d);
    }
  }
  X ??= ra("crunch_native.wasm") ? "crunch_native.wasm" : c.locateFile ? c.locateFile("crunch_native.wasm", x) : x + "crunch_native.wasm";
  va(e, function(d) {
    E(c === b, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    b = null;
    a(d.instance);
  }).catch(f);
  return {};
}();
c._malloc = V("malloc", 1);
c._free = V("free", 1);
c._UnpackCrunch = V("UnpackCrunch", 4);
c._UnpackUnityCrunch = V("UnpackUnityCrunch", 4);
var Ja = () => (Ja = W.emscripten_stack_init)(), M = () => (M = W.emscripten_stack_get_end)(), Ga = a => (Ga = W._emscripten_stack_restore)(a), Ea = a => (Ea = W._emscripten_stack_alloc)(a), Fa = () => (Fa = W.emscripten_stack_get_current)();
c.dynCall_jiji = V("dynCall_jiji", 5);
c.ccall = Ha;
c.cwrap = (a, b, e, d) => (...g) => Ha(a, b, e, g, d);
"writeI53ToI64 writeI53ToI64Clamped writeI53ToI64Signaling writeI53ToU64Clamped writeI53ToU64Signaling readI53FromI64 readI53FromU64 convertI32PairToI53 convertU32PairToI53 getTempRet0 setTempRet0 zeroMemory exitJS strError inetPton4 inetNtop4 inetPton6 inetNtop6 readSockaddr writeSockaddr emscriptenLog readEmAsmArgs jstoi_q getExecutableName listenOnce autoResumeAudioContext dynCallLegacy getDynCaller dynCall handleException keepRuntimeAlive runtimeKeepalivePush runtimeKeepalivePop callUserCallback maybeExit asmjsMangle asyncLoad mmapAlloc HandleAllocator getNativeTypeSize STACK_SIZE STACK_ALIGN POINTER_SIZE ASSERTIONS uleb128Encode sigToWasmTypes generateFuncType convertJsFunctionToWasm getEmptyTableSlot updateTableMap getFunctionAddress addFunction removeFunction reallyNegative unSign strLen reSign formatString intArrayFromString intArrayToString AsciiToString stringToAscii UTF16ToString stringToUTF16 lengthBytesUTF16 UTF32ToString stringToUTF32 lengthBytesUTF32 stringToNewUTF8 registerKeyEventCallback maybeCStringToJsString findEventTarget getBoundingClientRect fillMouseEventData registerMouseEventCallback registerWheelEventCallback registerUiEventCallback registerFocusEventCallback fillDeviceOrientationEventData registerDeviceOrientationEventCallback fillDeviceMotionEventData registerDeviceMotionEventCallback screenOrientation fillOrientationChangeEventData registerOrientationChangeEventCallback fillFullscreenChangeEventData registerFullscreenChangeEventCallback JSEvents_requestFullscreen JSEvents_resizeCanvasForFullscreen registerRestoreOldStyle hideEverythingExceptGivenElement restoreHiddenElements setLetterbox softFullscreenResizeWebGLRenderTarget doRequestFullscreen fillPointerlockChangeEventData registerPointerlockChangeEventCallback registerPointerlockErrorEventCallback requestPointerLock fillVisibilityChangeEventData registerVisibilityChangeEventCallback registerTouchEventCallback fillGamepadEventData registerGamepadEventCallback registerBeforeUnloadEventCallback fillBatteryEventData battery registerBatteryEventCallback setCanvasElementSize getCanvasElementSize jsStackTrace getCallstack convertPCtoSourceLocation getEnvStrings checkWasiClock wasiRightsToMuslOFlags wasiOFlagsToMuslOFlags initRandomFill randomFill safeSetTimeout setImmediateWrapped safeRequestAnimationFrame clearImmediateWrapped polyfillSetImmediate registerPostMainLoop registerPreMainLoop getPromise makePromise idsToPromises makePromiseCallback ExceptionInfo findMatchingCatch Browser_asyncPrepareDataCounter isLeapYear ydayFromDate arraySum addDays getSocketFromFD getSocketAddress FS_createPreloadedFile FS_modeStringToFlags FS_getMode FS_stdin_getChar FS_unlink FS_createDataFile FS_mkdirTree _setNetworkCallback heapObjectForWebGLType toTypedArrayIndex webgl_enable_ANGLE_instanced_arrays webgl_enable_OES_vertex_array_object webgl_enable_WEBGL_draw_buffers webgl_enable_WEBGL_multi_draw webgl_enable_EXT_polygon_offset_clamp webgl_enable_EXT_clip_control webgl_enable_WEBGL_polygon_mode emscriptenWebGLGet computeUnpackAlignedImageSize colorChannelsInGlTextureFormat emscriptenWebGLGetTexPixelData emscriptenWebGLGetUniform webglGetUniformLocation webglPrepareUniformLocationsBeforeFirstUse webglGetLeftBracePos emscriptenWebGLGetVertexAttrib __glGetActiveAttribOrUniform writeGLArray registerWebGlEventCallback runAndAbortIfError ALLOC_NORMAL ALLOC_STACK allocate writeStringToMemory writeAsciiToMemory setErrNo demangle stackTrace".split(" ").forEach(function(a) {
  ya(a);
});
"run addOnPreRun addOnInit addOnPreMain addOnExit addOnPostRun addRunDependency removeRunDependency out err callMain abort wasmMemory wasmExports writeStackCookie checkStackCookie convertI32PairToI53Checked stackSave stackRestore stackAlloc ptrToString getHeapMax growMemory ENV ERRNO_CODES DNS Protocols Sockets timers warnOnce readEmAsmArgsArray jstoi_s alignMemory wasmTable noExitRuntime getCFunc freeTableIndexes functionsInTableMap setValue getValue PATH PATH_FS UTF8Decoder UTF8ArrayToString UTF8ToString stringToUTF8Array stringToUTF8 lengthBytesUTF8 UTF16Decoder stringToUTF8OnStack writeArrayToMemory JSEvents specialHTMLTargets findCanvasEventTarget currentFullscreenStrategy restoreOldWindowedStyle UNWIND_CACHE ExitStatus flush_NO_FILESYSTEM promiseMap uncaughtExceptionCount exceptionLast exceptionCaught Browser getPreloadedImageData__data wget MONTH_DAYS_REGULAR MONTH_DAYS_LEAP MONTH_DAYS_REGULAR_CUMULATIVE MONTH_DAYS_LEAP_CUMULATIVE SYSCALLS preloadPlugins FS_stdin_getChar_buffer FS_createPath FS_createDevice FS_readFile FS FS_createLazyFile MEMFS TTY PIPEFS SOCKFS tempFixedLengthArray miniTempWebGLFloatBuffers miniTempWebGLIntBuffers GL AL GLUT EGL GLEW IDBStore SDL SDL_gfx allocateUTF8 allocateUTF8OnStack print printErr".split(" ").forEach(ya);
var Z;
S = function Ka() {
  Z || Ma();
  Z || (S = Ka);
};
function Ma() {
  function a() {
    if (!Z && (Z = !0, c.calledRun = !0, !J)) {
      E(!P);
      P = !0;
      N();
      za(ma);
      aa(c);
      c.onRuntimeInitialized?.();
      E(!c._main, 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
      N();
      if (c.postRun) {
        for ("function" == typeof c.postRun && (c.postRun = [c.postRun]); c.postRun.length;) {
          var b = c.postRun.shift();
          na.unshift(b);
        }
      }
      za(na);
    }
  }
  if (!(0 < Q)) {
    Ja();
    ka();
    if (c.preRun) {
      for ("function" == typeof c.preRun && (c.preRun = [c.preRun]); c.preRun.length;) {
        oa();
      }
    }
    za(la);
    0 < Q || (c.setStatus ? (c.setStatus("Running..."), setTimeout(() => {
      setTimeout(() => c.setStatus(""), 1);
      a();
    }, 1)) : a(), N());
  }
}
if (c.preInit) {
  for ("function" == typeof c.preInit && (c.preInit = [c.preInit]); 0 < c.preInit.length;) {
    c.preInit.pop()();
  }
}
Ma();
moduleRtn = n;
for (const a of Object.keys(c)) {
  a in moduleArg || Object.defineProperty(moduleArg, a, {configurable:!0, get() {
    q(`Access to module property ('${a}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`);
  }});
}
;


  return moduleRtn;
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = loadCrunch;
else if (typeof define === 'function' && define['amd'])
  define([], () => loadCrunch);
