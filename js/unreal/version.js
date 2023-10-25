// Based on Engine/Source/Runtime/Core/Public/UObject/ObjectVersion.h

// As JavaScript does not have enumerators, we just increment a variable for each value

let v5 = 1000;
export const UE5ObjectVersion = {
  // The original UE5 version, at the time this was added the UE4 version was 522, so UE5 will start from 1000 to show a clear difference
  INITIAL_VERSION: v5++,

  // Support stripping names that are not referenced from export data
  NAMES_REFERENCED_FROM_EXPORT_DATA: v5++,

  // Added a payload table of contents to the package summary
  PAYLOAD_TOC: v5++,

  // Added data to identify references from and to optional package
  OPTIONAL_RESOURCES: v5++,

  // Large world coordinates converts a number of core types to double components by default.
  LARGE_WORLD_COORDINATES: v5++,

  // Remove package GUID from FObjectExport
  REMOVE_OBJECT_EXPORT_PACKAGE_GUID: v5++,

  // Add IsInherited to the FObjectExport entry
  TRACK_OBJECT_EXPORT_IS_INHERITED: v5++,

  // Replace FName asset path in FSoftObjectPath with (package name, asset name) pair FTopLevelAssetPath
  FSOFTOBJECTPATH_REMOVE_ASSET_PATH_FNAMES: v5++,

  // Add a soft object path list to the package summary for fast remap
  ADD_SOFTOBJECTPATH_LIST: v5++,

  // Added bulk/data resource table
  DATA_RESOURCES: v5++
}

let v4 = 214;
export const UE4ObjectVersion = {
  VER_UE4_OLDEST_LOADABLE_PACKAGE: v4++,

  // Removed restriction on blueprint-exposed variables from being read-only
  VER_UE4_BLUEPRINT_VARS_NOT_READ_ONLY: v4++,
  // Added manually serialized element to UStaticMesh (precalculated nav collision)
  VER_UE4_STATIC_MESH_STORE_NAV_COLLISION: v4++,
  // Changed property name for atmospheric fog
  VER_UE4_ATMOSPHERIC_FOG_DECAY_NAME_CHANGE: v4++,
  // Change many properties/functions from Translation to Location
  VER_UE4_SCENECOMP_TRANSLATION_TO_LOCATION: v4++,
  // Material attributes reordering
  VER_UE4_MATERIAL_ATTRIBUTES_REORDERING: v4++,
  // Collision Profile setting has been added: v4++, and all components that exists has to be properly upgraded
  VER_UE4_COLLISION_PROFILE_SETTING: v4++,
  // Making the blueprint's skeleton class transient
  VER_UE4_BLUEPRINT_SKEL_TEMPORARY_TRANSIENT: v4++,
  // Making the blueprint's skeleton class serialized again
  VER_UE4_BLUEPRINT_SKEL_SERIALIZED_AGAIN: v4++,
  // Blueprint now controls replication settings again
  VER_UE4_BLUEPRINT_SETS_REPLICATION: v4++,
  // Added level info used by World browser
  VER_UE4_WORLD_LEVEL_INFO: v4++,
  // Changed capsule height to capsule half-height (afterwards)
  VER_UE4_AFTER_CAPSULE_HALF_HEIGHT_CHANGE: v4++,
  // Added Namepace: v4++, GUID (Key) and Flags to FText
  VER_UE4_ADDED_NAMESPACE_AND_KEY_DATA_TO_FTEXT: v4++,
  // Attenuation shapes
  VER_UE4_ATTENUATION_SHAPES: v4++,
  // Use IES texture multiplier even when IES brightness is not being used
  VER_UE4_LIGHTCOMPONENT_USE_IES_TEXTURE_MULTIPLIER_ON_NON_IES_BRIGHTNESS: v4++,
  // Removed InputComponent as a blueprint addable component
  VER_UE4_REMOVE_INPUT_COMPONENTS_FROM_BLUEPRINTS: v4++,
  // Use an FMemberReference struct in UK2Node_Variable
  VER_UE4_VARK2NODE_USE_MEMBERREFSTRUCT: v4++,
  // Refactored material expression inputs for UMaterialExpressionSceneColor and UMaterialExpressionSceneDepth
  VER_UE4_REFACTOR_MATERIAL_EXPRESSION_SCENECOLOR_AND_SCENEDEPTH_INPUTS: v4++,
  // Spline meshes changed from Z forwards to configurable
  VER_UE4_SPLINE_MESH_ORIENTATION: v4++,
  // Added ReverbEffect asset type
  VER_UE4_REVERB_EFFECT_ASSET_TYPE: v4++,
  // changed max texcoords from 4 to 8
  VER_UE4_MAX_TEXCOORD_INCREASED: v4++,
  // static meshes changed to support SpeedTrees
  VER_UE4_SPEEDTREE_STATICMESH: v4++,
  // Landscape component reference between landscape component and collision component
  VER_UE4_LANDSCAPE_COMPONENT_LAZY_REFERENCES: v4++,
  // Refactored UK2Node_CallFunction to use FMemberReference
  VER_UE4_SWITCH_CALL_NODE_TO_USE_MEMBER_REFERENCE: v4++,
  // Added fixup step to remove skeleton class references from blueprint objects
  VER_UE4_ADDED_SKELETON_ARCHIVER_REMOVAL: v4++,
  // See above: v4++, take 2.
  VER_UE4_ADDED_SKELETON_ARCHIVER_REMOVAL_SECOND_TIME: v4++,
  // Making the skeleton class on blueprints transient
  VER_UE4_BLUEPRINT_SKEL_CLASS_TRANSIENT_AGAIN: v4++,
  // UClass knows if it's been cooked
  VER_UE4_ADD_COOKED_TO_UCLASS: v4++,
  // Deprecated static mesh thumbnail properties were removed
  VER_UE4_DEPRECATED_STATIC_MESH_THUMBNAIL_PROPERTIES_REMOVED: v4++,
  // Added collections in material shader map ids
  VER_UE4_COLLECTIONS_IN_SHADERMAPID: v4++,
  // Renamed some Movement Component properties: v4++, added PawnMovementComponent
  VER_UE4_REFACTOR_MOVEMENT_COMPONENT_HIERARCHY: v4++,
  // Swap UMaterialExpressionTerrainLayerSwitch::LayerUsed/LayerNotUsed the correct way round
  VER_UE4_FIX_TERRAIN_LAYER_SWITCH_ORDER: v4++,
  // Remove URB_ConstraintSetup
  VER_UE4_ALL_PROPS_TO_CONSTRAINTINSTANCE: v4++,
  // Low quality directional lightmaps
  VER_UE4_LOW_QUALITY_DIRECTIONAL_LIGHTMAPS: v4++,
  // Added NoiseEmitterComponent and removed related Pawn properties.
  VER_UE4_ADDED_NOISE_EMITTER_COMPONENT: v4++,
  // Add text component vertical alignment
  VER_UE4_ADD_TEXT_COMPONENT_VERTICAL_ALIGNMENT: v4++,
  // Added AssetImportData for FBX asset types: v4++, deprecating SourceFilePath and SourceFileTimestamp
  VER_UE4_ADDED_FBX_ASSET_IMPORT_DATA: v4++,
  // Remove LevelBodySetup from ULevel
  VER_UE4_REMOVE_LEVELBODYSETUP: v4++,
  // Refactor character crouching
  VER_UE4_REFACTOR_CHARACTER_CROUCH: v4++,
  // Trimmed down material shader debug information.
  VER_UE4_SMALLER_DEBUG_MATERIALSHADER_UNIFORM_EXPRESSIONS: v4++,
  // APEX Clothing
  VER_UE4_APEX_CLOTH: v4++,
  // Change Collision Channel to save only modified ones than all of them
  // @note!!! once we pass this CL: v4++, we can rename FCollisionResponseContainer enum values
  // we should rename to match ECollisionChannel
  VER_UE4_SAVE_COLLISIONRESPONSE_PER_CHANNEL: v4++,
  // Added Landscape Spline editor meshes
  VER_UE4_ADDED_LANDSCAPE_SPLINE_EDITOR_MESH: v4++,
  // Fixup input expressions for reading from refraction material attributes.
  VER_UE4_CHANGED_MATERIAL_REFACTION_TYPE: v4++,
  // Refactor projectile movement: v4++, along with some other movement component work.
  VER_UE4_REFACTOR_PROJECTILE_MOVEMENT: v4++,
  // Remove PhysicalMaterialProperty and replace with user defined enum
  VER_UE4_REMOVE_PHYSICALMATERIALPROPERTY: v4++,
  // Removed all compile outputs from FMaterial
  VER_UE4_PURGED_FMATERIAL_COMPILE_OUTPUTS: v4++,
  // Ability to save cooked PhysX meshes to Landscape
  VER_UE4_ADD_COOKED_TO_LANDSCAPE: v4++,
  // Change how input component consumption works
  VER_UE4_CONSUME_INPUT_PER_BIND: v4++,
  // Added new Graph based SoundClass Editor
  VER_UE4_SOUND_CLASS_GRAPH_EDITOR: v4++,
  // Fixed terrain layer node guids which was causing artifacts
  VER_UE4_FIXUP_TERRAIN_LAYER_NODES: v4++,
  // Added clamp min/max swap check to catch older materials
  VER_UE4_RETROFIT_CLAMP_EXPRESSIONS_SWAP: v4++,
  // Remove static/movable/stationary light classes
  VER_UE4_REMOVE_LIGHT_MOBILITY_CLASSES: v4++,
  // Refactor the way physics blending works to allow partial blending
  VER_UE4_REFACTOR_PHYSICS_BLENDING: v4++,
  // WorldLevelInfo: Added reference to parent level and streaming distance
  VER_UE4_WORLD_LEVEL_INFO_UPDATED: v4++,
  // Fixed cooking of skeletal/static meshes due to bad serialization logic
  VER_UE4_STATIC_SKELETAL_MESH_SERIALIZATION_FIX: v4++,
  // Removal of InterpActor and PhysicsActor
  VER_UE4_REMOVE_STATICMESH_MOBILITY_CLASSES: v4++,
  // Refactor physics transforms
  VER_UE4_REFACTOR_PHYSICS_TRANSFORMS: v4++,
  // Remove zero triangle sections from static meshes and compact material indices.
  VER_UE4_REMOVE_ZERO_TRIANGLE_SECTIONS: v4++,
  // Add param for deceleration in character movement instead of using acceleration.
  VER_UE4_CHARACTER_MOVEMENT_DECELERATION: v4++,
  // Made ACameraActor use a UCameraComponent for parameter storage: v4++, etc...
  VER_UE4_CAMERA_ACTOR_USING_CAMERA_COMPONENT: v4++,
  // Deprecated some pitch/roll properties in CharacterMovementComponent
  VER_UE4_CHARACTER_MOVEMENT_DEPRECATE_PITCH_ROLL: v4++,
  // Rebuild texture streaming data on load for uncooked builds
  VER_UE4_REBUILD_TEXTURE_STREAMING_DATA_ON_LOAD: v4++,
  // Add support for 32 bit index buffers for static meshes.
  VER_UE4_SUPPORT_32BIT_STATIC_MESH_INDICES: v4++,
  // Added streaming install ChunkID to AssetData and UPackage
  VER_UE4_ADDED_CHUNKID_TO_ASSETDATA_AND_UPACKAGE: v4++,
  // Add flag to control whether Character blueprints receive default movement bindings.
  VER_UE4_CHARACTER_DEFAULT_MOVEMENT_BINDINGS: v4++,
  // APEX Clothing LOD Info
  VER_UE4_APEX_CLOTH_LOD: v4++,
  // Added atmospheric fog texture data to be general
  VER_UE4_ATMOSPHERIC_FOG_CACHE_DATA: v4++,
  // Arrays serialize their inner's tags
  VAR_UE4_ARRAY_PROPERTY_INNER_TAGS: v4++,
  // Skeletal mesh index data is kept in memory in game to support mesh merging.
  VER_UE4_KEEP_SKEL_MESH_INDEX_DATA: v4++,
  // Added compatibility for the body instance collision change
  VER_UE4_BODYSETUP_COLLISION_CONVERSION: v4++,
  // Reflection capture cooking
  VER_UE4_REFLECTION_CAPTURE_COOKING: v4++,
  // Removal of DynamicTriggerVolume: v4++, DynamicBlockingVolume: v4++, DynamicPhysicsVolume
  VER_UE4_REMOVE_DYNAMIC_VOLUME_CLASSES: v4++,
  // Store an additional flag in the BodySetup to indicate whether there is any cooked data to load
  VER_UE4_STORE_HASCOOKEDDATA_FOR_BODYSETUP: v4++,
  // Changed name of RefractionBias to RefractionDepthBias.
  VER_UE4_REFRACTION_BIAS_TO_REFRACTION_DEPTH_BIAS: v4++,
  // Removal of SkeletalPhysicsActor
  VER_UE4_REMOVE_SKELETALPHYSICSACTOR: v4++,
  // PlayerController rotation input refactor
  VER_UE4_PC_ROTATION_INPUT_REFACTOR: v4++,
  // Landscape Platform Data cooking
  VER_UE4_LANDSCAPE_PLATFORMDATA_COOKING: v4++,
  // Added call for linking classes in CreateExport to ensure memory is initialized properly
  VER_UE4_CREATEEXPORTS_CLASS_LINKING_FOR_BLUEPRINTS: v4++,
  // Remove native component nodes from the blueprint SimpleConstructionScript
  VER_UE4_REMOVE_NATIVE_COMPONENTS_FROM_BLUEPRINT_SCS: v4++,
  // Removal of Single Node Instance
  VER_UE4_REMOVE_SINGLENODEINSTANCE: v4++,
  // Character movement braking changes
  VER_UE4_CHARACTER_BRAKING_REFACTOR: v4++,
  // Supported low quality lightmaps in volume samples
  VER_UE4_VOLUME_SAMPLE_LOW_QUALITY_SUPPORT: v4++,
  // Split bEnableTouchEvents out from bEnableClickEvents
  VER_UE4_SPLIT_TOUCH_AND_CLICK_ENABLES: v4++,
  // Health/Death refactor
  VER_UE4_HEALTH_DEATH_REFACTOR: v4++,
  // Moving USoundNodeEnveloper from UDistributionFloatConstantCurve to FRichCurve
  VER_UE4_SOUND_NODE_ENVELOPER_CURVE_CHANGE: v4++,
  // Moved SourceRadius to UPointLightComponent
  VER_UE4_POINT_LIGHT_SOURCE_RADIUS: v4++,
  // Scene capture actors based on camera actors.
  VER_UE4_SCENE_CAPTURE_CAMERA_CHANGE: v4++,
  // Moving SkeletalMesh shadow casting flag from LoD details to material
  VER_UE4_MOVE_SKELETALMESH_SHADOWCASTING: v4++,
  // Changing bytecode operators for creating arrays
  VER_UE4_CHANGE_SETARRAY_BYTECODE: v4++,
  // Material Instances overriding base material properties.
  VER_UE4_MATERIAL_INSTANCE_BASE_PROPERTY_OVERRIDES: v4++,
  // Combined top/bottom lightmap textures
  VER_UE4_COMBINED_LIGHTMAP_TEXTURES: v4++,
  // Forced material lightmass guids to be regenerated
  VER_UE4_BUMPED_MATERIAL_EXPORT_GUIDS: v4++,
  // Allow overriding of parent class input bindings
  VER_UE4_BLUEPRINT_INPUT_BINDING_OVERRIDES: v4++,
  // Fix up convex invalid transform
  VER_UE4_FIXUP_BODYSETUP_INVALID_CONVEX_TRANSFORM: v4++,
  // Fix up scale of physics stiffness and damping value
  VER_UE4_FIXUP_STIFFNESS_AND_DAMPING_SCALE: v4++,
  // Convert USkeleton and FBoneContrainer to using FReferenceSkeleton.
  VER_UE4_REFERENCE_SKELETON_REFACTOR: v4++,
  // Adding references to variable: v4++, function: v4++, and macro nodes to be able to update to renamed values
  VER_UE4_K2NODE_REFERENCEGUIDS: v4++,
  // Fix up the 0th bone's parent bone index.
  VER_UE4_FIXUP_ROOTBONE_PARENT: v4++,
  //Allow setting of TextRenderComponents size in world space.
  VER_UE4_TEXT_RENDER_COMPONENTS_WORLD_SPACE_SIZING: v4++,
  // Material Instances overriding base material properties #2.
  VER_UE4_MATERIAL_INSTANCE_BASE_PROPERTY_OVERRIDES_PHASE_2: v4++,
  // CLASS_Placeable becomes CLASS_NotPlaceable
  VER_UE4_CLASS_NOTPLACEABLE_ADDED: v4++,
  // Added LOD info list to a world tile description
  VER_UE4_WORLD_LEVEL_INFO_LOD_LIST: v4++,
  // CharacterMovement variable naming refactor
  VER_UE4_CHARACTER_MOVEMENT_VARIABLE_RENAMING_1: v4++,
  // FName properties containing sound names converted to FSlateSound properties
  VER_UE4_FSLATESOUND_CONVERSION: v4++,
  // Added ZOrder to a world tile description
  VER_UE4_WORLD_LEVEL_INFO_ZORDER: v4++,
  // Added flagging of localization gather requirement to packages
  VER_UE4_PACKAGE_REQUIRES_LOCALIZATION_GATHER_FLAGGING: v4++,
  // Preventing Blueprint Actor variables from having default values
  VER_UE4_BP_ACTOR_VARIABLE_DEFAULT_PREVENTING: v4++,
  // Preventing Blueprint Actor variables from having default values
  VER_UE4_TEST_ANIMCOMP_CHANGE: v4++,
  // Class as primary asset: v4++, name convention changed
  VER_UE4_EDITORONLY_BLUEPRINTS: v4++,
  // Custom serialization for FEdGraphPinType
  VER_UE4_EDGRAPHPINTYPE_SERIALIZATION: v4++,
  // Stop generating 'mirrored' cooked mesh for Brush and Model components
  VER_UE4_NO_MIRROR_BRUSH_MODEL_COLLISION: v4++,
  // Changed ChunkID to be an array of IDs.
  VER_UE4_CHANGED_CHUNKID_TO_BE_AN_ARRAY_OF_CHUNKIDS: v4++,
  // Worlds have been renamed from "TheWorld" to be named after the package containing them
  VER_UE4_WORLD_NAMED_AFTER_PACKAGE: v4++,
  // Added sky light component
  VER_UE4_SKY_LIGHT_COMPONENT: v4++,
  // Added Enable distance streaming flag to FWorldTileLayer
  VER_UE4_WORLD_LAYER_ENABLE_DISTANCE_STREAMING: v4++,
  // Remove visibility/zone information from UModel
  VER_UE4_REMOVE_ZONES_FROM_MODEL: v4++,
  // Fix base pose serialization 
  VER_UE4_FIX_ANIMATIONBASEPOSE_SERIALIZATION: v4++,
  // Support for up to 8 skinning influences per vertex on skeletal meshes (on non-gpu vertices)
  VER_UE4_SUPPORT_8_BONE_INFLUENCES_SKELETAL_MESHES: v4++,
  // Add explicit bOverrideGravity to world settings
  VER_UE4_ADD_OVERRIDE_GRAVITY_FLAG: v4++,
  // Support for up to 8 skinning influences per vertex on skeletal meshes (on gpu vertices)
  VER_UE4_SUPPORT_GPUSKINNING_8_BONE_INFLUENCES: v4++,
  // Supporting nonuniform scale animation
  VER_UE4_ANIM_SUPPORT_NONUNIFORM_SCALE_ANIMATION: v4++,
  // Engine version is stored as a FEngineVersion object rather than changelist number
  VER_UE4_ENGINE_VERSION_OBJECT: v4++,
  // World assets now have RF_Public
  VER_UE4_PUBLIC_WORLDS: v4++,
  // Skeleton Guid
  VER_UE4_SKELETON_GUID_SERIALIZATION: v4++,
  // Character movement WalkableFloor refactor
  VER_UE4_CHARACTER_MOVEMENT_WALKABLE_FLOOR_REFACTOR: v4++,
  // Lights default to inverse squared
  VER_UE4_INVERSE_SQUARED_LIGHTS_DEFAULT: v4++,
  // Disabled SCRIPT_LIMIT_BYTECODE_TO_64KB
  VER_UE4_DISABLED_SCRIPT_LIMIT_BYTECODE: v4++,
  // Made remote role private: v4++, exposed bReplicates
  VER_UE4_PRIVATE_REMOTE_ROLE: v4++,
  // Fix up old foliage components to have static mobility (superseded by VER_UE4_FOLIAGE_MOVABLE_MOBILITY)
  VER_UE4_FOLIAGE_STATIC_MOBILITY: v4++,
  // Change BuildScale from a float to a vector
  VER_UE4_BUILD_SCALE_VECTOR: v4++,
  // After implementing foliage collision: v4++, need to disable collision on old foliage instances
  VER_UE4_FOLIAGE_COLLISION: v4++,
  // Added sky bent normal to indirect lighting cache
  VER_UE4_SKY_BENT_NORMAL: v4++,
  // Added cooking for landscape collision data
  VER_UE4_LANDSCAPE_COLLISION_DATA_COOKING: v4++,
  // Convert CPU tangent Z delta to vector from PackedNormal since we don't get any benefit other than memory
  // we still convert all to FVector in CPU time whenever any calculation
  VER_UE4_MORPHTARGET_CPU_TANGENTZDELTA_FORMATCHANGE: v4++,
  // Soft constraint limits will implicitly use the mass of the bodies
  VER_UE4_SOFT_CONSTRAINTS_USE_MASS: v4++,
  // Reflection capture data saved in packages
  VER_UE4_REFLECTION_DATA_IN_PACKAGES: v4++,
  // Fix up old foliage components to have movable mobility (superseded by VER_UE4_FOLIAGE_STATIC_LIGHTING_SUPPORT)
  VER_UE4_FOLIAGE_MOVABLE_MOBILITY: v4++,
  // Undo BreakMaterialAttributes changes as it broke old content
  VER_UE4_UNDO_BREAK_MATERIALATTRIBUTES_CHANGE: v4++,
  // Now Default custom profile name isn't NONE anymore due to copy/paste not working properly with it
  VER_UE4_ADD_CUSTOMPROFILENAME_CHANGE: v4++,
  // Permanently flip and scale material expression coordinates
  VER_UE4_FLIP_MATERIAL_COORDS: v4++,
  // PinSubCategoryMemberReference added to FEdGraphPinType
  VER_UE4_MEMBERREFERENCE_IN_PINTYPE: v4++,
  // Vehicles use Nm for Torque instead of cm and RPM instead of rad/s
  VER_UE4_VEHICLES_UNIT_CHANGE: v4++,
  // removes NANs from all animations when loaded
  // now importing should detect NaNs: v4++, so we should not have NaNs in source data
  VER_UE4_ANIMATION_REMOVE_NANS: v4++,
  // Change skeleton preview attached assets property type
  VER_UE4_SKELETON_ASSET_PROPERTY_TYPE_CHANGE: v4++,
  // Fix some blueprint variables that have the CPF_DisableEditOnTemplate flag set
  // when they shouldn't
  VER_UE4_FIX_BLUEPRINT_VARIABLE_FLAGS: v4++,
  // Vehicles use Nm for Torque instead of cm and RPM instead of rad/s part two (missed conversion for some variables
  VER_UE4_VEHICLES_UNIT_CHANGE2: v4++,
  // Changed order of interface class serialization
  VER_UE4_UCLASS_SERIALIZE_INTERFACES_AFTER_LINKING: v4++,
  // Change from LOD distances to display factors
  VER_UE4_STATIC_MESH_SCREEN_SIZE_LODS: v4++,
  // Requires test of material coords to ensure they're saved correctly
  VER_UE4_FIX_MATERIAL_COORDS: v4++,
  // Changed SpeedTree wind presets to v7
  VER_UE4_SPEEDTREE_WIND_V7: v4++,
  // NeedsLoadForEditorGame added
  VER_UE4_LOAD_FOR_EDITOR_GAME: v4++,
  // Manual serialization of FRichCurveKey to save space
  VER_UE4_SERIALIZE_RICH_CURVE_KEY: v4++,
  // Change the outer of ULandscapeMaterialInstanceConstants and Landscape-related textures to the level in which they reside
  VER_UE4_MOVE_LANDSCAPE_MICS_AND_TEXTURES_WITHIN_LEVEL: v4++,
  // FTexts have creation history data: v4++, removed Key: v4++, Namespaces: v4++, and SourceString
  VER_UE4_FTEXT_HISTORY: v4++,
  // Shift comments to the left to contain expressions properly
  VER_UE4_FIX_MATERIAL_COMMENTS: v4++,
  // Bone names stored as FName means that we can't guarantee the correct case on export: v4++, now we store a separate string for export purposes only
  VER_UE4_STORE_BONE_EXPORT_NAMES: v4++,
  // changed mesh emitter initial orientation to distribution
  VER_UE4_MESH_EMITTER_INITIAL_ORIENTATION_DISTRIBUTION: v4++,
  // Foliage on blueprints causes crashes
  VER_UE4_DISALLOW_FOLIAGE_ON_BLUEPRINTS: v4++,
  // change motors to use revolutions per second instead of rads/second
  VER_UE4_FIXUP_MOTOR_UNITS: v4++,
  // deprecated MovementComponent functions including "ModifiedMaxSpeed" et al
  VER_UE4_DEPRECATED_MOVEMENTCOMPONENT_MODIFIED_SPEEDS: v4++,
  // rename CanBeCharacterBase
  VER_UE4_RENAME_CANBECHARACTERBASE: v4++,
  // Change GameplayTagContainers to have FGameplayTags instead of FNames; Required to fix-up native serialization
  VER_UE4_GAMEPLAY_TAG_CONTAINER_TAG_TYPE_CHANGE: v4++,
  // Change from UInstancedFoliageSettings to UFoliageType: v4++, and change the api from being keyed on UStaticMesh* to UFoliageType*
  VER_UE4_FOLIAGE_SETTINGS_TYPE: v4++,
  // Lights serialize static shadow depth maps
  VER_UE4_STATIC_SHADOW_DEPTH_MAPS: v4++,
  // Add RF_Transactional to data assets: v4++, fixing undo problems when editing them
  VER_UE4_ADD_TRANSACTIONAL_TO_DATA_ASSETS: v4++,
  // Change LB_AlphaBlend to LB_WeightBlend in ELandscapeLayerBlendType
  VER_UE4_ADD_LB_WEIGHTBLEND: v4++,
  // Add root component to an foliage actor: v4++, all foliage cluster components will be attached to a root
  VER_UE4_ADD_ROOTCOMPONENT_TO_FOLIAGEACTOR: v4++,
  // FMaterialInstanceBasePropertyOverrides didn't use proper UObject serialize
  VER_UE4_FIX_MATERIAL_PROPERTY_OVERRIDE_SERIALIZE: v4++,
  // Addition of linear color sampler. color sample type is changed to linear sampler if source texture !sRGB
  VER_UE4_ADD_LINEAR_COLOR_SAMPLER: v4++,
  // Added StringAssetReferencesMap to support renames of FStringAssetReference properties.
  VER_UE4_ADD_STRING_ASSET_REFERENCES_MAP: v4++,
  // Apply scale from SCS RootComponent details in the Blueprint Editor to new actor instances at construction time
  VER_UE4_BLUEPRINT_USE_SCS_ROOTCOMPONENT_SCALE: v4++,
  // Changed level streaming to have a linear color since the visualization doesn't gamma correct.
  VER_UE4_LEVEL_STREAMING_DRAW_COLOR_TYPE_CHANGE: v4++,
  // Cleared end triggers from non-state anim notifies
  VER_UE4_CLEAR_NOTIFY_TRIGGERS: v4++,
  // Convert old curve names stored in anim assets into skeleton smartnames
  VER_UE4_SKELETON_ADD_SMARTNAMES: v4++,
  // Added the currency code field to FTextHistory_AsCurrency
  VER_UE4_ADDED_CURRENCY_CODE_TO_FTEXT: v4++,
  // Added support for C++11 enum classes
  VER_UE4_ENUM_CLASS_SUPPORT: v4++,
  // Fixup widget animation class
  VER_UE4_FIXUP_WIDGET_ANIMATION_CLASS: v4++,
  // USoundWave objects now contain details about compression scheme used.
  VER_UE4_SOUND_COMPRESSION_TYPE_ADDED: v4++,
  // Bodies will automatically weld when attached
  VER_UE4_AUTO_WELDING: v4++,
  // Rename UCharacterMovementComponent::bCrouchMovesCharacterDown
  VER_UE4_RENAME_CROUCHMOVESCHARACTERDOWN: v4++,
  // Lightmap parameters in FMeshBuildSettings
  VER_UE4_LIGHTMAP_MESH_BUILD_SETTINGS: v4++,
  // Rename SM3 to ES3_1 and updates featurelevel material node selector
  VER_UE4_RENAME_SM3_TO_ES3_1: v4++,
  // Deprecated separate style assets for use in UMG
  VER_UE4_DEPRECATE_UMG_STYLE_ASSETS: v4++,
  // Duplicating Blueprints will regenerate NodeGuids after this version
  VER_UE4_POST_DUPLICATE_NODE_GUID: v4++,
  // Rename USpringArmComponent::bUseControllerViewRotation to bUsePawnViewRotation: v4++,
  // Rename UCameraComponent::bUseControllerViewRotation to bUsePawnViewRotation (and change the default value)
  VER_UE4_RENAME_CAMERA_COMPONENT_VIEW_ROTATION: v4++,
  // Changed FName to be case preserving
  VER_UE4_CASE_PRESERVING_FNAME: v4++,
  // Rename USpringArmComponent::bUsePawnViewRotation to bUsePawnControlRotation
  // Rename UCameraComponent::bUsePawnViewRotation to bUsePawnControlRotation
  VER_UE4_RENAME_CAMERA_COMPONENT_CONTROL_ROTATION: v4++,
  // Fix bad refraction material attribute masks
  VER_UE4_FIX_REFRACTION_INPUT_MASKING: v4++,
  // A global spawn rate for emitters.
  VER_UE4_GLOBAL_EMITTER_SPAWN_RATE_SCALE: v4++,
  // Cleanup destructible mesh settings
  VER_UE4_CLEAN_DESTRUCTIBLE_SETTINGS: v4++,
  // CharacterMovementComponent refactor of AdjustUpperHemisphereImpact and deprecation of some associated vars.
  VER_UE4_CHARACTER_MOVEMENT_UPPER_IMPACT_BEHAVIOR: v4++,
  // Changed Blueprint math equality functions for vectors and rotators to operate as a "nearly" equals rather than "exact"
  VER_UE4_BP_MATH_VECTOR_EQUALITY_USES_EPSILON: v4++,
  // Static lighting support was re-added to foliage: v4++, and mobility was returned to static
  VER_UE4_FOLIAGE_STATIC_LIGHTING_SUPPORT: v4++,
  // Added composite fonts to Slate font info
  VER_UE4_SLATE_COMPOSITE_FONTS: v4++,
  // Remove UDEPRECATED_SaveGameSummary: v4++, required for UWorld::Serialize
  VER_UE4_REMOVE_SAVEGAMESUMMARY: v4++,

  //Remove bodyseutp serialization from skeletal mesh component
  VER_UE4_REMOVE_SKELETALMESH_COMPONENT_BODYSETUP_SERIALIZATION: v4++,
  // Made Slate font data use bulk data to store the embedded font data
  VER_UE4_SLATE_BULK_FONT_DATA: v4++,
  // Add new friction behavior in ProjectileMovementComponent.
  VER_UE4_ADD_PROJECTILE_FRICTION_BEHAVIOR: v4++,
  // Add axis settings enum to MovementComponent.
  VER_UE4_MOVEMENTCOMPONENT_AXIS_SETTINGS: v4++,
  // Switch to new interactive comments: v4++, requires boundry conversion to preserve previous states
  VER_UE4_GRAPH_INTERACTIVE_COMMENTBUBBLES: v4++,
  // Landscape serializes physical materials for collision objects 
  VER_UE4_LANDSCAPE_SERIALIZE_PHYSICS_MATERIALS: v4++,
  // Rename Visiblity on widgets to Visibility
  VER_UE4_RENAME_WIDGET_VISIBILITY: v4++,
  // add track curves for animation
  VER_UE4_ANIMATION_ADD_TRACKCURVES: v4++,
  // Removed BranchingPoints from AnimMontages and converted them to regular AnimNotifies.
  VER_UE4_MONTAGE_BRANCHING_POINT_REMOVAL: v4++,
  // Enforce const-correctness in Blueprint implementations of native C++ const class methods
  VER_UE4_BLUEPRINT_ENFORCE_CONST_IN_FUNCTION_OVERRIDES: v4++,
  // Added pivot to widget components: v4++, need to load old versions as a 0: v4++,0 pivot: v4++, new default is 0.5: v4++,0.5
  VER_UE4_ADD_PIVOT_TO_WIDGET_COMPONENT: v4++,
  // Added finer control over when AI Pawns are automatically possessed. Also renamed Pawn.AutoPossess to Pawn.AutoPossessPlayer indicate this was a setting for players and not AI.
  VER_UE4_PAWN_AUTO_POSSESS_AI: v4++,
  // Added serialization of timezone to FTextHistory for AsDate operations.
  VER_UE4_FTEXT_HISTORY_DATE_TIMEZONE: v4++,
  // Sort ActiveBoneIndices on lods so that we can avoid doing it at run time
  VER_UE4_SORT_ACTIVE_BONE_INDICES: v4++,
  // Added per-frame material uniform expressions
  VER_UE4_PERFRAME_MATERIAL_UNIFORM_EXPRESSIONS: v4++,
  // Make MikkTSpace the default tangent space calculation method for static meshes.
  VER_UE4_MIKKTSPACE_IS_DEFAULT: v4++,
  // Only applies to cooked files: v4++, grass cooking support.
  VER_UE4_LANDSCAPE_GRASS_COOKING: v4++,
  // Fixed code for using the bOrientMeshEmitters property.
  VER_UE4_FIX_SKEL_VERT_ORIENT_MESH_PARTICLES: v4++,
  // Do not change landscape section offset on load under world composition
  VER_UE4_LANDSCAPE_STATIC_SECTION_OFFSET: v4++,
  // New options for navigation data runtime generation (static: v4++, modifiers only: v4++, dynamic)
  VER_UE4_ADD_MODIFIERS_RUNTIME_GENERATION: v4++,
  // Tidied up material's handling of masked blend mode.
  VER_UE4_MATERIAL_MASKED_BLENDMODE_TIDY: v4++,
  // Original version of VER_UE4_MERGED_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7; renumbered to prevent blocking promotion in main.
  VER_UE4_MERGED_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7_DEPRECATED: v4++,
  // Original version of VER_UE4_AFTER_MERGED_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7; renumbered to prevent blocking promotion in main.
  VER_UE4_AFTER_MERGED_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7_DEPRECATED: v4++,
  // After merging VER_UE4_ADD_MODIFIERS_RUNTIME_GENERATION into 4.7 branch
  VER_UE4_MERGED_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7: v4++,
  // After merging VER_UE4_ADD_MODIFIERS_RUNTIME_GENERATION into 4.7 branch
  VER_UE4_AFTER_MERGING_ADD_MODIFIERS_RUNTIME_GENERATION_TO_4_7: v4++,
  // Landscape grass weightmap data is now generated in the editor and serialized.
  VER_UE4_SERIALIZE_LANDSCAPE_GRASS_DATA: v4++,
  // New property to optionally prevent gpu emitters clearing existing particles on Init().
  VER_UE4_OPTIONALLY_CLEAR_GPU_EMITTERS_ON_INIT: v4++,
  // Also store the Material guid with the landscape grass data
  VER_UE4_SERIALIZE_LANDSCAPE_GRASS_DATA_MATERIAL_GUID: v4++,
  // Make sure that all template components from blueprint generated classes are flagged as public
  VER_UE4_BLUEPRINT_GENERATED_CLASS_COMPONENT_TEMPLATES_PUBLIC: v4++,
  // Split out creation method on ActorComponents to distinguish between native: v4++, instance: v4++, and simple or user construction script
  VER_UE4_ACTOR_COMPONENT_CREATION_METHOD: v4++,
  // K2Node_Event now uses FMemberReference for handling references
  VER_UE4_K2NODE_EVENT_MEMBER_REFERENCE: v4++,
  // FPropertyTag stores GUID of struct
  VER_UE4_STRUCT_GUID_IN_PROPERTY_TAG: v4++,
  // Remove unused UPolys from UModel cooked content
  VER_UE4_REMOVE_UNUSED_UPOLYS_FROM_UMODEL: v4++,
  // This doesn't do anything except trigger a rebuild on HISMC cluster trees: v4++, in this case to get a good "occlusion query" level
  VER_UE4_REBUILD_HIERARCHICAL_INSTANCE_TREES: v4++,
  // Package summary includes an CompatibleWithEngineVersion field: v4++, separately to the version it's saved with
  VER_UE4_PACKAGE_SUMMARY_HAS_COMPATIBLE_ENGINE_VERSION: v4++,
  // Track UCS modified properties on Actor Components
  VER_UE4_TRACK_UCS_MODIFIED_PROPERTIES: v4++,
  // Allowed landscape spline meshes to be stored into landscape streaming levels rather than the spline's level
  VER_UE4_LANDSCAPE_SPLINE_CROSS_LEVEL_MESHES: v4++,
  // Deprecate the variables used for sizing in the designer on UUserWidget
  VER_UE4_DEPRECATE_USER_WIDGET_DESIGN_SIZE: v4++,
  // Make the editor views array dynamically sized
  VER_UE4_ADD_EDITOR_VIEWS: v4++,
  // Updated foliage to work with either FoliageType assets or blueprint classes
  VER_UE4_FOLIAGE_WITH_ASSET_OR_CLASS: v4++,
  // Allows PhysicsSerializer to serialize shapes and actors for faster load times
  VER_UE4_BODYINSTANCE_BINARY_SERIALIZATION: v4++,
  // Added fastcall data serialization directly in UFunction
  VER_UE4_SERIALIZE_BLUEPRINT_EVENTGRAPH_FASTCALLS_IN_UFUNCTION: v4++,
  // Changes to USplineComponent and FInterpCurve
  VER_UE4_INTERPCURVE_SUPPORTS_LOOPING: v4++,
  // Material Instances overriding base material LOD transitions
  VER_UE4_MATERIAL_INSTANCE_BASE_PROPERTY_OVERRIDES_DITHERED_LOD_TRANSITION: v4++,
  // Serialize ES2 textures separately rather than overwriting the properties used on other platforms
  VER_UE4_SERIALIZE_LANDSCAPE_ES2_TEXTURES: v4++,
  // Constraint motor velocity is broken into per-component
  VER_UE4_CONSTRAINT_INSTANCE_MOTOR_FLAGS: v4++,
  // Serialize bIsConst in FEdGraphPinType
  VER_UE4_SERIALIZE_PINTYPE_CONST: v4++,
  // Change UMaterialFunction::LibraryCategories to LibraryCategoriesText (old assets were saved before auto-conversion of FArrayProperty was possible)
  VER_UE4_LIBRARY_CATEGORIES_AS_FTEXT: v4++,
  // Check for duplicate exports while saving packages.
  VER_UE4_SKIP_DUPLICATE_EXPORTS_ON_SAVE_PACKAGE: v4++,
  // Pre-gathering of gatherable: v4++, localizable text in packages to optimize text gathering operation times
  VER_UE4_SERIALIZE_TEXT_IN_PACKAGES: v4++,
  // Added pivot to widget components: v4++, need to load old versions as a 0: v4++,0 pivot: v4++, new default is 0.5: v4++,0.5
  VER_UE4_ADD_BLEND_MODE_TO_WIDGET_COMPONENT: v4++,
  // Added lightmass primitive setting
  VER_UE4_NEW_LIGHTMASS_PRIMITIVE_SETTING: v4++,
  // Deprecate NoZSpring property on spring nodes to be replaced with TranslateZ property
  VER_UE4_REPLACE_SPRING_NOZ_PROPERTY: v4++,
  // Keep enums tight and serialize their values as pairs of FName and value. Don't insert dummy values.
  VER_UE4_TIGHTLY_PACKED_ENUMS: v4++,
  // Changed Asset import data to serialize file meta data as JSON
  VER_UE4_ASSET_IMPORT_DATA_AS_JSON: v4++,
  // Legacy gamma support for textures.
  VER_UE4_TEXTURE_LEGACY_GAMMA: v4++,
  // Added WithSerializer for basic native structures like FVector: v4++, FColor etc to improve serialization performance
  VER_UE4_ADDED_NATIVE_SERIALIZATION_FOR_IMMUTABLE_STRUCTURES: v4++,
  // Deprecated attributes that override the style on UMG widgets
  VER_UE4_DEPRECATE_UMG_STYLE_OVERRIDES: v4++,
  // Shadowmap penumbra size stored
  VER_UE4_STATIC_SHADOWMAP_PENUMBRA_SIZE: v4++,
  // Fix BC on Niagara effects from the data object and dev UI changes.
  VER_UE4_NIAGARA_DATA_OBJECT_DEV_UI_FIX: v4++,
  // Fixed the default orientation of widget component so it faces down +x
  VER_UE4_FIXED_DEFAULT_ORIENTATION_OF_WIDGET_COMPONENT: v4++,
  // Removed bUsedWithUI flag from UMaterial and replaced it with a new material domain for UI
  VER_UE4_REMOVED_MATERIAL_USED_WITH_UI_FLAG: v4++,
  // Added braking friction separate from turning friction.
  VER_UE4_CHARACTER_MOVEMENT_ADD_BRAKING_FRICTION: v4++,
  // Removed TTransArrays from UModel
  VER_UE4_BSP_UNDO_FIX: v4++,
  // Added default value to dynamic parameter.
  VER_UE4_DYNAMIC_PARAMETER_DEFAULT_VALUE: v4++,
  // Added ExtendedBounds to StaticMesh
  VER_UE4_STATIC_MESH_EXTENDED_BOUNDS: v4++,
  // Added non-linear blending to anim transitions: v4++, deprecating old types
  VER_UE4_ADDED_NON_LINEAR_TRANSITION_BLENDS: v4++,
  // AO Material Mask texture
  VER_UE4_AO_MATERIAL_MASK: v4++,
  // Replaced navigation agents selection with single structure
  VER_UE4_NAVIGATION_AGENT_SELECTOR: v4++,
  // Mesh particle collisions consider particle size.
  VER_UE4_MESH_PARTICLE_COLLISIONS_CONSIDER_PARTICLE_SIZE: v4++,
  // Adjacency buffer building no longer automatically handled based on triangle count: v4++, user-controlled
  VER_UE4_BUILD_MESH_ADJ_BUFFER_FLAG_EXPOSED: v4++,
  // Change the default max angular velocity
  VER_UE4_MAX_ANGULAR_VELOCITY_DEFAULT: v4++,
  // Build Adjacency index buffer for clothing tessellation
  VER_UE4_APEX_CLOTH_TESSELLATION: v4++,
  // Added DecalSize member: v4++, solved backward compatibility
  VER_UE4_DECAL_SIZE: v4++,
  // Keep only package names in StringAssetReferencesMap
  VER_UE4_KEEP_ONLY_PACKAGE_NAMES_IN_STRING_ASSET_REFERENCES_MAP: v4++,
  // Support sound cue not saving out editor only data
  VER_UE4_COOKED_ASSETS_IN_EDITOR_SUPPORT: v4++,
  // Updated dialogue wave localization gathering logic.
  VER_UE4_DIALOGUE_WAVE_NAMESPACE_AND_CONTEXT_CHANGES: v4++,
  // Renamed MakeRot MakeRotator and rearranged parameters.
  VER_UE4_MAKE_ROT_RENAME_AND_REORDER: v4++,
  // K2Node_Variable will properly have the VariableReference Guid set if available
  VER_UE4_K2NODE_VAR_REFERENCEGUIDS: v4++,
  // Added support for sound concurrency settings structure and overrides
  VER_UE4_SOUND_CONCURRENCY_PACKAGE: v4++,
  // Changing the default value for focusable user widgets to false
  VER_UE4_USERWIDGET_DEFAULT_FOCUSABLE_FALSE: v4++,
  // Custom event nodes implicitly set 'const' on array and non-array pass-by-reference input params
  VER_UE4_BLUEPRINT_CUSTOM_EVENT_CONST_INPUT: v4++,
  // Renamed HighFrequencyGain to LowPassFilterFrequency
  VER_UE4_USE_LOW_PASS_FILTER_FREQ: v4++,
  // UAnimBlueprintGeneratedClass can be replaced by a dynamic class. Use TSubclassOf<UAnimInstance> instead.
  VER_UE4_NO_ANIM_BP_CLASS_IN_GAMEPLAY_CODE: v4++,
  // The SCS keeps a list of all nodes in its hierarchy rather than recursively building it each time it is requested
  VER_UE4_SCS_STORES_ALLNODES_ARRAY: v4++,
  // Moved StartRange and EndRange in UFbxAnimSequenceImportData to use FInt32Interval
  VER_UE4_FBX_IMPORT_DATA_RANGE_ENCAPSULATION: v4++,
  // Adding a new root scene component to camera component
  VER_UE4_CAMERA_COMPONENT_ATTACH_TO_ROOT: v4++,
  // Updating custom material expression nodes for instanced stereo implementation
  VER_UE4_INSTANCED_STEREO_UNIFORM_UPDATE: v4++,
  // Texture streaming min and max distance to handle HLOD
  VER_UE4_STREAMABLE_TEXTURE_MIN_MAX_DISTANCE: v4++,
  // Fixing up invalid struct-to-struct pin connections by injecting available conversion nodes
  VER_UE4_INJECT_BLUEPRINT_STRUCT_PIN_CONVERSION_NODES: v4++,
  // Saving tag data for Array Property's inner property
  VER_UE4_INNER_ARRAY_TAG_INFO: v4++,
  // Fixed duplicating slot node names in skeleton due to skeleton preload on compile
  VER_UE4_FIX_SLOT_NAME_DUPLICATION: v4++,
  // Texture streaming using AABBs instead of Spheres
  VER_UE4_STREAMABLE_TEXTURE_AABB: v4++,
  // FPropertyTag stores GUID of property
  VER_UE4_PROPERTY_GUID_IN_PROPERTY_TAG: v4++,
  // Name table hashes are calculated and saved out rather than at load time
  VER_UE4_NAME_HASHES_SERIALIZED: v4++,
  // Updating custom material expression nodes for instanced stereo implementation refactor
  VER_UE4_INSTANCED_STEREO_UNIFORM_REFACTOR: v4++,
  // Added compression to the shader resource for memory savings
  VER_UE4_COMPRESSED_SHADER_RESOURCES: v4++,
  // Cooked files contain the dependency graph for the event driven loader (the serialization is largely independent of the use of the new loader)
  VER_UE4_PRELOAD_DEPENDENCIES_IN_COOKED_EXPORTS: v4++,
  // Cooked files contain the TemplateIndex used by the event driven loader (the serialization is largely independent of the use of the new loader: v4++, i.e. this will be null if cooking for the old loader)
  VER_UE4_TemplateIndex_IN_COOKED_EXPORTS: v4++,
  // FPropertyTag includes contained type(s) for Set and Map properties:
  VER_UE4_PROPERTY_TAG_SET_MAP_SUPPORT: v4++,
  // Added SearchableNames to the package summary and asset registry
  VER_UE4_ADDED_SEARCHABLE_NAMES: v4++,
  // Increased size of SerialSize and SerialOffset in export map entries to 64 bit: v4++, allow support for bigger files
  VER_UE4_64BIT_EXPORTMAP_SERIALSIZES: v4++,
  // Sky light stores IrradianceMap for mobile renderer.
  VER_UE4_SKYLIGHT_MOBILE_IRRADIANCE_MAP: v4++,
  // Added flag to control sweep behavior while walking in UCharacterMovementComponent.
  VER_UE4_ADDED_SWEEP_WHILE_WALKING_FLAG: v4++,
  // StringAssetReference changed to SoftObjectPath and swapped to serialize as a name+string instead of a string
  VER_UE4_ADDED_SOFT_OBJECT_PATH: v4++,
  // Changed the source orientation of point lights to match spot lights (z axis)
  VER_UE4_POINTLIGHT_SOURCE_ORIENTATION: v4++,
  // LocalizationId has been added to the package summary (editor-only)
  VER_UE4_ADDED_PACKAGE_SUMMARY_LOCALIZATION_ID: v4++,
  // Fixed case insensitive hashes of wide strings containing character values from 128-255
  VER_UE4_FIX_WIDE_STRING_CRC: v4++,
  // Added package owner to allow private references
  VER_UE4_ADDED_PACKAGE_OWNER: v4++,
  // Changed the data layout for skin weight profile data
  VER_UE4_SKINWEIGHT_PROFILE_DATA_LAYOUT_CHANGES: v4++,
  // Added import that can have package different than their outer
  VER_UE4_NON_OUTER_PACKAGE_IMPORT: v4++,
  // Added DependencyFlags to AssetRegistry
  VER_UE4_ASSETREGISTRY_DEPENDENCYFLAGS: v4++,
  // Fixed corrupt licensee flag in 4.26 assets
  VER_UE4_CORRECT_LICENSEE_FLAG: v4++
};
console.log(UE4ObjectVersion)