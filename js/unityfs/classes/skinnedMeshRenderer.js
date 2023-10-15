import {Renderer} from "./renderer";
import {PPtr} from "./pptr";
import * as THREE from "three";
import $ from "jquery";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import {
  AmbientLight,
  Box3,
  Color, DirectionalLight,
  DirectionalLightHelper,
  Mesh,
  MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from "three";

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

  async createPreview() {
    this.mesh.resolve();
    if (this.mesh.object) {
      this.materials[0].resolve();
      if (this.materials[0].object) {
        const mat = this.materials[0].object;
        const tex = mat.getTexEnv('_MainTex');
        const emission = mat.getTexEnv('_EmissionMap');
        const bump = mat.getTexEnv('_BumpMap');
        const occlusion = mat.getTexEnv('_OcclusionMap');
        const metallicGloss = mat.getTexEnv('_MetallicGlossMap');

        const bumpScale = mat.getFloat('_BumpScale') ?? 1;
        const glossiness = mat.getFloat('_Glossiness') ?? 0;
        const metallic = mat.getFloat('_Metallic') ?? 0.7;
        const occlusionStrength = mat.getFloat('_OcclusionStrength') ?? 0.75;
        const enableEmission = mat.getFloat('_EnableEmission') ?? true;

        if (!tex) return document.createElement('div');

        const scene = new Scene();
        scene.background = new Color(0x606060);

        const loader = new THREE.TextureLoader();

        const matOptions = {
          roughness: 0.75,
          clearcoat: glossiness,
          clearcoatRoughness: 0.5,
          map: loader.load(await tex.createDataUrl(0)),
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

        const material = new MeshPhysicalMaterial(matOptions);

        let mesh = new Mesh(this.mesh.object.toGeometry(), material);
        let max = new Box3().setFromObject(mesh).max;
        let scale = 10 / max.z;
        mesh.rotation.set(-1.61443, 0, 0);
        mesh.position.set(0, -4, 0);
        mesh.scale.set(scale, scale, scale);

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
    }
    return document.createElement('div');
  }
}