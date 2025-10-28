use three_d_asset::{degrees, GeometryFunction, LightingModel, Model as CpuModel, NormalDistributionFunction, Scene, Srgba, Viewport};
use three_d::{vec3, AmbientLight, Camera, ClearState, FlyControl, FrameOutput, Geometry, Model, PhysicalMaterial, Skybox, Window, WindowSettings};
use wasm_bindgen_test::console_log;
use web_sys::Element;

pub async fn render_mesh(scene: Scene, parent: &Element) {
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("no document available");

    let canvas = document.create_element("canvas").unwrap();
    // canvas.setId(rand::thread_rng().sample_iter(&Alphanumeric).take(10).collect());

    parent.append_child(&canvas).unwrap();

    let window = Window::new(WindowSettings {
        title: "Preview".to_string(),
        max_size: Some((512, 512)),
        #[cfg(target_os = "wasm32-unknown-unknown")]
        canvas: Some(canvas.dyn_into::<HtmlCanvasElement>().unwrap()),
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
        10.0,
    );
    let mut control = FlyControl::new(0.001);

    let mut loaded = if let Ok(loaded) = three_d_asset::io::load_async(&[
        "chinese_garden_4k.hdr",
    ])
        .await
    {
        loaded
    } else {
        console_log!("falling back to alternate URLs");
        three_d_asset::io::load_async(&[
            "https://asny.github.io/three-d/assets/chinese_garden_4k.hdr",
        ])
            .await
            .expect("failed to download the necessary assets, to enable running this example offline, place the relevant assets in a folder called 'assets' next to the three-d source")
    };

    let environment_map = loaded.deserialize("chinese").unwrap();
    let skybox = Skybox::new_from_equirectangular(&context, &environment_map);

    let mut cpu_model: CpuModel = scene.into();
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