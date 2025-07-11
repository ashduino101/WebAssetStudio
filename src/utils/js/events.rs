use std::cell::RefCell;
use std::future::Future;
use std::rc::Rc;
use std::sync::Arc;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::{Event, EventTarget};

pub fn add_event_listener<F>(elem: &EventTarget, event: &str, callback: impl Fn(Event) -> F + 'static)
                             -> Result<(), wasm_bindgen::JsValue>
where
    F: Future<Output=()> + 'static,
{
    let b = Arc::new(Box::new(callback));
    let cb = Closure::wrap(Box::new(move |e: Event| {
        let f = b.clone();
        spawn_local(async move {
            f(e).await;
        });
    }) as Box<dyn FnMut(_)>);
    let res = elem.add_event_listener_with_callback(event, &cb.as_ref().unchecked_ref());
    cb.forget();
    res
}

pub fn add_event_listener_with_data<'a, F, P: 'a + 'static>(elem: &EventTarget, event: &str, callback: impl Fn(Event, Arc<P>) -> F + 'static, data: Arc<P>)
                             -> Result<(), wasm_bindgen::JsValue>
where
    F: Future<Output=()> + 'static,
{
    let b = Arc::new(Box::new(callback));
    let cloned = data.clone();
    let cb = Closure::wrap(Box::new(move |e: Event| {
        let inner = cloned.clone();
        let f = b.clone();
        spawn_local(async move {
            f(e, inner.clone()).await;
        });
    }) as Box<dyn FnMut(_)>);
    let res = elem.add_event_listener_with_callback(event, &cb.as_ref().unchecked_ref());
    cb.forget();
    res
}
