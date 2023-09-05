# WebAssetStudio
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/ashduino101)

WebAssetStudio is an online tool to view and extract game asset bundles, inspired by Perfare's [AssetStudio](https://github.com/Perfare/AssetStudio/) (archived).
It runs entirely inside your browser using JavaScript and WebAssembly.

## Supported formats
WebAssetStudio currently supports the following formats:
 - UnityFS (`.unity3d`, `.assets`, `level*`)
 - FSB5 (currently only for UnityFS bundles)

## Planned support
WebAssetStudio plans to eventually support the following formats:
 - Godot (`.pck`)
 - Wwise BNK (`.bnk`)

Feel free to suggest formats as GitHub issues.

## Exporting
Currently, only ZIP exporting is supported, as well as downloading files individually by selecting the object and clicking the "Download" button in the bottom left.
A guide to the ZIP directory layout is as follows:

```
│
└ <filename>
  ├ Externals: details of external files used by the asset
  │  └ <guid>.json
  ├ Objects: the actual objects of the asset (e.g. textures, meshes, sprites)
  │  ├ <object>.<extension>: An exported asset (e.g. .png, .gltf, .shader [note 1])
  │  └ Info: all properties of each object (to a reasonable degree)
  │    └ <object>.json: A JSON file containing properties of the object
  ├ Reference types: type trees used as references
  │  └ <typename>_<scriptID>.json: A type tree, in JSON form
  └ Type trees: type definitions used by objects - these might be inaccurate
     └ <typename>_<scriptID>.json: Same as above
```
Note 1: Shaders contain a raw shader structure and aren't exported at the moment. (TODO)

## Supported classes (Unity)
These Unity classes are currently supported:
 - `Animation`
 - `AnimationClip`
 - `Animator`
 - `AnimatorOverrideController`
 - `AssetBundle`
 - `AudioClip`
 - `AudioListener`
 - `Avatar`
 - `Behaviour`
 - `CanvasRenderer`
 - `Component`
 - `EditorExtension`
 - `FlareLayer`
 - `Font`
 - `GameObject`
 - `Material`
 - `Mesh`
 - `MeshFilter`
 - `MeshRenderer`
 - `MonoBehaviour`
 - `MonoScript`
 - `NamedObject`
 - `PhysicMaterial`
 - `PPtr` (note 1)
 - `Renderer`
 - `Shader`
 - `SkinnedMeshRenderer`
 - `Sprite`
 - `TextAsset`
 - `Texture`
 - `Texture2D`
 - `Transform`
 
Note 1: In this implementation, PPtrs do not explicitly declare a type. The type is inferred by the resolved path.