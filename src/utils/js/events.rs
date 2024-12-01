use std::future::Future;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::{Event, EventTarget};

pub fn add_event_listener<F>(elem: &EventTarget, event: &str, callback: fn() -> F)
                             -> Result<(), wasm_bindgen::JsValue>
where
    F: Future<Output=()> + 'static,
{
    let cb = Closure::wrap(Box::new(move |_: Event| {
        spawn_local(async move {
            callback().await;
        });
    }) as Box<dyn FnMut(_)>);
    let res = elem.add_event_listener_with_callback(event, &cb.as_ref().unchecked_ref());
    cb.forget();
    res
}