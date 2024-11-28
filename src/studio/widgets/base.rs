use web_sys::Element;

pub trait Widget {
    fn create(elem: &Element) -> Self;
}
