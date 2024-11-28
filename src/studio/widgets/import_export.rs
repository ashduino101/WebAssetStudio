use web_sys::Element;
use crate::studio::components::base::WidgetComponent;
use crate::studio::components::button::Button;
use crate::studio::widgets::base::Widget;

pub struct ImportExportWidget {

}

impl Widget for ImportExportWidget {
    fn create(elem: &Element) -> Self {
        let open_file_btn = Button::new("Open");
        open_file_btn.render(elem);
        let open_folder_btn = Button::new("Open folder");
        open_folder_btn.render(elem);
        let export_btn = Button::new("Export all");
        export_btn.render(elem);
        ImportExportWidget {

        }
    }
}
