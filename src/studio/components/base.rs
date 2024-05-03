use web_sys::Element;

pub trait WidgetComponent {
    fn render(&self, mount: &Element);
}