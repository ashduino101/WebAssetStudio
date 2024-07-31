extern crate num;

use std::fmt::{Debug};
use bytes::{Buf, Bytes};
use three_d::{CpuMesh, Matrix4, Mesh, Vector2, Vector3, Vector4};
use three_d_asset::{Geometry, Indices, Mat4, Node, PbrMaterial, Positions, Scene, Srgba};
use wasm_bindgen_test::console_log;
use web_sys::{Document, Element};
use crate::base::asset::{Asset, Export};
use crate::CpuGeometry;
use crate::unity::assets::typetree::{ObjectError, ValueType};
use crate::unity::assets::wrappers::base::ClassWrapper;
use crate::utils::fp16::fp16_ieee_to_fp32_value;


fn get_vertex_size(format: u8, is_before_2017: bool) -> u32 {
    if is_before_2017 {
        match format {
            0 | 4 => 4,
            1 => 2,
            3 => 1,
            _ => 0
        }
    } else {
        match format {
            0 | 11 | 12 => 4,
            1 | 5 | 6 | 9 | 10 => 2,
            2 | 3 | 4 | 7 | 8 => 1,
            _ => 0
        }
    }
}

#[derive(Debug)]
pub struct MeshWrapper {
    channels: Vec<ChannelInfo>,
    streams: Vec<StreamInfo>,
    vertex_data: Bytes,
    vertex_count: u32,
    index_format: i32,
    index_buffer: Vec<u8>,
    mesh: Option<Scene>,  // will be None until loaded
    major_version: i32,
    little_endian: bool,
}

impl Asset for MeshWrapper {
    fn make_html(&mut self, doc: &Document) -> Element {
        doc.create_element("div").expect("dummy")
    }

    fn export(&mut self) -> Export {
        let mesh = self.load_mesh(self.major_version, self.little_endian);
        Export {  // TODO: implement before release
            extension: "gltf".to_string(),
            data: vec![]
        }
    }
}

impl ClassWrapper for MeshWrapper {
}

impl MeshWrapper {
    pub fn from_value(value: &ValueType, major_version: i32, little_endian: bool) -> Result<Self, ObjectError> {
        Ok(MeshWrapper {
            channels: Self::get_channels(value)?,
            streams: Self::get_streams(value, major_version < 2017)?,
            vertex_data: value.get("m_VertexData")?.get("m_DataSize")?.as_bytes()?,
            vertex_count: value.get("m_VertexData")?.get("m_VertexCount")?.as_u32()?,
            index_format: value.get("m_IndexFormat")?.as_i32()?,
            index_buffer: value.get("m_IndexBuffer")?.get("Array")?.as_u8_array()?.clone(),
            mesh: None,
            major_version,
            little_endian
        })
    }

    fn get_channels(value: &ValueType) -> Result<Vec<ChannelInfo>, ObjectError> {
        let channels = value.get("m_VertexData")?.get("m_Channels")?.get("Array")?.as_array()?;
        Ok(channels.iter().map(|c| ChannelInfo {
            stream: c.get("stream").unwrap().as_u8().unwrap(),
            offset: c.get("offset").unwrap().as_u8().unwrap(),
            format: c.get("format").unwrap().as_u8().unwrap(),
            dimension: c.get("dimension").unwrap().as_u8().unwrap()
        }).collect())
    }

    fn get_streams(value: &ValueType, is_pre_2017: bool) -> Result<Vec<StreamInfo>, ObjectError> {
        let channels = value.get("m_VertexData")?.get("m_Channels")?.get("Array")?.as_array()?;

        let num_streams = channels.iter().map(|c| c.get("stream").unwrap().as_u8().unwrap()).max().unwrap() + 1;

        let mut streams = Vec::new();
        let mut offset = 0;
        for s in 0..num_streams {
            let mut chn_mask = 0;
            let mut stride = 0;
            for chn in 0..channels.len() {
                let channel = &channels[chn];
                let dim = channel.get("dimension")?.as_u8()?;
                if channel.get("stream")?.as_u8()? == s && dim > 0 {
                    chn_mask |= (1u32 << (chn as u32));
                    stride += dim as u32 * get_vertex_size(channel.get("format")?.as_u8()?, is_pre_2017);
                }
            }
            streams.push(StreamInfo {
                channel_mask: chn_mask,
                offset,
                stride,
                align: 0,
                divider_op: 0,
                frequency: 0
            });

            offset += value.get("m_VertexData")?.get("m_VertexCount")?.as_u32()? * stride;
            offset = (offset + 15) & !15;
        }

        Ok(streams)
    }

    pub fn load_mesh(&mut self, major_version: i32, little_endian: bool) -> &Scene {
        if let Some(ref m) = self.mesh {
            return m
        };

        let mut mesh = CpuMesh::default();

        // Load the index buffer
        let mut buf = Bytes::from(self.index_buffer.clone());
        match self.index_format {
            0 => {
                let mut indices = Vec::new();
                for _ in 0..(buf.len() / 2) {
                    indices.push(buf.get_u16_ordered(little_endian));
                }
                mesh.indices = Indices::U16(indices);
            },
            _ => {
                let mut indices = Vec::new();
                for _ in 0..(buf.len() / 4) {
                    indices.push(buf.get_u32_ordered(little_endian));
                }
                mesh.indices = Indices::U32(indices);
            }
        };

        for chn in 0..self.channels.len() {
            let channel = &self.channels[chn];
            if channel.dimension > 0 {
                let stream = &self.streams[channel.stream as usize];
                if (stream.channel_mask & (1 << (chn as u32))) != 0 {
                    let dimension = if major_version < 2018 && chn == 2 && channel.format == 2 {
                        4
                    } else {
                        channel.dimension
                    };

                    // TODO: this is a mess
                    //  Also, we convert everything to f64 -- this means a mesh with all channels
                    //  as f32 will take 2x the memory as the size it was stored as
                    let read_fn: fn(&mut Bytes, bool) -> f64 = if major_version < 2017 {
                        match channel.format {
                            0 => |d, l| d.get_f32_ordered(l) as f64,
                            1 => |d, l| fp16_ieee_to_fp32_value(d.get_u16_ordered(l)) as f64,
                            2 | 3 => |d, l| d.get_u8() as f64,
                            4 => |d, l| d.get_u32_ordered(l) as f64,
                            _ => |d, l| 0f64
                        }
                    } else if major_version < 2019 {
                        match channel.format {
                            0 => |d, l| d.get_f32_ordered(l) as f64,
                            1 => |d, l| fp16_ieee_to_fp32_value(d.get_u16_ordered(l)) as f64,
                            2 | 3 => |d, l| (d.get_u8() as f64) / 255.0,
                            4 => |d, l| (d.get_i8() as f64) / 255.0,
                            5 => |d, l| (d.get_u16_ordered(l) as f64) / 65535.0,
                            6 => |d, l| (d.get_i16_ordered(l) as f64) / 65535.0,
                            7 => |d, l| d.get_u8() as f64,
                            8 => |d, l| d.get_i8() as f64,
                            9 => |d, l| d.get_u16_ordered(l) as f64,
                            10 => |d, l| d.get_i16_ordered(l) as f64,
                            11 => |d, l| d.get_u32_ordered(l) as f64,
                            12 => |d, l| d.get_i32_ordered(l) as f64,
                            _ => |d, l| 0f64
                        }
                    } else {
                        match channel.format {
                            0 => |d, l| d.get_f32_ordered(l) as f64,
                            1 => |d, l| fp16_ieee_to_fp32_value(d.get_u16_ordered(l)) as f64,
                            2 => |d, l| (d.get_u8() as f64) / 255.0,
                            3 => |d, l| (d.get_i8() as f64) / 255.0,
                            4 => |d, l| (d.get_u16_ordered(l) as f64) / 65535.0,
                            5 => |d, l| (d.get_i16_ordered(l) as f64) / 65535.0,
                            6 => |d, l| d.get_u8() as f64,
                            7 => |d, l| d.get_i8() as f64,
                            8 => |d, l| d.get_u16_ordered(l) as f64,
                            9 => |d, l| d.get_i16_ordered(l) as f64,
                            10 => |d, l| d.get_u32_ordered(l) as f64,
                            11 => |d, l| d.get_i32_ordered(l) as f64,
                            _ => |d, l| 0f64
                        }
                    };

                    let mut values = Vec::new();
                    console_log!("begin {}", chn);
                    for i in 0..self.vertex_count {
                        let offset = (stream.offset + (channel.offset as u32) + stream.stride * i) as usize;
                        let mut data = self.vertex_data.slice(offset..);
                        let mut val = Vec::new();
                        for _ in 0..dimension {
                            val.push(read_fn(&mut data, little_endian));
                        }
                        values.push(val);
                    }
                    console_log!("end {}", chn);

                    if major_version > 2019 {
                        match chn {
                            0 => {
                                let pos = values.iter().map(|v| Vector3::new(v[0], v[1], v[2])).collect();
                                mesh.positions = Positions::F64(pos);
                            },
                            1 => {
                                let norm = values.iter().map(|v| Vector3::new(v[0] as f32, v[1] as f32, v[2] as f32)).collect();
                                mesh.normals = Some(norm);
                            }
                            2 => {
                                let tan = values.iter().map(|v| Vector4::new(v[0] as f32, v[1] as f32, v[2] as f32, v[3] as f32)).collect();
                                mesh.tangents = Some(tan);
                            },
                            3 => {
                                let col = values.iter().map(|v| Srgba::new(v[0] as u8, v[1] as u8, v[2] as u8, *v.get(3).unwrap_or(&255f64) as u8)).collect();
                                mesh.colors = Some(col);
                            },
                            4..=11 => {
                                let uv = values.iter().map(|v| Vector2::new(v[0] as f32, v[1] as f32)).collect();
                                mesh.uvs = Some(uv);
                            }
                            _ => {}
                        }
                    } else {
                        match chn {
                            0 => {
                                let pos = values.iter().map(|v| Vector3::new(v[0], v[1], v[2])).collect();
                                console_log!("apply position");
                                mesh.positions = Positions::F64(pos);
                            },
                            1 => {
                                let norm = values.iter().map(|v| Vector3::new(v[0] as f32, v[1] as f32, v[2] as f32)).collect();
                                console_log!("apply normals");
                                mesh.normals = Some(norm);
                            }
                            2 => {
                                let col = values.iter().map(|v| Srgba::new(v[0] as u8, v[1] as u8, v[2] as u8, *v.get(3).unwrap_or(&255f64) as u8)).collect();
                                console_log!("apply colors");
                                mesh.colors = Some(col);
                            },
                            3 | 4 | 6 => {
                                let uv = values.iter().map(|v| Vector2::new(v[0] as f32, v[1] as f32)).collect();
                                console_log!("apply uvs");
                                mesh.uvs = Some(uv);
                            },
                            7 => {
                                // let tan = values.iter().map(|v| Vector4::new(v[0] as f32, v[1] as f32, v[2] as f32, v[3] as f32)).collect();
                                // console_log!("apply tangents");
                                // mesh.tangents = Some(tan);
                            }
                            _ => {}
                        }
                    }
                }
            }
        }

        // FIXME: error handling
        mesh.transform(&Mat4::from(Matrix4::from_scale(10.0f32))).expect("unable to scale geometry");

        let material = PbrMaterial {
            ..Default::default()
        };
        let scene = Scene {
            name: "Scene".to_owned(),
            materials: vec![material],
            children: vec![
                Node {
                    geometry: Some(Geometry::Triangles(mesh)),
                    material_index: Some(0),
                    ..Default::default()
                }
            ]
        };

        self.mesh = Some(scene);
        self.mesh.as_ref().unwrap()
    }
}

#[derive(Debug)]
pub struct ChannelInfo {
    stream: u8,
    offset: u8,
    format: u8,
    dimension: u8
}

#[derive(Debug)]
pub struct StreamInfo {
    channel_mask: u32,
    offset: u32,
    stride: u32,
    align: u32,
    divider_op: u8,
    frequency: u16
}
