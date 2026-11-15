import * as THREE from "three";

// Every scene is built here as plain three.js objects and handed to Stage.tsx, which
// owns the renderer, the camera framing, the drag interaction and the cleanup.
//
// Framing rule: each scene reports `radius`, the radius of a sphere that contains it
// at every rotation. Stage places the camera so that sphere always fits, which is
// why nothing in these scenes can be cut off at the edge of its canvas.

export type SceneKind =
  | "armillary"
  | "globe"
  | "neural"
  | "gears"
  | "bars"
  | "shield"
  | "stack"
  | "scales"
  | "helix"
  | "containers"
  | "bag"
  | "book"
  | "cap"
  | "turbine"
  | "briefcase";

export type Built = {
  root: THREE.Group;
  /** Radius of a sphere that contains the whole scene at any rotation. */
  radius: number;
  /** Idle turn around the vertical axis, in radians per second. 0 for scenes that sway instead. */
  spin: number;
  /** Camera elevation above the horizon, in radians. */
  elev?: number;
  /** Soft shadows between the parts (rings onto the globe, and so on). */
  shadows?: boolean;
  /** Fixed lean of the whole scene toward the viewer, in radians. */
  tilt?: number;
  update?: (dt: number, t: number) => void;
};

export type Ctx = { glow: THREE.Texture };

export const BRASS = 0xc39a4b;
export const BRASS_DEEP = 0x8d6a2b;
export const BRASS_HI = 0xf1d9a0;
export const NAVY = 0x10243b;
export const SKY = 0x6f9bd6;

export const deg = (d: number) => THREE.MathUtils.degToRad(d);

export function makeGlow() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,240,200,1)");
  grad.addColorStop(0.35, "rgba(241,217,160,0.45)");
  grad.addColorStop(1, "rgba(241,217,160,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function metal(color = BRASS, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, envMapIntensity: 1.15 });
}

export function emissive(color = 0xdcb15a, intensity = 0.65) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, metalness: 0.4, roughness: 0.3 });
}

export function halo(ctx: Ctx, scale: number, color = 0xffffff, opacity = 1) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: ctx.glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  s.scale.setScalar(scale);
  return s;
}

export function lines(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const obj = o as THREE.Mesh;
    obj.geometry?.dispose?.();
    const mat = obj.material as THREE.Material | THREE.Material[] | undefined;
    for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      (m as THREE.MeshStandardMaterial).map?.dispose?.();
      m.dispose();
    }
  });
}


export function sheetTexture(seed: number) {
  const W = 256;
  const H = 340;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0f2238";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(195,154,75,0.5)";
  g.lineWidth = 2;
  g.strokeRect(6, 6, W - 12, H - 12);
  g.fillStyle = "rgba(241,217,160,0.85)";
  g.fillRect(22, 24, 70, 12);
  g.fillStyle = "rgba(195,154,75,0.35)";
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let y = 62; y < H - 30; y += 17) {
    g.fillRect(22, y, 130 + rnd() * 90, 6);
  }
  g.fillStyle = "rgba(241,217,160,0.8)";
  g.fillRect(22, H - 54, 90, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export const MODULE = 0.16;

export function gearGeometry(teeth: number, depth: number) {
  const rp = (teeth * MODULE) / 2;
  const h = MODULE * 1.1;
  const rRoot = rp - h / 2;
  const rTip = rp + h / 2;
  const p = (Math.PI * 2) / teeth;
  const shape = new THREE.Shape();
  const at = (a: number, r: number) => new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  for (let k = 0; k < teeth; k++) {
    const c = k * p;
    const pts = [at(c - 0.27 * p, rRoot), at(c - 0.14 * p, rTip), at(c + 0.14 * p, rTip), at(c + 0.27 * p, rRoot), at(c + 0.4 * p, rRoot * 0.998), at(c + 0.6 * p, rRoot * 0.998)];
    pts.forEach((v, i) => (k === 0 && i === 0 ? shape.moveTo(v.x, v.y) : shape.lineTo(v.x, v.y)));
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, rp * 0.26, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  if (teeth >= 11) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const w = new THREE.Path();
      w.absarc(Math.cos(a) * rp * 0.6, Math.sin(a) * rp * 0.6, rp * 0.13, 0, Math.PI * 2, true);
      shape.holes.push(w);
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.14,
    bevelSize: MODULE * 0.05,
    bevelSegments: 2,
    curveSegments: 20
  });
  geo.translate(0, 0, -depth / 2);
  return { geo, rp, rTip };
}
