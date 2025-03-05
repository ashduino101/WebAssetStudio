#![feature(async_iterator)]
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
pub mod crunch;
// mod crunch;

use std::convert::TryFrom;
use std::io::{Read, Write};
use std::panic;

use crate::base::asset::Asset;
use crate::crunch::CrunchLib;
use async_recursion::async_recursion;
use futures::future::FutureExt;
use std::panic::PanicInfo;
use three_d::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::console_log;
use web_sys::{File, HtmlInputElement};
// use mojoshader::*;

use crate::logger::{info, splash};
use crate::unity::assets::file::AssetFile;
use crate::unity::assets::typetree::TypeParser;
use crate::unity::assets::wrappers::audioclip::AudioClipWrapper;
use crate::unity::assets::wrappers::mesh::MeshWrapper;
use crate::unity::assets::wrappers::texture2d::Texture2DWrapper;
use crate::unity::bundle::file::BundleFile;
use crate::unity::version::UnityVersion;
use crate::utils::debug::{load_audio, render_mesh};
use crate::utils::dom::create_img;
use crate::utils::js::events::add_event_listener;
use crate::utils::js::file_reader::read_file;
use crate::utils::js::filesystem::{DirectoryEntry, DirectoryHandle, FileHandle};
use crate::utils::time::now;
use crate::xna::xnb::XNBFile;

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

#[async_recursion(?Send)]
async fn collect_all_files(entries: Vec<DirectoryEntry>, accum: &mut Vec<(String, FileHandle)>) {
    // println!("{} entries", entries.len());
    for entry in entries {
        match entry {
            DirectoryEntry::File(name, f) => {
                accum.push((name, f));
                // console_log!("file: {name}");
            }
            DirectoryEntry::Directory(name, d) => {
                // console_log!("dir: {name}");
                let entries = d.entries().await;
                collect_all_files(entries, accum).await;
            }
        }
    }
}

async fn open_file_dialog() {
    info!("open file");
    let elem = web_sys::window().unwrap()
        .document().unwrap()
        .get_element_by_id("open-file-input").unwrap()
        .dyn_into::<HtmlInputElement>().unwrap();
    elem.click();
}

async fn open_file() {
    let elem = web_sys::window().unwrap()
        .document().unwrap()
        .get_element_by_id("open-file-input").unwrap()
        .dyn_into::<HtmlInputElement>().unwrap();
    let files = elem.files().unwrap();
    for i in 0..files.length() {
        let file = files.get(i).unwrap();
        let name = file.name();
        handle_file(name, file).await;
    }
}

async fn open_folder() {
    info!("open folder");
    let mut picker = match DirectoryHandle::open_picker().await {
        Ok(p) => p,
        Err(_) => return,  // probably declined by user
    };
    let entries = picker.entries().await;
    let mut files = Vec::new();
    collect_all_files(entries, &mut files).await;
    // console_log!("{files:?}");
    for (name, handle) in files {
        let file = handle.get_file().await;
        handle_file(name, file).await;
    }
}

async fn handle_file(name: String, file: File) {
    let dat = read_file(file).await.unwrap();

    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let body = document.body().unwrap();

    let start = now();
    console_log!("start load at {start}");

    let f = BundleFile::new(dat);

    console_log!("start decompress");
    let mut file = f.get_file(&f.list_files()[0]).expect("nonexistent file");
    console_log!("end decompress: {} bytes", file.len());

    console_log!("start asset file parse at {}", now());
    let asset = AssetFile::new(&mut file);

    let mut i = 0;

    for object in &asset.objects {
        let typ = &asset.types[object.type_id as usize];
        let data = &mut asset.object_data.slice(object.offset..object.offset + object.size);
        // console_log!("{}", typ.string_repr);
        // console_log!("{} ({})", typ.nodes[0].type_name, typ.class_id);
        let parsed = TypeParser::parse_object_from_info(typ, data);
        let name = parsed.get("m_Name").ok().map_or("<unnamed>".to_owned(), |v| v.as_string().unwrap());
        console_log!("{:?} {}", name, typ.class_id);
        if typ.class_id == 28 {
            let w = Texture2DWrapper::from_value(&parsed, Some(&f)).expect("failed to wrap object");
            // console_log!("{:?}", w);

            for img in 0..w.num_images {
                let img_start = now();
                let elem = document.create_element("img").unwrap();
                elem.set_attribute("src", &create_img(w.get_image(img).as_ref(), w.width as usize, w.height as usize, true)).unwrap();
                body.append_child(&elem).unwrap();
                console_log!("decoding {}x{} of format {:?} took {}ms", w.width, w.height, w.format, now() - img_start);
            }
        }
        if typ.class_id == 83 {
            let mut w = AudioClipWrapper::from_value(&parsed, Some(&f)).expect("failed to wrap object");
            body.append_child(&w.make_html(&document)).unwrap();
        }
        if typ.class_id == 43 {
            if i == 0 {
                let mut w = MeshWrapper::from_value(&parsed, asset.unity_version.major, asset.little_endian).unwrap();
                console_log!("{:?}", w);
                let scene = w.load_mesh(asset.unity_version.major, asset.little_endian);
                render_mesh(scene.clone()).await;
            }

            i += 1;
        }
        // console_log!("{:?}", parsed);
    }

    // if !(name.ends_with(".xnb") || name.ends_with(".xnb.deploy")) {
    //     return;
    // }
    // let mut gz = GzDecoder::new(&buf[..]);
    // let mut buf = Vec::new();
    // match gz.read_to_end(&mut buf) {
    //     Ok(_) => {
    //         spawn_local(async move {
    //             let mut reader = XNBFile::new(&mut Bytes::from(buf));
    //             let window = web_sys::window().expect("no global `window` exists");
    //             let document = window.document().expect("should have a document on window");
    //             let body = document.body().expect("document should have a body");
    //             body.append_child(&reader.primary_asset.make_html(&document)).unwrap();
    //         });
    //         info!("name: {name}");
    //         // break;
    //     },
    //     Err(_) => {
    //         warn!("skipping on gz error");
    //         return;
    //     }
    // };
}


#[wasm_bindgen(start)]
async fn main() {
    // Fancy console splash text
    splash();

    // Register our custom panic hooks
    panic::set_hook(Box::new(|info: &PanicInfo| {
        console_error_panic_hook::hook(info);
        alert_hook::hook(info);
    }));

    #[cfg(not(target_arch = "wasm32"))]
    pretty_env_logger::init();

    CrunchLib::load().await;

    let win = web_sys::window().unwrap();
    // spawn_local(async move {
    //     let win = web_sys::window().unwrap();
    //     let doc = win.document().unwrap();
    //
    //     let crntest = include_bytes!("../testdata/crunch.dat");
    //
    //     let crnlib = get_crnlib().await;
    //     let res = crnlib.unpack_unity_crunch(crntest);
    //     let tex = decode(TextureFormat::DXT1, &mut Bytes::from(res), 2048, 2048, false);
    //     let elem = doc.create_element("img").expect("failed to create element");
    //     elem.set_attribute("src", &create_img(&tex[..], 2048, 2048, false)).unwrap();
    //     doc.body().unwrap().append_child(&elem).unwrap();
    // });



    let doc = win.document().unwrap();

    if DirectoryHandle::is_available() {
        let elem = doc.get_element_by_id("btn-open-folder").unwrap();
        elem.class_list().remove_1("disabled").unwrap();
        add_event_listener(&elem, "mouseup", open_folder).unwrap();

    }
    add_event_listener(&doc.get_element_by_id("btn-open-file").unwrap(), "mouseup", open_file_dialog).unwrap();
    add_event_listener(&doc.get_element_by_id("open-file-input").unwrap(), "change", open_file).unwrap();
    // let win = web_sys::window().unwrap();
    //
    // let ms = get_mojoshader();
    // let f = Closure::wrap(Box::new(move || {
    //     ms.parse(include_bytes!("../Pool.fx"), "glsl120");
    // }) as Box<dyn FnMut()>);
    // win.set_timeout_with_callback_and_timeout_and_arguments_0(f.as_ref().unchecked_ref(), 500).unwrap();
    return;

    // let mut dat = Bytes::from(Vec::from(include_bytes!("../tests/data/xnb/Background.xnb")));
    // let mut xnb = XNBFile::new(&mut dat);
    //
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

    // spawn_local(unity_test());

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
    let mut control = OrbitControl::new(camera.target(), 1.0, 100.0);

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
