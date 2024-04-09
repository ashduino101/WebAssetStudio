use crate::base::asset::Asset;
use crate::unity::assets::typetree::{ObjectError, ValueType};

pub trait ClassWrapper : Asset {
    fn get_name(&self) -> String;
}
