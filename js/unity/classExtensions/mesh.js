import {Extension} from "../extension";
import {requestExternalData} from "../utils";
import {BinaryReader} from "../../binaryReader";
import {Matrix4x4} from "../basicTypes";
import {Vector3} from "three";
import * as THREE from "three";
import $ from "jquery";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter";
import {OrbitControls} from "three/addons/controls/OrbitControls";

function getVertexSize(format, version) {
  if (version[0] < 2017) {
    switch (format) {
      case 0:
      case 4:
        return 4;
      case 1:
        return 2;
      case 3:
        return 1;
    }
  } else {
    switch (format) {
      case 0:
      case 11:
      case 12:
        return 4;
      case 1:
      case 5:
      case 6:
      case 9:
      case 10:
        return 2;
      case 2:
      case 3:
      case 4:
      case 7:
      case 8:
        return 1;
    }
  }
}

function getVertexFormatReader(reader, format) {
  if (reader.version[0] < 2017) {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUInt8;  // color (single channel)
      case 3: return reader.readUInt8;
      case 4: return reader.readUInt32;
    }
  } else if (reader.version[0] < 2019) {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUNorm8;  // color (single channel)
      case 3: return reader.readUNorm8;
      case 4: return reader.readNorm8
      case 5: return reader.readUNorm16;
      case 6: return reader.readNorm16;
      case 7: return reader.readUInt8
      case 8: return reader.readInt8;
      case 9: return reader.readUInt16;
      case 10: return reader.readInt16;
      case 11: return reader.readUInt32;
      case 12: return reader.readInt32;
    }
  } else {
    switch (format) {
      case 0: return reader.readFloat32;
      case 1: return reader.readFloat16;
      case 2: return reader.readUNorm8;
      case 3: return reader.readNorm8
      case 4: return reader.readUNorm16;
      case 5: return reader.readNorm16;
      case 6: return reader.readUInt8
      case 7: return reader.readInt8;
      case 8: return reader.readUInt16;
      case 9: return reader.readInt16;
      case 10: return reader.readUInt32;
      case 11: return reader.readInt32;
    }
  }
}

export const GfxPrimitiveType = {
  0: 'Triangles',
  1: 'TrianglesStrip',
  2: 'Quads',
  3: 'Lines',
  4: 'LineStrip',
  5: 'Points'
}

export class MeshExtension extends Extension {
  exportExtension = '.gltf';

  constructor(mesh, version) {
    super(mesh);
    this.version = version;
    this.process().then()
  }

  async process() {
    if (this.object.m_StreamData && this.object.m_StreamData.path !== '') {
      if (this.object.m_VertexData.m_VertexCount > 0) {
        this.object.m_VertexData.m_DataSize = await requestExternalData(this.object.m_StreamData);
      }
    }
    this.getStreams();
    this.processVertexData();
    this.decompressMesh();
    this.getTriangles();
  }

  getStreams() {
    let streamCount = Math.max(...this.object.m_VertexData.m_Channels.map(x => x.data.stream)) + 1;
    this.object.m_VertexData.m_Streams = [];
    let offset = 0;
    for (let s = 0; s < streamCount; s++) {
      let chnMask = 0;
      let stride = 0;
      for (let chn = 0; chn < this.object.m_VertexData.m_Channels.length; chn++) {
        let channel = this.object.m_VertexData.m_Channels[chn].data;
        if (channel.stream === s) {
          if (channel.dimension > 0) {
            chnMask |= 1 << chn;
            stride += channel.dimension * getVertexSize(channel.format, this.version);
          }
        }
      }
      let si = {};
      si.channelMask = chnMask;
      si.offset = offset;
      si.stride = stride;
      si.dividerOp = 0;
      si.frequency = 0;
      this.object.m_VertexData.m_Streams.push(si);

      offset += this.object.m_VertexData.m_VertexCount * stride;
      offset = (offset + 15) & ~15;
    }
  }

  processVertexData() {
    for (let chn = 0; chn < this.object.m_VertexData.m_Channels.length; chn++) {
      let channel = this.object.m_VertexData.m_Channels[chn].data;
      if (channel.dimension > 0) {
        let stream = this.object.m_VertexData.m_Streams[channel.stream];
        if ((stream.channelMask & (1 << chn)) !== 0) {
          if (this.version[0] < 2018 && chn === 2 && channel.format === 2) {
            channel.dimension = 4;
          }

          let reader = new BinaryReader(this.object.m_VertexData.m_DataSize, 'little');
          reader.version = this.version;
          let valueReader = getVertexFormatReader(reader, channel.format).bind(reader);
          let componentSize = getVertexSize(channel.format, this.version);

          let value = [];
          for (let i = 0; i < this.object.m_VertexData.m_VertexCount; i++) {
            let vertexOffset = stream.offset + channel.offset + stream.stride * i;
            let v = [];
            for (let d = 0; d < channel.dimension; d++) {
              reader.seek(vertexOffset + componentSize * d);
              v.push(valueReader());
            }
            value.push(v);
          }

          if (this.version[0] >= 2018) {
            switch (chn) {
              case 0:
                this.vertices = value;
                break;
              case 1:
                this.normals = value;
                break;
              case 2:
                this.tangents = value;
                break;
              case 3:
                this.colors = value;
                break;
              case 4:
                this.uv0 = value;
                break;
              case 5:
                this.uv1 = value;
                break;
              case 6:
                this.uv2 = value;
                break;
              case 7:
                this.uv3 = value;
                break;
              case 8:
                this.uv4 = value;
                break;
              case 9:
                this.uv5 = value;
                break;
              case 10:
                this.uv6 = value;
                break;
              case 11:
                this.uv7 = value;
                break;
              case 12:  // blend weights
                if (this.object.m_Skin == null) {
                  this.initMSkin();
                }
                for (let i = 0; i < this.object.m_VertexData.m_VertexCount; i++) {
                  for (let j = 0; j < channel.dimension; j++) {
                    this.object.m_Skin[i].data[`weight[${j}]`] = value[i * channel.dimension + j];
                  }
                }
                break;
              case 13:
                if (this.object.m_Skin == null) {
                  this.initMSkin();
                }
                for (let i = 0; i < this.object.m_VertexData.m_VertexCount; i++) {
                  for (let j = 0; j < channel.dimension; j++) {
                    this.object.m_Skin[i].data[`boneIndex[${j}]`] = value[i * channel.dimension + j];
                  }
                }
                break;
            }
          } else {
            switch (chn) {
              case 0:
                this.vertices = value;
                break;
              case 1:
                this.normals = value;
                break;
              case 2:
                this.colors = value;
                break;
              case 3:
                this.uv0 = value;
                break;
              case 4:
                this.uv1 = value;
                break;
              case 5:
                if (this.version[0] >= 5) {
                  this.uv2 = value;
                } else {
                  this.tangents = value;
                }
                break;
              case 6:
                this.uv3 = value;
                break;
              case 7:
                this.tangents = value;
                break;
            }
          }
        }
      }
    }
  }

  decompressMesh() {
    if (this.object.m_CompressedMesh.vertices.length > 0) {
      this.vertexCount = this.object.m_CompressedMesh.vertices.length / 3;
      this.vertices = this.object.m_CompressedMesh.vertices.unpack(3, 3 * 4);
    }
    if (this.object.m_CompressedMesh.uv.length > 0) {
      let uvInfo = this.object.m_CompressedMesh.uvInfo;
      if (uvInfo !== 0) {
        const infoBitsPerUV = 4;
        const uvDimensionMask = 3;
        const uvChannelExists = 4;
        const maxTexCoordShaderChannels = 8;

        let uvSrcOffset = 0;
        for (let uv = 0; uv < maxTexCoordShaderChannels; uv++) {
          let texCoordBits = uvInfo >> (uv * infoBitsPerUV);
          texCoordBits &= (1 << infoBitsPerUV) - 1;
          if ((texCoordBits & uvChannelExists) !== 0) {
            let uvDim = 1 + (texCoordBits & uvDimensionMask);
            this[`uv${uv}`] = this.object.m_CompressedMesh.uv.unpack(uvDim, uvDim * 4, uvSrcOffset, this.object.m_VertexCount);
            uvSrcOffset += uvDim * this.object.m_VertexCount;
          }
        }
      } else {
        this.uv0 = this.object.m_CompressedMesh.uv.unpack(2, 2 * 4, 0, this.object.m_VertexCount);
        if (this.object.m_CompressedMesh.uv.length >= this.object.m_VertexCount * 4) {
          this.uv1 = this.object.m_CompressedMesh.uv.unpack(2, 2 * 4, this.object.m_VertexCount * 2, this.object.m_VertexCount);
        }
      }
    }
    if (this.object.m_CompressedMesh.normals.length > 0) {
      let normalData = this.object.m_CompressedMesh.normals.unpack(2, 4 * 2);
      let signs = this.object.m_CompressedMesh.normalSigns.unpack();
      this.normals = [];
      for (let i = 0; i < this.object.m_CompressedMesh.normals.length / 2; i++) {
        let x = normalData[i * 2];
        let y = normalData[i * 2 + 1];
        let zsqr = 1 - x * x - y * y;
        let z;
        if (zsqr >= 0) {
          z = Math.sqrt(zsqr);
        } else {
          z = 0;
          let normal = new Vector3(x, y, z);
          normal.normalize();
          x = normal.x;
          y = normal.y;
          z = normal.z;
        }
        if (signs[i] === 0) {
          z = -z;
        }
        this.normals[i * 3] = x;
        this.normals[i * 3 + 1] = y;
        this.normals[i * 3 + 2] = z;
      }
    }
    if (this.object.m_CompressedMesh.tangents.length > 0) {
      let tangentData = this.object.m_CompressedMesh.tangents.unpack(2, 4 * 2);
      let signs = this.object.m_CompressedMesh.tangentSigns.unpack();
      this.tangents = [];
      for (let i = 0; i < this.object.m_CompressedMesh.tangents.length / 2; i++) {
        let x = tangentData[i * 2];
        let y = tangentData[i * 2 + 1];
        let zsqr = 1 - x * x - y * y;
        let z;
        if (zsqr >= 0) {
          z = Math.sqrt(zsqr);
        } else {
          z = 0;
          let normal = new Vector3(x, y, z);
          normal.normalize();
          x = normal.x;
          y = normal.y;
          z = normal.z;
        }
        if (signs[i * 2] === 0) {
          z = -z;
        }
        let w = signs[i * 2 + 1] > 0 ? 1.0 : -1.0;
        this.tangents[i * 4] = x;
        this.tangents[i * 4 + 1] = y;
        this.tangents[i * 4 + 2] = z;
        this.tangents[i * 4 + 3] = w;
      }
    }
    if (this.object.m_CompressedMesh.weights.length > 0) {
      let weights = this.object.m_CompressedMesh.weights.unpack();
      let boneIndices = this.object.m_CompressedMesh.boneIndices.unpack();
      this.initMSkin();

      let bonePos = 0;
      let boneIndexPos = 0;
      let j = 0;
      let sum = 0;

      for (let i = 0; i < this.object.m_CompressedMesh.weights.length; i++) {
        this.object.m_Skin[bonePos][`weight[${j}]`] = weights[i] / 31;
        this.object.m_Skin[bonePos][`boneIndex[${j}]`] = boneIndices[boneIndexPos++];
        j++;
        sum += weights[i];
        if (sum >= 31) {
          for (; j < 4; j++) {
            this.object.m_Skin[bonePos][`weight[${j}]`] = 0;
            this.object.m_Skin[bonePos][`boneIndex[${j}]`] = 0;
          }
          bonePos++;
          j = 0;
          sum = 0;
        } else if (j === 3) {
          this.object.m_Skin[bonePos][`weight[${j}]`] = (31 - sum) / 31;
          this.object.m_Skin[bonePos][`boneIndex[${j}]`] = boneIndices[boneIndexPos++];
          bonePos++;
          j = 0;
          sum = 0;
        }
      }
    }
    if (this.object.m_CompressedMesh.triangles.length > 0) {
      this.indexBuffer = this.object.m_CompressedMesh.triangles.unpack();
    }
    if (this.object.m_CompressedMesh.colors.length > 0) {
      this.object.m_CompressedMesh.colors.length *= 4;
      this.object.m_CompressedMesh.colors.bitSize /= 4;
      let colors = this.object.m_CompressedMesh.colors.unpack();
      this.colors = [];
      for (let i = 0; i < this.object.m_CompressedMesh.colors.length / 4; i += 4) {
        this.colors.push([colors[i] / 0xFF, colors[i + 1] / 0xFF, colors[i + 2] / 0xFF, colors[i + 3] / 0xFF]);
      }
    }
  }

  getTriangles() {
    this.indices = [];
    const indexReader = new BinaryReader(this.object.m_IndexBuffer, 'little');
    let rawIndices;
    if (this.object.m_IndexFormat === 0) {  // 16-bit
      rawIndices = new Uint16Array(this.object.m_IndexBuffer.length / 2);
      for (let i = 0; i < rawIndices.length; i++) {
        rawIndices[i] = indexReader.readUInt16();
      }
    } else {
      rawIndices = new Uint32Array(this.object.m_IndexBuffer.length / 4);
      for (let i = 0; i < rawIndices.length; i++) {
        rawIndices[i] = indexReader.readUInt32();
      }
    }
    for (let subMesh of this.object.m_SubMeshes) {
      subMesh = subMesh.data;
      let firstIndex = subMesh.firstByte / 2;
      if (this.object.m_IndexFormat !== 0) {  // indices are not 16-bit
        firstIndex /= 2;
      }
      let indexCount = subMesh.indexCount;
      let topology = GfxPrimitiveType[subMesh.topology];
      if (topology === 'Triangles') {
        for (let i = 0; i < indexCount; i += 3) {
          this.indices.push(rawIndices[firstIndex + i]);
          this.indices.push(rawIndices[firstIndex + i + 1]);
          this.indices.push(rawIndices[firstIndex + i + 2]);
        }
      } else if (this.version[0] < 4 || topology === 'TriangleStrip') {
        let triIndex = 0;
        for (let i = 0; i < indexCount - 2; i++) {
          let a = rawIndices[firstIndex + i];
          let b = rawIndices[firstIndex + i + 1];
          let c = rawIndices[firstIndex + i + 2];

          if (a === b || a === c || b === c) {
            continue;
          }

          if ((i & 1) === 1) {
            this.indices.push(b);
            this.indices.push(a);
          } else {
            this.indices.push(a);
            this.indices.push(b);
          }
          this.indices.push(c);
          triIndex += 3;
        }
        subMesh.indexCount = triIndex;
      } else if (topology === 'Quads') {
        for (let i = 0; i < indexCount; i += 4) {
          this.indices.push(rawIndices[firstIndex + i]);
          this.indices.push(rawIndices[firstIndex + i + 1]);
          this.indices.push(rawIndices[firstIndex + i + 2]);
          this.indices.push(rawIndices[firstIndex + i]);
          this.indices.push(rawIndices[firstIndex + i + 1]);
          this.indices.push(rawIndices[firstIndex + i + 2]);
        }
        subMesh.indexCount = indexCount / 2 * 3;
      }
    }
  }

  initMSkin() {
    this.object.m_Skin = [];
    for (let i = 0; i < this.object.m_VertexData.m_VertexCount; i++) {
      this.object.m_Skin.push({data: {}});
    }
  }

  getSubMesh(idx) {
    const subMeshDesc = this.object.m_SubMeshes[idx].data;
    const firstIndex = (this.object.m_IndexFormat === 0) ? (subMeshDesc.firstByte / 2) : (subMeshDesc.firstByte / 4);
    let indices = this.indices.slice(firstIndex, firstIndex + subMeshDesc.indexCount);
    let vertices = this.vertices.slice(subMeshDesc.firstVertex, subMeshDesc.firstVertex + subMeshDesc.vertexCount);
    // Normalize indices
    indices = indices.map(i => i - subMeshDesc.firstVertex);
    return {indices, vertices};
  }

  toGeometry(subMesh) {
    const geometry = new THREE.BufferGeometry();

    let vertices = [];
    for (const vert of (subMesh ? subMesh.vertices : this.vertices)) {
      vertices.push(vert[0], vert[1], vert[2]);
    }

    if (this.normals) {
      let normals = [];
      for (const norm of this.normals) {
        normals.push(norm[0], norm[1], norm[2]);
      }
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    }

    if (this.colors) {
      let colors = [];
      for (const col of this.colors) {
        colors.push(col[0], col[1], col[2]);
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    if (this.uv0) {
      let uvs = [];
      for (const uv of this.uv0) {
        uvs.push(uv[0], uv[1]);
      }
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }

    // if (this.tangents) {
    //   let tangents = [];
    //   for (const tangent of this.tangents) {
    //     tangents.push(tangent[0], tangent[1], tangent[2], tangent[3]);
    //   }
    //   geometry.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));
    // }

    if (this.object.m_Skin) {
      let skinIndices = [];
      let skinWeights = [];
      for (const boneWeights of this.object.m_Skin) {
        skinIndices.push(boneWeights.data['boneIndex[0]'], boneWeights.data['boneIndex[1]'],
          boneWeights.data['boneIndex[2]'], boneWeights.data['boneIndex[3]']);
        skinWeights.push(boneWeights.data['weight[0]'], boneWeights.data['weight[1]'],
          boneWeights.data['weight[2]'], boneWeights.data['weight[3]']);
      }
      geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
      geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    }

    if (subMesh) {
      geometry.setIndex(subMesh.indices);
    } else {
      geometry.setIndex(this.indices);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    return geometry;
  }

  async createPreview() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x606060);

    let max = new THREE.Box3().setFromCenterAndSize(
      this.object.m_LocalAABB.m_Center,
      this.object.m_LocalAABB.m_Extent
    ).max;
    let scale = 10 / max.z;

    for (let i = 0; i < this.object.m_SubMeshes.length; i++) {
      let mesh = new THREE.Mesh(this.toGeometry(this.getSubMesh(i)), new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true
      }));
      mesh.rotation.set(-1.61443, 0, 0);
      mesh.position.set(0, -4, 0);
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);
    }

    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 1000);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    const prev = $('#preview');
    renderer.setSize(prev.width(), prev.height());

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight1.position.set(5, 5, 7.5);

    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight2.position.set(-5, 5, 7.5);

    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight3.position.set(0, 5, -7.5);

    scene.add(dirLight3);

    const dirLight4 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight4.position.set(0, -7.5, -0);

    scene.add(dirLight4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    camera.position.set(0, 0, 30);

    let lastID = 0;
    const animate = () => {
      renderer.render(scene, camera);
      lastID = requestAnimationFrame(animate);
    }

    function onDestroy() {
      document.body.removeEventListener('destroy-preview', onDestroy);
      cancelAnimationFrame(lastID);
    }
    document.body.addEventListener('destroy-preview', onDestroy);

    animate();

    return renderer.domElement;
  }

  async getExport() {
    return new Promise(resolve => {
      const scene = new THREE.Scene();
      for (let i = 0; i < this.object.m_SubMeshes.length; i++) {
        let mesh = new THREE.Mesh(this.toGeometry(this.getSubMesh(i)), new THREE.MeshBasicMaterial({color: '#000000'}));
        scene.add(mesh);
      }
      const exporter = new GLTFExporter();
      exporter.parse(scene, gltf => {
        resolve(JSON.stringify(gltf));
      }, error => {
        console.error('Error in GLTF exporter:', error);
        resolve('Error in GLTF exporter');
      }, {});
    });
  }
}
