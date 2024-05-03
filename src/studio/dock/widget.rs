use web_sys::Element;
use crate::studio::widgets::base::Widget;
use crate::studio::components::base::WidgetComponent;
use crate::utils::dom::create_element;

pub struct WidgetContainer {
    children: Vec<Box<dyn WidgetComponent>>
}

impl WidgetContainer {
    pub fn new() -> WidgetContainer {
        WidgetContainer {
            children: Vec::new()
        }
    }

    pub fn add_component(&mut self, component: Box<dyn WidgetComponent>) {
        self.children.push(component);
    }

    pub fn render(&self, mount: &Element) {
        let mut container = create_element("div");
        for child in &self.children {
            child.render(&container);
        }
        mount.append_child(&container);
    }
}
