use crate::studio::components::base::WidgetComponent;
use web_sys::Element;
use crate::utils::dom::create_element;

pub struct Checkbox {

}

impl Checkbox {
    pub fn new(parent: &Element) {
        let checkbox = create_element("checkbox");
        // checkbox.class_list().add("ui-checkbox");
        parent.append_child(&checkbox);
    }
}

impl WidgetComponent for Checkbox {

}
