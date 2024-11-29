use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Write};
use bytes::Bytes;
use js_sys::{Array, AsyncIterator as JsAsyncIterator, Function, Promise, Reflect};
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen::closure::Closure;
use wasm_bindgen_futures::JsFuture;
use wasm_bindgen_test::console_log;
use web_sys::{Blob, Event, File, FileReader, FileSystemDirectoryHandle, FileSystemFileHandle};
use crate::utils::js::file_reader::read_file;

#[derive(Debug)]
pub enum DirectoryEntry {
    File(String, FileHandle),
    Directory(String, DirectoryHandle)
}

#[derive(Debug)]
pub enum DirectoryPickerError {
    Unsupported,
    Declined
}

#[derive(Debug)]
pub struct FileHandle {
    inner: FileSystemFileHandle
}

impl FileHandle {
    pub async fn data(&self) -> Bytes {
        let file = File::from(JsFuture::from(self.inner.get_file()).await.unwrap());
        read_file(file).await.unwrap()
    }
}

impl Display for DirectoryPickerError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            DirectoryPickerError::Unsupported => "Directory picking is unsupported in your browser",
            DirectoryPickerError::Declined => "Declined by user"
        })
    }
}

impl Error for DirectoryPickerError {}

#[derive(Debug)]
pub struct DirectoryHandle {
    inner: FileSystemDirectoryHandle
}

impl DirectoryHandle {
    pub async fn open_picker() -> anyhow::Result<Self> {
        let window = web_sys::window().unwrap();
        // TODO: return error
        let result = match JsFuture::from(match window.show_directory_picker() {
            Ok(r) => r,
            Err(_) => return Err(DirectoryPickerError::Unsupported.into())
        }).await {
            Ok(r) => r,
            Err(_) => return Err(DirectoryPickerError::Declined.into())
        };
        Ok(DirectoryHandle {
            inner: FileSystemDirectoryHandle::from(result)
        })
    }

    pub fn iter(&self) -> JsAsyncIterator {
        self.inner.entries()
    }

    /// Collects the entries into a Vec
    pub async fn entries(&self) -> Vec<DirectoryEntry> {
        let mut iter = self.iter();
        let mut vec = Vec::new();
        while let Ok(n) = iter.next() {
            let val = JsFuture::from(n).await.unwrap();
            let done = Reflect::get(&val, &JsValue::from_str("done")).unwrap().as_bool().unwrap();
            if done {
                break;
            }
            let value = Reflect::get(&val, &JsValue::from_str("value")).unwrap();
            let arr = Array::from(&value);
            let key = arr.get(0).as_string().unwrap();
            let value = arr.get(1);
            if value.is_instance_of::<FileSystemDirectoryHandle>() {
                vec.push(DirectoryEntry::Directory(key, DirectoryHandle {
                    inner: FileSystemDirectoryHandle::from(value)
                }));
            } else if value.is_instance_of::<FileSystemFileHandle>() {
                vec.push(DirectoryEntry::File(key, FileHandle {
                    inner: FileSystemFileHandle::from(value)
                }));
            }
        }
        vec
    }
}
