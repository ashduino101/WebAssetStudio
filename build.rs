use std::fs;
use std::process::Command;

fn main() {
    let output = Command::new("git").args(&["rev-parse", "HEAD"]).output();
    let mut git_hash = "???".to_string();
    match output {
        Err(_) => println!("WARNING: Git must be installed to include revision information in the release!"),
        Ok(res) => git_hash = String::from_utf8(res.stdout).unwrap()
    }
    println!("cargo:rustc-env=GIT_HASH={}", git_hash);

    // Copy FFI environment to target directory
    // FIXME: this only works when the output path is `pkg`
    let ffi_env = include_bytes!("src/ffi_env.js");
    fs::write("./pkg/env.js", ffi_env).expect("failed to write FFI environment");
}