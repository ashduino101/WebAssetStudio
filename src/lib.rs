extern crate core;
#[macro_use]
extern crate num_derive;

mod unity;
mod utils;
mod xna;
mod logger;
mod base;
mod alert_hook;
mod fsb;
mod gamemaker;
mod binary;
mod studio;

use std::{panic, thread};
use std::mem::size_of_val;
use std::panic::PanicInfo;
use bytes::{Buf, Bytes};
use three_d::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;
use crate::fsb::bank::SoundBank;
use crate::gamemaker::file::GameMakerFile;

use crate::logger::splash;
use crate::studio::components::checkbox::Checkbox;
use crate::studio::dock::widget::WidgetContainer;
use crate::unity::assets::file::AssetFile;
use crate::unity::bundle::file::BundleFile;
use crate::utils::debug::load_audio;
use crate::utils::dom::{create_element, create_img};
use crate::utils::tex::qoi::decode_qoi_gm;
use crate::xna::xnb::XNBFile;

#[wasm_bindgen(start)]
async fn main() {
    // Fancy console splash text
    splash();

    // Register our custom panic hooks
    panic::set_hook(Box::new(|info: &PanicInfo| {
        console_error_panic_hook::hook(info);
        alert_hook::hook(info);
    }));

    // let mut dat = Bytes::from(Vec::from(include_bytes!("../tests/data/xnb/Background.xnb")));
    // let mut xnb = XNBFile::new(&mut dat);
    //
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");
    //
    // let elem = xnb.primary_asset.make_html(&document);
    // body.append_child(&elem);
    //
    // console_log!("{:?}", xnb);

    // let mut d = Bytes::from_static(include_bytes!("../test.fsb"));

    // let mut i = 0;
    // while d.remaining() > 0 {
    //     console_log!("{:?}", SoundBank::new(&mut d));
    //     i += 1;
    //     if i > 10 {break}
    // }

    // decode_qoi_gm(&mut Bytes::from_static(include_bytes!("../qoif2"))).expect("error");

    // let mut dat = Bytes::from(Vec::from(include_bytes!("../data.win")));
    // let mut f = GameMakerFile::new(&mut dat);
    // for audio in f.samples {
    //     load_audio(audio);
    // }

    let mut widget = WidgetContainer::new();
    widget.add_component(Box::new(Checkbox::new()));
    widget.render(&body);

    return;

    let mut dat = Bytes::from(Vec::from(include_bytes!("../uno.unity3d")));
    let mut f = BundleFile::new(&mut dat);

    console_log!("start decompress");
    let mut file = f.get_file(&f.list_files()[0]).expect("nonexistent file");
    console_log!("end decompress: {} bytes", file.len());

    console_log!("start asset file parse");
    let asset = AssetFile::new(&mut file);
    // console_log!("{:?}", asset);
    console_log!("done");
    // console_log!("{:?}", f.get_file(&f.list_files()[0]));
    // run().await;
}

pub async fn run() {
    let window = Window::new(WindowSettings {
        title: "PBR!".to_string(),
        max_size: Some((1280, 720)),
        ..Default::default()
    })
        .unwrap();
    let context = window.gl();

    let mut camera = Camera::new_perspective(
        window.viewport(),
        vec3(-3.0, 1.0, 2.5),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        degrees(45.0),
        0.1,
        1000.0,
    );
    let mut control = OrbitControl::new(*camera.target(), 1.0, 100.0);

    let mut loaded = if let Ok(loaded) = three_d_asset::io::load_async(&[
        "cobblestone_street_night_4k.hdr", // Source: https://polyhaven.com/
        "DamagedHelmet.glb", // Source: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0
    ])
        .await
    {
        loaded
    } else {
        console_log!("falling back to alternate URLs");
        three_d_asset::io::load_async(&[
            "https://asny.github.io/three-d/assets/chinese_garden_4k.hdr",
            "DamagedHelmet.glb",
        ])
            .await
            .expect("failed to download the necessary assets, to enable running this example offline, place the relevant assets in a folder called 'assets' next to the three-d source")
    };

    let environment_map = loaded.deserialize("cobblestone").unwrap();
    let skybox = Skybox::new_from_equirectangular(&context, &environment_map);

    let mut cpu_model: CpuModel = loaded.deserialize("DamagedHelmet").unwrap();
    cpu_model
        .geometries
        .iter_mut()
        .for_each(|m| m.compute_tangents());
    let model = Model::<PhysicalMaterial>::new(&context, &cpu_model)
        .unwrap()
        .remove(0);

    let light = AmbientLight::new_with_environment(&context, 1.0, Srgba::WHITE, skybox.texture());

    // main loop
    let mut normal_map_enabled = true;
    let mut occlusion_map_enabled = true;
    let mut metallic_roughness_enabled = true;
    let mut albedo_map_enabled = true;
    let mut emissive_map_enabled = true;
    window.render_loop(move |mut frame_input| {
        let viewport = Viewport {
            x: 0,
            y: 0,
            width: frame_input.viewport.width,
            height: frame_input.viewport.height,
        };
        camera.set_viewport(viewport);
        control.handle_events(&mut camera, &mut frame_input.events);

        frame_input
            .screen()
            .clear(ClearState::color_and_depth(0.5, 0.5, 0.5, 1.0, 1.0))
            .render(&camera, &skybox, &[])
            .write(|| -> Result<(), std::io::Error> {
                let material = PhysicalMaterial {
                    name: model.material.name.clone(),
                    albedo: model.material.albedo,
                    albedo_texture: if albedo_map_enabled {
                        model.material.albedo_texture.clone()
                    } else {
                        None
                    },
                    metallic: model.material.metallic,
                    roughness: model.material.roughness,
                    metallic_roughness_texture: if metallic_roughness_enabled {
                        model.material.metallic_roughness_texture.clone()
                    } else {
                        None
                    },
                    normal_scale: model.material.normal_scale,
                    normal_texture: if normal_map_enabled {
                        model.material.normal_texture.clone()
                    } else {
                        None
                    },
                    occlusion_strength: model.material.occlusion_strength,
                    occlusion_texture: if occlusion_map_enabled {
                        model.material.occlusion_texture.clone()
                    } else {
                        None
                    },
                    emissive: if emissive_map_enabled {
                        model.material.emissive
                    } else {
                        Srgba::BLACK
                    },
                    emissive_texture: if emissive_map_enabled {
                        model.material.emissive_texture.clone()
                    } else {
                        None
                    },
                    render_states: model.material.render_states,
                    is_transparent: model.material.is_transparent,
                    lighting_model: LightingModel::Cook(
                        NormalDistributionFunction::TrowbridgeReitzGGX,
                        GeometryFunction::SmithSchlickGGX,
                    ),
                };
                model.render_with_material(&material, &camera, &[&light]);
                Ok(())
            })
            .unwrap();

        FrameOutput::default()
    });
}
