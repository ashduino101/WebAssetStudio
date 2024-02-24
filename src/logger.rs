use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // TODO: write a macro to allow for variable arguments and %c
    #[wasm_bindgen(js_namespace = console)]
    fn log(a: &str, b: &str, c: &str, d: &str);
}

// macro_rules! console_log {
//     ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
// }

pub struct Logger {
    pub mod_name: String
}

static INFO_STYLE: &str = "color: #cccccc; background-color: #222222";
static WARN_STYLE: &str = "color: #2b2b2b; background-color: #f3da1b; font-weight: bold";
static ERROR_STYLE: &str = "color: #de0000; background-color: #000000; font-weight: bold";
static TEXT_STYLE: &str = "color: #000000; background-color: #ffffff";

impl Logger {
    pub fn get_logger(name: &str) -> Logger {
        Logger {
            mod_name: name.to_string()
        }
    }

    pub fn info(&self, msg: &str) {
        log("%cINFO%c: %s", INFO_STYLE, TEXT_STYLE, msg);
    }

    pub fn warn(&self, msg: &str) {
        log("%cWARN%c: %s", WARN_STYLE, TEXT_STYLE, msg);
    }

    pub fn error(&self, msg: &str) {
        log("%cERROR%c: %s", ERROR_STYLE, TEXT_STYLE, msg);
    }
}

pub fn splash() {
    log(
        "%cWeb%cAsset%cStudio",
        "color: #0000ff; font-size: 48px;",
        "color: #ff0000; font-size: 48px;",
        "color: #00ff00; font-size: 48px;"
    );
    log("%cversion %s | git %s", "color: #555555; font-size: 12px;", env!("CARGO_PKG_VERSION"), env!("GIT_HASH"));
    log("%cWant to contribute? Check out our repository at https://github.com/ashduino101/WebAssetStudio", "color: #666666; font-size: 8px;", " ", " ");
    log(" ", " ", " ", " ");
}
