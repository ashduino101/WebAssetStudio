
use wasm_bindgen_test::*;
use encoders::*;

#[wasm_bindgen_test]
fn test_swap() {
    let mut test_data = [0u8, 1, 2, 3, 4, 5, 6, 7];
    texdec::swap_bytes_xbox(&mut test_data);
    assert_eq!(test_data, [1u8, 0, 3, 2, 5, 4, 7, 6]);
}

#[wasm_bindgen_test]
fn test_bgr2rgb() {
    let mut test_data = [128u8, 0, 64, 255, 64, 0, 128,  255, 32, 0, 32, 255];
    texdec::bgr2rgb(&mut test_data);
    assert_eq!(test_data, [64u8, 0, 128, 255, 128, 0, 64, 255, 32, 0, 32, 255]);
}
