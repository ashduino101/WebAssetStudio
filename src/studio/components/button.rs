use web_sys::Element;
use crate::studio::components::base::WidgetComponent;
use crate::utils::dom::create_element;

pub struct Button {
    text: String,
}

impl Button {
    pub fn new(text: &str) -> Button {
        Button {
            text: text.to_owned()
        }
    }
}

impl WidgetComponent for Button {
    fn render(&self, mount: &Element) {
        let button = create_element("input");
        button.class_list().add_1("ui-button").unwrap();
        button.set_text_content(Some(self.text.as_str()));
        mount.append_child(&button).expect("append_child");
    }
}
