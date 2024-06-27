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
        checkbox.set_attribute("type", "checkbox").expect("set_attribute");
        // checkbox.class_list().add("ui-checkbox");
        mount.append_child(&checkbox).expect("append_child");
    }
}
