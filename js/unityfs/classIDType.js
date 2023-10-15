import {Shader} from "./classes/shader";
import {UnityObject} from "./classes/object";
import {GameObject} from "./classes/gameObject";
import {Component} from "./classes/component";
import {Transform} from "./classes/transform";
import {Behaviour} from "./classes/behaviour";
import {EditorExtension} from "./classes/editorExtension";
import {MeshRenderer} from "./classes/meshRenderer";
import {Renderer} from "./classes/renderer";
import {Texture} from "./classes/texture";
import {Texture2D} from "./classes/texture2d";
import {MeshFilter} from "./classes/meshFilter";
import {Mesh} from "./classes/mesh";
import {TextAsset} from "./classes/textAsset";
import {Avatar} from "./classes/avatar";
import {MonoBehaviour} from "./classes/monoBehaviour";
import {MonoScript} from "./classes/monoScript";
import {FlareLayer} from "./classes/flareLayer";
import {PhysicMaterial} from "./classes/physicMaterial";
import {AudioListener} from "./classes/audioListener";
import {SkinnedMeshRenderer} from "./classes/skinnedMeshRenderer";
import {AssetBundle, PreloadData} from "./classes/assetBundle";
import {Material} from "./classes/material";
import {Sprite} from "./classes/sprite";
import {AnimatorOverrideController} from "./classes/animatorOverrideController";
import {CanvasRenderer} from "./classes/canvasRenderer";
import {Font} from "./classes/font";
import {Animator} from "./classes/animator";
import {AudioClip} from "./classes/audioClip";
import {Cubemap} from "./classes/cubemap";
import {AnimationClip} from "./classes/animationClip";
import {RuntimeAnimatorController} from "./classes/runtimeAnimatorController";
import {AnimatorController} from "./classes/animatorController";
import {ParticleSystemRenderer} from "./classes/particleSystemRenderer";
import {VideoClip} from "./classes/videoClip";

const ClassIDType = {
    0: ['UnityObject', UnityObject],
    1: ['GameObject', GameObject],
    2: ['Component', Component],
    3: 'LevelGameManager',
    4: ['Transform', Transform],
    5: 'TimeManager',
    6: 'GlobalGameManager',
    8: ['Behaviour', Behaviour],
    9: 'GameManager',
    11: 'AudioManager',
    12: 'ParticleAnimator',
    13: 'InputManager',
    15: 'EllipsoidParticleEmitter',
    17: 'Pipeline',
    18: ['EditorExtension', EditorExtension],
    19: 'Physics2DSettings',
    20: 'Camera',
    21: ['Material', Material],
    23: ['MeshRenderer', MeshRenderer],
    25: ['Renderer', Renderer],
    26: 'ParticleRenderer',
    27: ['Texture', Texture],
    28: ['Texture2D', Texture2D],
    29: 'OcclusionCullingSettings',
    30: 'GraphicsSettings',
    33: ['MeshFilter', MeshFilter],
    41: 'OcclusionPortal',
    43: ['Mesh', Mesh],
    45: 'Skybox',
    47: 'QualitySettings',
    48: ['Shader', Shader],
    49: ['TextAsset', TextAsset],
    50: 'Rigidbody2D',
    51: 'Physics2DManager',
    53: 'Collider2D',
    54: 'Rigidbody',
    55: 'PhysicsManager',
    56: 'Collider',
    57: 'Joint',
    58: 'CircleCollider2D',
    59: 'HingeJoint',
    60: 'PolygonCollider2D',
    61: 'BoxCollider2D',
    62: 'PhysicsMaterial2D',
    64: 'MeshCollider',
    65: 'BoxCollider',
    66: 'CompositeCollider2D',
    68: 'EdgeCollider2D',
    70: 'CapsuleCollider2D',
    72: 'ComputeShader',
    74: ['AnimationClip', AnimationClip],
    75: 'ConstantForce',
    76: 'WorldParticleCollider',
    78: 'TagManager',
    81: ['AudioListener', AudioListener],
    82: 'AudioSource',
    83: ['AudioClip', AudioClip],
    84: 'RenderTexture',
    86: 'CustomRenderTexture',
    87: 'MeshParticleEmitter',
    88: 'ParticleEmitter',
    89: ['Cubemap', Cubemap],
    90: ['Avatar', Avatar],
    91: ['AnimatorController', AnimatorController],
    92: 'GUILayer',
    93: ['RuntimeAnimatorController', RuntimeAnimatorController],
    94: 'ScriptMapper',
    95: ['Animator', Animator],
    96: 'TrailRenderer',
    98: 'DelayedCallManager',
    102: 'TextMesh',
    104: 'RenderSettings',
    108: 'Light',
    109: 'CGProgram',
    110: 'BaseAnimationTrack',
    111: 'Animation',
    114: ['MonoBehaviour', MonoBehaviour],
    115: ['MonoScript', MonoScript],
    116: 'MonoManager',
    117: 'Texture3D',
    118: 'NewAnimationTrack',
    119: 'Projector',
    120: 'LineRenderer',
    121: 'Flare',
    122: 'Halo',
    123: 'LensFlare',
    124: ['FlareLayer', FlareLayer],
    125: 'HaloLayer',
    126: 'NavMeshAreas',
    127: 'HaloManager',
    128: ['Font', Font],
    129: 'PlayerSettings',
    130: 'NamedObject',
    131: 'GUITexture',
    132: 'GUIText',
    133: 'GUIElement',
    134: ['PhysicMaterial', PhysicMaterial],
    135: 'SphereCollider',
    136: 'CapsuleCollider',
    137: ['SkinnedMeshRenderer', SkinnedMeshRenderer],
    138: 'FixedJoint',
    140: 'RaycastCollider',
    141: 'BuildSettings',
    142: ['AssetBundle', AssetBundle],
    143: 'CharacterController',
    144: 'CharacterJoint',
    145: 'SpringJoint',
    146: 'WheelCollider',
    147: 'ResourceManager',
    148: 'NetworkView',
    149: 'NetworkManager',
    150: ['PreloadData', PreloadData],
    152: 'MovieTexture',
    153: 'ConfigurableJoint',
    154: 'TerrainCollider',
    155: 'MasterServerInterface',
    156: 'TerrainData',
    157: 'LightmapSettings',
    158: 'WebCamTexture',
    159: 'EditorSettings',
    160: 'InteractiveCloth',
    161: 'ClothRenderer',
    162: 'EditorUserSettings',
    163: 'SkinnedCloth',
    164: 'AudioReverbFilter',
    165: 'AudioHighPassFilter',
    166: 'AudioChorusFilter',
    167: 'AudioReverbZone',
    168: 'AudioEchoFilter',
    169: 'AudioLowPassFilter',
    170: 'AudioDistortionFilter',
    171: 'SparseTexture',
    180: 'AudioBehaviour',
    181: 'AudioFilter',
    182: 'WindZone',
    183: 'Cloth',
    184: 'SubstanceArchive',
    185: 'ProceduralMaterial',
    186: 'ProceduralTexture',
    187: 'Texture2DArray',
    188: 'CubemapArray',
    191: 'OffMeshLink',
    192: 'OcclusionArea',
    193: 'Tree',
    194: 'NavMeshObsolete',
    195: 'NavMeshAgent',
    196: 'NavMeshSettings',
    197: 'LightProbesLegacy',
    198: 'ParticleSystem',
    199: ['ParticleSystemRenderer', ParticleSystemRenderer],
    200: 'ShaderVariantCollection',
    205: 'LODGroup',
    206: 'BlendTree',
    207: 'Motion',
    208: 'NavMeshObstacle',
    210: 'SortingGroup',
    212: 'SpriteRenderer',
    213: ['Sprite', Sprite],
    214: 'CachedSpriteAtlas',
    215: 'ReflectionProbe',
    216: 'ReflectionProbes',
    218: 'Terrain',
    220: 'LightProbeGroup',
    221: ['AnimatorOverrideController', AnimatorOverrideController],
    222: ['CanvasRenderer', CanvasRenderer],
    223: 'Canvas',
    224: 'RectTransform',
    225: 'CanvasGroup',
    226: 'BillboardAsset',
    227: 'BillboardRenderer',
    228: 'SpeedTreeWindAsset',
    229: 'AnchoredJoint2D',
    230: 'Joint2D',
    231: 'SpringJoint2D',
    232: 'DistanceJoint2D',
    233: 'HingeJoint2D',
    234: 'SliderJoint2D',
    235: 'WheelJoint2D',
    236: 'ClusterInputManager',
    237: 'BaseVideoTexture',
    238: 'NavMeshData',
    240: 'AudioMixer',
    241: 'AudioMixerController',
    243: 'AudioMixerGroupController',
    244: 'AudioMixerEffectController',
    245: 'AudioMixerSnapshotController',
    246: 'PhysicsUpdateBehaviour2D',
    247: 'ConstantForce2D',
    248: 'Effector2D',
    249: 'AreaEffector2D',
    250: 'PointEffector2D',
    251: 'PlatformEffector2D',
    252: 'SurfaceEffector2D',
    253: 'BuoyancyEffector2D',
    254: 'RelativeJoint2D',
    255: 'FixedJoint2D',
    256: 'FrictionJoint2D',
    257: 'TargetJoint2D',
    258: 'LightProbes',
    259: 'LightProbeProxyVolume',
    271: 'SampleClip',
    272: 'AudioMixerSnapshot',
    273: 'AudioMixerGroup',
    280: 'NScreenBridge',
    290: 'AssetBundleManifest',
    292: 'UnityAdsManager',
    300: 'RuntimeInitializeOnLoadManager',
    301: 'CloudWebServicesManager',
    303: 'UnityAnalyticsManager',
    304: 'CrashReportManager',
    305: 'PerformanceReportingManager',
    310: 'UnityConnectSettings',
    319: 'AvatarMask',
    320: 'PlayableDirector',
    328: 'VideoPlayer',
    329: ['VideoClip', VideoClip],
    330: 'ParticleSystemForceField',
    331: 'SpriteMask',
    362: 'WorldAnchor',
    363: 'OcclusionCullingData',
    1000: 'SmallestEditorClassID',
    1001: 'PrefabInstance',
    1002: 'EditorExtensionImpl',
    1003: 'AssetImporter',
    1004: 'AssetDatabaseV1',
    1005: 'Mesh3DSImporter',
    1006: 'TextureImporter',
    1007: 'ShaderImporter',
    1008: 'ComputeShaderImporter',
    1020: 'AudioImporter',
    1026: 'HierarchyState',
    1027: 'GUIDSerializer',
    1028: 'AssetMetaData',
    1029: 'DefaultAsset',
    1030: 'DefaultImporter',
    1031: 'TextScriptImporter',
    1032: 'SceneAsset',
    1034: 'NativeFormatImporter',
    1035: 'MonoImporter',
    1037: 'AssetServerCache',
    1038: 'LibraryAssetImporter',
    1040: 'ModelImporter',
    1041: 'FBXImporter',
    1042: 'TrueTypeFontImporter',
    1044: 'MovieImporter',
    1045: 'EditorBuildSettings',
    1046: 'DDSImporter',
    1048: 'InspectorExpandedState',
    1049: 'AnnotationManager',
    1050: 'PluginImporter',
    1051: 'EditorUserBuildSettings',
    1052: 'PVRImporter',
    1053: 'ASTCImporter',
    1054: 'KTXImporter',
    1055: 'IHVImageFormatImporter',
    1101: 'AnimatorStateTransition',
    1102: 'AnimatorState',
    1105: 'HumanTemplate',
    1107: 'AnimatorStateMachine',
    1108: 'PreviewAnimationClip',
    1109: 'AnimatorTransition',
    1110: 'SpeedTreeImporter',
    1111: 'AnimatorTransitionBase',
    1112: 'SubstanceImporter',
    1113: 'LightmapParameters',
    1120: 'LightingDataAsset',
    1121: 'GISRaster',
    1122: 'GISRasterImporter',
    1123: 'CadImporter',
    1124: 'SketchUpImporter',
    1125: 'BuildReport',
    1126: 'PackedAssets',
    1127: 'VideoClipImporter',
    2000: 'ActivationLogComponent',
    100003: 'MonoObject',
    100004: 'Collision',
    100005: 'Vector3f',
    100006: 'RootMotionData',
    100007: 'Collision2D',
    100008: 'AudioMixerLiveUpdateFloat',
    100009: 'AudioMixerLiveUpdateBool',
    100010: 'Polygon2D',
    19719996: 'TilemapCollider2D',
    41386430: 'AssetImporterLog',
    73398921: 'VFXRenderer',
    76251197: 'SerializableManagedRefTestClass',
    156049354: 'Grid',
    156483287: 'ScenesUsingAssets',
    171741748: 'ArticulationBody',
    181963792: 'Preset',
    277625683: 'EmptyObject',
    285090594: 'IConstraint',
    293259124: 'TestObjectWithSpecialLayoutOne',
    294290339: 'AssemblyDefinitionReferenceImporter',
    334799969: 'SiblingDerived',
    342846651: 'TestObjectWithSerializedMapStringNonAlignedStruct',
    367388927: 'SubDerived',
    369655926: 'AssetImportInProgressProxy',
    382020655: 'PluginBuildInfo',
    426301858: 'EditorProjectAccess',
    468431735: 'PrefabImporter',
    478637458: 'TestObjectWithSerializedArray',
    478637459: 'TestObjectWithSerializedAnimationCurve',
    483693784: 'TilemapRenderer',
    488575907: 'ScriptableCamera',
    612988286: 'SpriteAtlasAsset',
    638013454: 'SpriteAtlasDatabase',
    641289076: 'AudioBuildInfo',
    644342135: 'CachedSpriteAtlasRuntimeData',
    646504946: 'RendererFake',
    662584278: 'AssemblyDefinitionReferenceAsset',
    668709126: 'BuiltAssetBundleInfoSet',
    687078895: 'SpriteAtlas',
    747330370: 'RayTracingShaderImporter',
    825902497: 'RayTracingShader',
    850595691: 'LightingSettings',
    877146078: 'PlatformModuleSetup',
    890905787: 'VersionControlSettings',
    895512359: 'AimConstraint',
    937362698: 'VFXManager',
    994735392: 'VisualEffectSubgraph',
    994735403: 'VisualEffectSubgraphOperator',
    994735404: 'VisualEffectSubgraphBlock',
    1027052791: 'LocalizationImporter',
    1091556383: 'Derived',
    1111377672: 'PropertyModificationsTargetTestObject',
    1114811875: 'ReferencesArtifactGenerator',
    1152215463: 'AssemblyDefinitionAsset',
    1154873562: 'SceneVisibilityState',
    1183024399: 'LookAtConstraint',
    1210832254: 'SpriteAtlasImporter',
    1223240404: 'MultiArtifactTestImporter',
    1268269756: 'GameObjectRecorder',
    1325145578: 'LightingDataAssetParent',
    1386491679: 'PresetManager',
    1392443030: 'TestObjectWithSpecialLayoutTwo',
    1403656975: 'StreamingManager',
    1480428607: 'LowerResBlitTexture',
    1542919678: 'StreamingController',
    1571458007: 'RenderPassAttachment',
    1628831178: 'TestObjectVectorPairStringBool',
    1742807556: 'GridLayout',
    1766753193: 'AssemblyDefinitionImporter',
    1773428102: 'ParentConstraint',
    1803986026: 'FakeComponent',
    1818360608: 'PositionConstraint',
    1818360609: 'RotationConstraint',
    1818360610: 'ScaleConstraint',
    1839735485: 'Tilemap',
    1896753125: 'PackageManifest',
    1896753126: 'PackageManifestImporter',
    1953259897: 'TerrainLayer',
    1971053207: 'SpriteShapeRenderer',
    1977754360: 'NativeObjectType',
    1981279845: 'TestObjectWithSerializedMapStringBool',
    1995898324: 'SerializableManagedHost',
    2058629509: 'VisualEffectAsset',
    2058629510: 'VisualEffectImporter',
    2058629511: 'VisualEffectResource',
    2059678085: 'VisualEffectObject',
    2083052967: 'VisualEffect',
    2083778819: 'LocalizationAsset',
    208985848: 'ScriptedImporter'
}
export default ClassIDType;

export const classNames = [];
for (let cls of Object.values(ClassIDType)) {
    classNames.push(typeof cls == 'string' ? cls : cls[0]);
}
