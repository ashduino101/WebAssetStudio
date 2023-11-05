import {DateTime, Decimal, ExternalReference, TimeSpan} from "./types/system";
import {
  BoundingBox, BoundingFrustum,
  BoundingSphere,
  Color, Curve,
  Matrix,
  Plane,
  Point,
  Quaternion, Ray,
  Rectangle,
  Vector2,
  Vector3,
  Vector4
} from "./types/math";
import {
  AlphaTestEffect,
  BasicEffect, DualTextureEffect,
  Effect, EffectMaterial, EnvironmentMapEffect,
  IndexBuffer, Model, SkinnedEffect, SpriteFont,
  Texture,
  Texture2D,
  Texture3D,
  TextureCube,
  VertexBuffer,
  VertexDeclaration
} from "./types/graphics";
import {Song, SoundEffect, Video} from "./types/media";

export const typeReaders = {
  'Microsoft.Xna.Framework.Content.TimeSpanReader': [TimeSpan, 'TimeSpan'],
  'Microsoft.Xna.Framework.Content.DateTimeReader': [DateTime, 'DateTime'],
  'Microsoft.Xna.Framework.Content.DecimalReader': [Decimal, 'Decimal'],
  'Microsoft.Xna.Framework.Content.ExternalReferenceReader': [ExternalReference, 'ExternalReference'],
  'Microsoft.Xna.Framework.Content.Vector2Reader': [Vector2, 'Vector2'],
  'Microsoft.Xna.Framework.Content.Vector3Reader': [Vector3, 'Vector3'],
  'Microsoft.Xna.Framework.Content.Vector4Reader': [Vector4, 'Vector4'],
  'Microsoft.Xna.Framework.Content.MatrixReader': [Matrix, 'Matrix'],
  'Microsoft.Xna.Framework.Content.QuaternionReader': [Quaternion, 'Quaternion'],
  'Microsoft.Xna.Framework.Content.ColorReader': [Color, 'Color'],
  'Microsoft.Xna.Framework.Content.PlaneReader': [Plane, 'Plane'],
  'Microsoft.Xna.Framework.Content.PointReader': [Point, 'Point'],
  'Microsoft.Xna.Framework.Content.RectangleReader': [Rectangle, 'Rectangle'],
  'Microsoft.Xna.Framework.Content.BoundingBoxReader': [BoundingBox, 'BoundingBox'],
  'Microsoft.Xna.Framework.Content.BoundingSphereReader': [BoundingSphere, 'BoundingSphere'],
  'Microsoft.Xna.Framework.Content.BoundingFrustumReader': [BoundingFrustum, 'BoundingFrustum'],
  'Microsoft.Xna.Framework.Content.RayReader': [Ray, 'Ray'],
  'Microsoft.Xna.Framework.Content.CurveReader': [Curve, 'Curve'],
  'Microsoft.Xna.Framework.Content.TextureReader': [Texture, 'Texture'],
  'Microsoft.Xna.Framework.Content.Texture2DReader': [Texture2D, 'Texture2D'],
  'Microsoft.Xna.Framework.Content.Texture3DReader': [Texture3D, 'Texture3D'],
  'Microsoft.Xna.Framework.Content.TextureCubeReader': [TextureCube, 'TextureCube'],
  'Microsoft.Xna.Framework.Content.IndexBufferReader': [IndexBuffer, 'IndexBuffer'],
  'Microsoft.Xna.Framework.Content.VertexBufferReader': [VertexBuffer, 'VertexBuffer'],
  'Microsoft.Xna.Framework.Content.VertexDeclarationReader': [VertexDeclaration, 'VertexDeclaration'],
  'Microsoft.Xna.Framework.Content.EffectReader': [Effect, 'Effect'],
  'Microsoft.Xna.Framework.Content.EffectMaterialReader': [EffectMaterial, 'EffectMaterial'],
  'Microsoft.Xna.Framework.Content.BasicEffectReader': [BasicEffect, 'BasicEffect'],
  'Microsoft.Xna.Framework.Content.AlphaTestEffectReader': [AlphaTestEffect, 'AlphaTestEffect'],
  'Microsoft.Xna.Framework.Content.DualTextureEffectReader': [DualTextureEffect, 'DualTextureEffect'],
  'Microsoft.Xna.Framework.Content.EnvironmentMapEffectReader': [EnvironmentMapEffect, 'EnvironmentMapEffect'],
  'Microsoft.Xna.Framework.Content.SkinnedEffectReader': [SkinnedEffect, 'SkinnedEffect'],
  'Microsoft.Xna.Framework.Content.SpriteFontReader': [SpriteFont, 'SpriteFont'],
  'Microsoft.Xna.Framework.Content.ModelReader': [Model, 'Model'],
  'Microsoft.Xna.Framework.Content.SoundEffectReader': [SoundEffect, 'SoundEffect'],
  'Microsoft.Xna.Framework.Content.SongReader': [Song, 'Song'],
  'Microsoft.Xna.Framework.Content.VideoReader': [Video, 'Video']
}

export const typeNames = [];
for (let name in typeReaders) {
  typeNames.push(name);
}
