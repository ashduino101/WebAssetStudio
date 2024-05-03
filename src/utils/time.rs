/// Wrapper around native JS functions for measuring time.
use wasm_bindgen::prelude::*;

pub fn now() -> u64 {
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");
    performance.now() as u64
}
