extern crate core;
#[macro_use]
extern crate num_derive;

pub mod unity;
pub mod utils;
pub mod xna;
mod logger;
pub mod base;
mod alert_hook;
pub mod fsb;
pub mod gamemaker;
pub mod binary;
pub mod studio;
pub mod directx;
pub mod errors;

use std::{panic};
use std::io::{Cursor, Write};

use std::panic::PanicInfo;
use std::ffi::CStr;
use bytes::{Bytes, BytesMut, Buf};
use three_d::*;
use lzma_rs;
use lzma_rs::decompress::Options;
use tar::Archive;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use wasm_bindgen_test::console_log;
// use mojoshader::*;
use js_sys::{Function, Reflect, Object};
use crate::directx::effect::FXEffect;
use crate::gamemaker::file::GameMakerFile;

use crate::logger::splash;
use crate::studio::components::checkbox::Checkbox;
use crate::studio::dock::widget::WidgetContainer;
use crate::unity::assets::file::AssetFile;
use crate::unity::assets::typetree::TypeParser;
use crate::unity::assets::wrappers::audioclip::AudioClipWrapper;
use crate::unity::assets::wrappers::mesh::MeshWrapper;
use crate::unity::assets::wrappers::texture2d::Texture2DWrapper;
use crate::unity::bundle::file::BundleFile;
use crate::unity::version::UnityVersion;
use crate::utils::debug::{load_audio, render_mesh};
use crate::utils::dom::{create_data_url, create_img};
use crate::utils::time::now;

async fn unity_test() {
    // console_log!("constructing");
    // let mut ctx = EffectShaderContext::new("hlsl");
    // console_log!("compiling");
    // let res = ctx.compile(include_bytes!("../test.fx"));
    // console_log!("done");
    // console_log!("{:?}", res);
    // return;
    let mut dat = Bytes::from(Vec::from(include_bytes!("../test.unity3d")));
    let mut f = BundleFile::new(&mut dat);

    console_log!("start decompress");
    let mut file = f.get_file(&f.list_files()[0]).expect("nonexistent file");
    console_log!("end decompress: {} bytes", file.len());

    console_log!("start asset file parse");
    let asset = AssetFile::new(&mut file);

    let mut i = 0;

    for object in &asset.objects {
        let typ = &asset.types[object.type_id as usize];
        let data = &mut asset.object_data.slice(object.offset..object.offset + object.size);
        // console_log!("{}", typ.string_repr);
        // console_log!("{} ({})", typ.nodes[0].type_name, typ.class_id);
        let parsed = TypeParser::parse_object_from_info(typ, data);
        let name = parsed.get("m_Name").ok().map_or("<untitled>".to_owned(), |v| v.as_string().unwrap());
        console_log!("{:?}", name);
        if typ.class_id == 28 {
            //     // console_log!("{:?}", parsed);
            let w = Texture2DWrapper::from_value(&parsed, Some(&f)).expect("failed to wrap object");
            //     // console_log!("{:?}", w);

            let window = web_sys::window().expect("no global `window` exists");
            let document = window.document().expect("should have a document on window");
            let body = document.body().expect("document should have a body");

            let elem = document.create_element("img").expect("failed to create element");
            elem.set_attribute("src", &create_img(w.get_image(w.num_images - 1).as_ref(), w.width as usize, w.height as usize, true)).expect("set_attribute");
            body.append_child(&elem).expect("append_child");
        }
        if typ.class_id == 83 {
            let w = AudioClipWrapper::from_value(&parsed, &f).expect("failed to wrap object");
            console_log!("{:?}", w.bank);
        }
        if typ.class_id == 43 {
            let mut w = MeshWrapper::from_value(&parsed, asset.unity_version.major, asset.little_endian).unwrap();
            console_log!("{:?}", w);
            let scene = w.load_mesh(asset.unity_version.major, asset.little_endian);
            // if i == 5 {
            //     render_mesh(scene).await;
            // }

            i += 1;
            // break;
            // console_log!("{}", create_data_url(&w.vertex_data[..]));
            // console_log!("{:?}", parsed.get("m_VertexData").unwrap().get("m_DataSize").unwrap().as_bytes().unwrap().len());
        }
        // console_log!("{:?}", parsed);
    }

    console_log!("{:?}", asset);
    console_log!("{:?}", f);

    console_log!("done");
}


// async fn dectest() {
//     let start = now();
//     let lzma_data = include_bytes!("../AppBundle.tar.lzma");
//     let mut offset = 0;
//     let mut stream = lzma_rs::decompress::Stream::new_with_options(&Options {
//         unpacked_size: Default::default(),
//         memlimit: None,
//         allow_incomplete: true
//     }, Vec::new());
//     while offset < lzma_data.len() {
//         stream.write_all(&lzma_data[offset..(offset+4096).min(lzma_data.len())]).expect("failed to write to decoder");
//         offset += 4096;
//         console_log!("{}", (offset as f64) / (lzma_data.len() as f64));
//     }
//     let mut res = stream.finish().expect("failed to finish");
//     let mut ar = Archive::new(Cursor::new(&mut res));
//     for entry in ar.entries().expect("no entries") {
//         console_log!("{}", entry.expect("no entry").path().expect("path").to_str().expect("no string"));
//     }
//     let end = now();
//     console_log!("decompress took {}ms", end - start);
// }


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

    // spawn_local(async move {
    //     let mut dat = Bytes::from(Vec::from(include_bytes!("../data.win")));
    //     let mut f = GameMakerFile::new(&mut dat);
    // });

    // for audio in f.samples {
    //     load_audio(audio);
    // }

    // let mut widget = WidgetContainer::new();
    // widget.add_component(Box::new(Checkbox::new()));
    // widget.render(&body);

    // spawn_local(dectest());

    // console_log!("{:?}", FXShader::from_bytes(&mut Bytes::from_static(include_bytes!("../lighting.fxc"))));

    // return;

    spawn_local(unity_test());

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
    let normal_map_enabled = true;
    let occlusion_map_enabled = true;
    let metallic_roughness_enabled = true;
    let albedo_map_enabled = true;
    let emissive_map_enabled = true;
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
