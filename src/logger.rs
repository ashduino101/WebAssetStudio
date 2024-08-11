use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // TODO: write a macro to allow for variable arguments and %c
    #[wasm_bindgen(js_namespace = console, js_name="log")]
    fn log1(a: &str);
    #[wasm_bindgen(js_namespace = console, js_name="log")]
    fn log2(a: &str, b: &str);
    #[wasm_bindgen(js_namespace = console, js_name="log")]
    fn log3(a: &str, b: &str, c: &str);
    #[wasm_bindgen(js_namespace = console, js_name="log")]
    fn log4(a: &str, b: &str, c: &str, d: &str);
    #[wasm_bindgen(js_namespace = console, js_name="log")]
    pub fn log5(a: &str, b: &str, c: &str, d: &str, e: &str);

    #[wasm_bindgen(js_namespace = console, js_name="log")]
    pub fn log1obj(a: &JsValue);
}

// TODO: garbage

macro_rules! console_log {
    ($($args: tt)*) => (log1(&format_args!($($args)*).to_string()))
}

pub(crate) fn module_style(name: &str) -> String {
    let crc = crc32fast::hash(name.as_bytes());
    format!("color: rgb({}, {}, {}); font-weight: bold", (crc >> 16) & 0xff, (crc >> 8) & 0xff, crc & 0xff)
}

macro_rules! debug {
    ($($args: tt)*) => (crate::logger::log5(&format!("%cDEBUG%c  [%c{}%c] {}", file!(),
    format_args!($($args)*)), crate::logger::DEBUG_STYLE, crate::logger::TEXT_STYLE,
    &crate::logger::module_style(file!()), crate::logger::TEXT_STYLE))
}

macro_rules! info {
    ($($args: tt)*) => (crate::logger::log5(&format!("%cINFO%c  [%c{}%c] {}", file!(),
    format_args!($($args)*)), crate::logger::INFO_STYLE, crate::logger::TEXT_STYLE,
    &crate::logger::module_style(file!()), crate::logger::TEXT_STYLE))
}

macro_rules! warning {
    ($($args: tt)*) => (crate::logger::log5(&format!("%cWARN%c  [%c{}%c] {}", file!(),
    format_args!($($args)*)), crate::logger::WARN_STYLE, crate::logger::TEXT_STYLE,
    &crate::logger::module_style(file!()), crate::logger::TEXT_STYLE))
}

macro_rules! error {
    ($($args: tt)*) => (crate::logger::log5(&format!("%cERROR%c [%c{}%c] {}", file!(),
    format_args!($($args)*)), crate::logger::ERROR_STYLE, crate::logger::TEXT_STYLE,
    &crate::logger::module_style(file!()), crate::logger::TEXT_STYLE))
}

pub(crate) use debug;
pub(crate) use info;
pub(crate) use warning;
pub(crate) use error;

pub struct Logger {
    pub mod_name: String
}

pub(crate) static DEBUG_STYLE: &str = "color: #5588ff; background-color: #222222";
pub(crate) static INFO_STYLE: &str = "color: #cccccc; background-color: #222222";
pub(crate) static WARN_STYLE: &str = "color: #2b2b2b; background-color: #f3da1b; font-weight: bold";
pub(crate) static ERROR_STYLE: &str = "color: #de0000; background-color: #000000; font-weight: bold";
pub(crate) static TEXT_STYLE: &str = "color: #444444; background-color: unset";

pub fn splash() {
    log4(
        "%cWeb%cAsset%cStudio",
        "color: #0000ff; font-size: 48px;",
        "color: #ff0000; font-size: 48px;",
        "color: #00ff00; font-size: 48px;"
    );
    log4("%cversion %s | git %s", "color: #555555; font-size: 12px;", env!("CARGO_PKG_VERSION"), env!("GIT_HASH"));
    log2("%cWant to contribute? Check out our repository at https://github.com/ashduino101/WebAssetStudio", "color: #666666; font-size: 8px;");
    log1(" ");
}
