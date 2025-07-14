use wasm_bindgen::JsCast;
use web_sys::{window, Element, HtmlImageElement};
use crate::studio::components::base::WidgetComponent;

pub(crate) struct ImageView {
    urls: Vec<String>
}

impl ImageView {
    pub(crate) fn from_url_list(urls: &Vec<String>) -> ImageView {
        ImageView {
            urls: urls.clone()
        }
    }
}

impl WidgetComponent for ImageView {
    fn render(&self, mount: &Element) {
        let elem = window().unwrap().document().unwrap().create_element("img").unwrap();
        let elem = elem.unchecked_into::<HtmlImageElement>();
        // TODO: multiple images
        elem.set_attribute("src", &self.urls[0]).unwrap();
        let mut style = elem.style();
        style.set_property("max-width", "100%").unwrap();
        style.set_property("max-height", "100%").unwrap();
        style.set_property("background", "repeating-conic-gradient(#ddd 0% 25%, #0000004d 0% 50%) 50% / 20px 20px").unwrap();
        style.set_property("position", "relative").unwrap();
        style.set_property("top", "50%").unwrap();
        style.set_property("left", "50%").unwrap();
        style.set_property("transform", "translate(-50%, -50%)").unwrap();
        style.set_property("display", "block").unwrap();
        mount.append_child(&elem).unwrap();
    }
}
