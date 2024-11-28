use crate::studio::components::base::WidgetComponent;
use web_sys::Element;
use crate::utils::dom::create_element;

pub struct Checkbox {

}

impl Checkbox {
    pub fn new() -> Checkbox {
        Checkbox {}
    }
}

impl WidgetComponent for Checkbox {
    fn render(&self, mount: &Element) {
        let checkbox = create_element("input");
        checkbox.set_attribute("type", "checkbox").unwrap();
        checkbox.class_list().add_1("ui-checkbox").unwrap();
        mount.append_child(&checkbox).expect("append_child");
    }
}
