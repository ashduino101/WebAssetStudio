use web_sys::{window, Element};
use crate::studio::components::base::WidgetComponent;

pub(crate) struct AudioView {
    url: String
}

impl AudioView {
    pub(crate) fn from_url(url: &str) -> AudioView {
        AudioView {
            url: url.to_owned()
        }
    }
}

impl WidgetComponent for AudioView {
    fn render(&self, mount: &Element) {
        let elem = window().unwrap().document().unwrap().create_element("audio").unwrap();
        elem.set_attribute("controls", "true").unwrap();
        elem.set_attribute("src", &self.url).unwrap();
        mount.append_child(&elem).unwrap();
    }
}
