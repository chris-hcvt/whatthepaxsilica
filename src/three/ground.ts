import * as THREE from 'three';

/**
 * Close-up ground detail. The satellite image is about 12 m per pixel, which turns into a smooth blur
 * when the camera is a few hundred metres away. Near the camera this sharpens the image a little and
 * adds tiling fine-grained variation (grass, soil) at 30 m, 5 m and 2.4 m scales; it fades out with
 * distance, so the wide views are unchanged.
 */
export function addGroundDetail(material: THREE.MeshLambertMaterial) {
  const detail = detailTexture();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDetail = { value: detail };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGroundXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uDetail;\nvarying vec2 vGroundXZ;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          float gNear = 1.0 - smoothstep( 0.45, 1.9, length( vViewPosition ) );
          if ( gNear > 0.001 ) {
            vec2 px = 1.0 / vec2( textureSize( map, 0 ) );
            vec3 blur = ( texture2D( map, vMapUv + vec2( px.x, 0.0 ) ).rgb + texture2D( map, vMapUv - vec2( px.x, 0.0 ) ).rgb
              + texture2D( map, vMapUv + vec2( 0.0, px.y ) ).rgb + texture2D( map, vMapUv - vec2( 0.0, px.y ) ).rgb ) * 0.25;
            sampledDiffuseColor.rgb = max( sampledDiffuseColor.rgb + ( sampledDiffuseColor.rgb - blur ) * 0.7 * gNear, 0.0 );
            float a = texture2D( uDetail, vGroundXZ * 33.0 ).r;
            float b = texture2D( uDetail, vGroundXZ * 190.0 ).g;
            float c = texture2D( uDetail, vGroundXZ * 420.0 ).b;
            float n = ( a - 0.5 ) * 0.18 + ( b - 0.5 ) * 0.42 + ( c - 0.5 ) * 0.36;
            // a touch of warm soil in the darker patches, brighter grass in the lighter ones
            vec3 tint = mix( vec3( 1.06, 0.98, 0.86 ), vec3( 0.94, 1.05, 0.9 ), smoothstep( -0.15, 0.15, n ) );
            sampledDiffuseColor.rgb *= mix( vec3( 1.0 ), tint * ( 1.0 + n ), gNear );
          }
          diffuseColor *= sampledDiffuseColor;
        #endif`,
      );
  };
  material.customProgramCacheKey = () => 'ground-detail-v1';
}

/** 256 px tileable value noise: R = blotches, G = medium grain, B = fine grain (each channel tiles on its own) */
function detailTexture() {
  const S = 256;
  const data = new Uint8Array(S * S * 4);
  let seed = 99;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const layer = (cells: number) => {
    const lat = Array.from({ length: cells * cells }, rnd);
    const at = (i: number, j: number) => lat[((j % cells) + cells) % cells * cells + (((i % cells) + cells) % cells)];
    return (x: number, y: number) => {
      const fx = (x / S) * cells;
      const fy = (y / S) * cells;
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const tx = fx - i;
      const ty = fy - j;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
      const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const r1 = layer(4);
  const r2 = layer(8);
  const g1 = layer(16);
  const g2 = layer(32);
  const b1 = layer(64);
  const b2 = layer(128);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const k = (y * S + x) * 4;
      data[k] = Math.round((r1(x, y) * 0.65 + r2(x, y) * 0.35) * 255);
      data[k + 1] = Math.round((g1(x, y) * 0.6 + g2(x, y) * 0.4) * 255);
      data[k + 2] = Math.round((b1(x, y) * 0.55 + b2(x, y) * 0.45) * 255);
      data[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}
