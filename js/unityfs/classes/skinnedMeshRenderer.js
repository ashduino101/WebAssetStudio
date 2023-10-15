import {Renderer} from "./renderer";
import {PPtr} from "./pptr";
import * as THREE from "three";
import $ from "jquery";
import {OrbitControls} from "three/addons/controls/OrbitControls";
import {
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
        const tex = this.materials[0].object.getTex('_MainTex');
        const emission = this.materials[0].object.getTex('_EmissionMap');
        const bump = this.materials[0].object.getTex('_BumpMap');
        const occlusion = this.materials[0].object.getTex('_OcclusionMap');
        const metallic = this.materials[0].object.getTex('_MetallicGlossMap');
        if (!tex) return document.createElement('div');

        const scene = new Scene();
        scene.background = new Color(0x606060);

        const loader = new THREE.TextureLoader();

        const matOptions = {
          flatShading: true,
          map: loader.load(await tex.createDataUrl(0)),
        };

        if (emission) {
          matOptions.emissiveIntensity = 1;
          matOptions.emissiveMap = loader.load(await emission.createDataUrl(0));
        }
        if (bump) {
          matOptions.bumpMap = loader.load(await bump.createDataUrl(0));
          matOptions.bumpScale = 1;
        }
        if (occlusion) {
          matOptions.aoMap = loader.load(await occlusion.createDataUrl(0));
        }
        if (metallic) {
          matOptions.metalnessMap = loader.load(await metallic.createDataUrl(0));
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

        const intensity = 3;

        const dirLight1 = new DirectionalLight(0xffffff, intensity);
        dirLight1.position.set(50, 50, 75);

        scene.add(dirLight1);

        const dirLight2 = new DirectionalLight(0xffffff, intensity);
        dirLight2.position.set(-50, 50, 75);

        scene.add(dirLight2);

        const dirLight3 = new DirectionalLight(0xffffff, intensity);
        dirLight3.position.set(0, 50, -75);

        scene.add(dirLight3);

        const dirLight4 = new DirectionalLight(0xffffff, intensity);
        dirLight4.position.set(0, -75, 0);

        scene.add(dirLight4);

        scene.add(
          new DirectionalLightHelper(dirLight1),
          new DirectionalLightHelper(dirLight2),
          new DirectionalLightHelper(dirLight3),
          new DirectionalLightHelper(dirLight4)
        );

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