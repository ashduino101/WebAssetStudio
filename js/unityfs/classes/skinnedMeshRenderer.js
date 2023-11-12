import {Renderer} from "./renderer";
import {PPtr} from "./pptr";
import * as THREE from "three";
import $ from "jquery";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import {
  AmbientLight, Bone,
  Box3,
  Color, DirectionalLight,
  DirectionalLightHelper, Matrix4,
  Mesh, MeshMatcapMaterial,
  MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera,
  Scene, Skeleton, SkinnedMesh, TextureLoader,
  WebGLRenderer
} from "three";
import {Matrix4x4} from "../basicTypes";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter";

export class SkinnedMeshRenderer extends Renderer {
  static exposedAttributes = [
    'gameObject',
    'enabled',
    'castShadows',
    'receiveShadows',
    'motionVectors',
    'lightProbeUsage',
    'reflectionProbeUsage',
    'lightmapIndex',
    'lightmapIndexDynamic',
    'lightmapTilingOffset',
    'lightmapTilingOffsetDynamic',
    'materials',
    'staticBatchInfo',
    'staticBatchRoot',
    'probeAnchor',
    'lightProbeVolumeOverride',
    'sortingLayerID',
    'sortingOrder',
    'quality',
    'updateWhenOffscreen',
    'skinNormals',
    'mesh',
    'bones',
    'blendShapeWeights'
  ];
  
  constructor(reader) {
    super(reader);
    this.quality = reader.readInt32();
    this.updateWhenOffscreen = reader.readBool();
    this.skinNormals = reader.readBool();
    reader.align(4);

    if (reader.version[0] === 2 && reader.version[1] < 6) {
      this.disableAnimationWhenOffscreen = new PPtr(reader);
    }
    this.mesh = new PPtr(reader);

    let numBones = reader.readInt32();
    this.bones = [];
    for (let i = 0; i < numBones; i++) {
      this.bones.push(new PPtr(reader));
    }
    if (reader.versionGTE(4, 3)) {
      this.blendShapeWeights = reader.readArrayT(() => reader.readFloat32(), reader.readUInt32());
    }
  }

  transformToBone(boneT) {
    const bone = new Bone();
    bone.name = boneT.gameObject.object.name;
    bone.position.set(boneT.localPosition.x, boneT.localPosition.y, boneT.localPosition.z);
    bone.rotation.set(boneT.localRotation.x, boneT.localRotation.y, boneT.localRotation.z);
    bone.scale.set(boneT.localScale.x, boneT.localScale.y, boneT.localScale.z);
    return bone;
  }

  _mapTransformBone(boneT) {
    const bone = this.transformToBone(boneT);
    boneT.mapChildren();
    for (const b of boneT.children) {
      bone.add(this._mapTransformBone(b.object));
    }
    return bone;
  }

  async mapBones() {
    const bones = [];
    for (const bone of this.bones) {
      bones.push(this._mapTransformBone(bone.object));
    }
    return bones;
  }

  async createSkeleton() {
    return new Skeleton(await this.mapBones());
  }

  _debugBone(bone, level = 0) {
    let str = `${'| '.repeat(level)}${bone.name}\n`;
    for (const child of bone.children) {
      str += this._debugBone(child, level + 1);
    }
    return str;
  }
  
  debugSkeleton(skeleton) {
    console.log(this._debugBone(skeleton.bones[0]));
  }

  applyPose(skeleton, pose) {
    let i = 0;
    skeleton.bones.forEach(bone => {
      bone.applyMatrix4(new Matrix4(...pose[i].values));
      i++;
    });
  }

  async createMesh() {
    let material;
    if (this.materials.length > 0) {
      this.materials[0].resolve();
      const mat = this.materials[0].object;
      const tex = mat.getTexEnv('_MainTex');
      const emission = mat.getTexEnv('_EmissionMap');
      const bump = mat.getTexEnv('_BumpMap');
      const occlusion = mat.getTexEnv('_OcclusionMap');
      const metallicGloss = mat.getTexEnv('_MetallicGlossMap');
      const matCap = mat.getTexEnv('_MatCapTex');

      const bumpScale = mat.getFloat('_BumpScale') ?? 1;
      const glossiness = mat.getFloat('_Glossiness') ?? 0;
      const metallic = mat.getFloat('_Metallic') ?? 0.7;
      const occlusionStrength = mat.getFloat('_OcclusionStrength') ?? 0.75;
      const enableEmission = mat.getFloat('_EnableEmission') ?? true;

      const loader = new TextureLoader();

      const matOptions = {
        roughness: 0.75,
        clearcoat: glossiness,
        clearcoatRoughness: 0.5,
        map: tex ? loader.load(await tex.createDataUrl(0)) : null,
      };

      if (emission && enableEmission) {
        matOptions.emissive = 0xffffff;
        matOptions.emissiveIntensity = 1;
        matOptions.emissiveMap = loader.load(await emission.createDataUrl(0));
      }
      if (bump) {
        matOptions.bumpMap = loader.load(await bump.createDataUrl(0));
        matOptions.bumpScale = bumpScale;
      }
      if (occlusion) {
        matOptions.aoMapIntensity = occlusionStrength;
        matOptions.aoMap = loader.load(await occlusion.createDataUrl(0));
      }
      if (metallicGloss) {
        matOptions.metalness = metallic;
        matOptions.metalnessMap = loader.load(await metallicGloss.createDataUrl(0));
      }

      material = new MeshPhysicalMaterial(matOptions);
    } else {
      material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true
      });
    }

    let mesh = new Mesh(this.mesh.object.toGeometry(), material);

    // const skeleton = await this.createSkeleton();
    // console.log(skeleton)
    // this.debugSkeleton(skeleton);
    // mesh.add(skeleton.bones[0]);
    // if (this.mesh.object.bindPose) {
    //   this.applyPose(skeleton, this.mesh.object.bindPose);
    // }
    // mesh.bind(skeleton);

    let max = new Box3().setFromObject(mesh).max;
    let scale = 10 / max.z;
    mesh.rotation.set(-1.61443, 0, 0);
    mesh.position.set(0, -4, 0);
    mesh.scale.set(scale, scale, scale);

    return mesh;
  }

  async createPreview() {
    // await this.createSkeleton()
    this.mesh.resolve();
    if (this.mesh.object) {
      const scene = new Scene();
      scene.background = new Color(0x606060);

      const mesh = await this.createMesh();

      // scene.add(new THREE.SkeletonHelper(skeleton.bones[0]));

      scene.add(mesh);

      const camera = new PerspectiveCamera(70, 1, 0.01, 1000);

      const renderer = new WebGLRenderer({antialias: true});
      const prev = $('#preview');
      renderer.setSize(prev.width(), prev.height());

      scene.add(new AmbientLight(0xffffff, 2));

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

      window.addEventListener('resize', function() {
        camera.aspect = prev.width() / prev.height();
        camera.updateProjectionMatrix();

        renderer.setSize(prev.width(), prev.height());
      }, false);

      animate();

      return renderer.domElement;
    }
    return document.createElement('div');
  }

  async getExport() {
    return new Promise(async resolve => {
      const mesh = await this.createMesh();

      setTimeout(() => {
        const exporter = new GLTFExporter();
        exporter.parse(mesh, gltf => {
          resolve(gltf);
        }, error => {
          console.error('Error in GLTF exporter:', error);
          resolve('Error in GLTF exporter');
        }, {binary: true});
      }, 1000);  // wait for textures to load
    });
  }
}