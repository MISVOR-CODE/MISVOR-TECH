import * as THREE from "three";
import { BRASS, BRASS_DEEP, BRASS_HI, NAVY, SKY, deg, emissive, gearGeometry, halo, lines, metal, sheetTexture, type Built, type Ctx } from "./kit";

// The armillary sphere (home hero) and one scene for each industry page.
// Same framing rule as scenes.ts: every scene reports the radius of a sphere that contains it.

const navy = (color = 0x14304f, roughness = 0.45) => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness });
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  return o;
};

// ───────────────────────── Armillary sphere ─────────────────────────

function brushedTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(70,70,70)";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const v = 48 + Math.random() * 54;
    g.fillStyle = `rgba(${v},${v},${v},0.55)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 60, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Engraved degree scale for the horizon limb, drawn in polar coordinates on a square canvas.
function limbTexture(inner: number, outer: number) {
  const S = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const mid = S / 2;
  const rIn = (inner / outer) * mid;
  const grad = g.createRadialGradient(mid, mid, rIn, mid, mid, mid);
  grad.addColorStop(0, "#a86f14");
  grad.addColorStop(0.5, "#e4ae3c");
  grad.addColorStop(1, "#946010");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "#4a330e";
  g.fillStyle = "#4a330e";
  g.lineWidth = 3;
  for (const r of [rIn + 6, rIn + 74, mid - 8]) {
    g.beginPath();
    g.arc(mid, mid, r, 0, Math.PI * 2);
    g.stroke();
  }
  for (let d = 0; d < 360; d++) {
    const a = (d * Math.PI) / 180;
    const major = d % 10 === 0;
    const mid5 = d % 5 === 0;
    const r1 = mid - 8;
    const r2 = r1 - (major ? 46 : mid5 ? 32 : 18);
    g.lineWidth = major ? 4 : 2;
    g.beginPath();
    g.moveTo(mid + Math.cos(a) * r1, mid + Math.sin(a) * r1);
    g.lineTo(mid + Math.cos(a) * r2, mid + Math.sin(a) * r2);
    g.stroke();
  }
  g.font = '600 42px "Bodoni Moda", Georgia, serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let d = 0; d < 360; d += 30) {
    const a = (d * Math.PI) / 180;
    const r = mid - 100;
    g.save();
    g.translate(mid + Math.cos(a) * r, mid + Math.sin(a) * r);
    g.rotate(a + Math.PI / 2);
    g.fillText(d === 0 ? "N" : String(d), 0, 0);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function buildArmillary(ctx: Ctx): Built {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  frame.rotation.z = -0.12;
  root.add(frame);
  const R = 2.3;
  const tilt = deg(23.4);

  const brushed = brushedTexture();
  const brass = new THREE.MeshPhysicalMaterial({ color: BRASS, metalness: 1, roughness: 1, roughnessMap: brushed, clearcoat: 0.3, clearcoatRoughness: 0.3, envMapIntensity: 1.35 });
  const brassDeep = new THREE.MeshPhysicalMaterial({ color: BRASS_DEEP, metalness: 1, roughness: 1, roughnessMap: brushed, clearcoat: 0.2, clearcoatRoughness: 0.4, envMapIntensity: 1.2 });

  const ring = (radius: number, tube: number, mat: THREE.Material = brass) => mesh(new THREE.TorusGeometry(radius, tube, 20, 220), mat);

  // Meridian and colure
  const meridian = ring(R, 0.05);
  const colure = ring(R, 0.04);
  colure.rotation.y = Math.PI / 2;
  frame.add(meridian, colure);

  // Horizon limb: a flat engraved band with rolled edges, held to the meridian by four struts
  const limbIn = R * 1.2;
  const limbOut = R * 1.42;
  const limbMat = new THREE.MeshPhysicalMaterial({ map: limbTexture(limbIn, limbOut), metalness: 1, roughness: 0.32, clearcoat: 0.25, envMapIntensity: 1.3, side: THREE.DoubleSide });
  const limbMesh = mesh(new THREE.RingGeometry(limbIn, limbOut, 220, 1), limbMat);
  limbMesh.rotation.x = -Math.PI / 2;
  frame.add(limbMesh);
  for (const r of [limbIn, limbOut]) {
    const rim = ring(r, 0.035, brassDeep);
    rim.rotation.x = Math.PI / 2;
    frame.add(rim);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const strut = mesh(new THREE.CylinderGeometry(0.04, 0.04, limbIn - R + 0.05, 14), brass);
    strut.rotation.z = Math.PI / 2;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    strut.position.x = (limbIn + R) / 2;
    holder.add(strut);
    frame.add(holder);
  }

  // Celestial equator and tropics
  const equator = ring(R, 0.045);
  equator.rotation.x = Math.PI / 2;
  frame.add(equator);
  for (const s of [1, -1]) {
    const t = ring(R * Math.cos(tilt), 0.022);
    t.rotation.x = Math.PI / 2;
    t.position.y = s * R * Math.sin(tilt);
    frame.add(t);
  }

  // Ecliptic with seven pearl lights
  const ecliptic = new THREE.Group();
  ecliptic.rotation.x = tilt;
  const eclRing = ring(R * 1.08, 0.075, brassDeep);
  eclRing.rotation.x = Math.PI / 2;
  ecliptic.add(eclRing);
  const orbit = new THREE.Group();
  ecliptic.add(orbit);
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xf6ecd4, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.6, emissive: BRASS_HI, emissiveIntensity: 0.28, envMapIntensity: 1.4 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const node = mesh(new THREE.SphereGeometry(0.13, 36, 24), pearlMat, Math.cos(a) * R * 1.08, 0, Math.sin(a) * R * 1.08);
    const collar = mesh(new THREE.TorusGeometry(0.135, 0.03, 12, 40), brass);
    collar.rotation.y = -a;
    node.add(collar);
    node.add(halo(ctx, 0.6, BRASS_HI, 0.55));
    orbit.add(node);
  }
  frame.add(ecliptic);

  // Polar axis with turned finials
  const axis = mesh(new THREE.CylinderGeometry(0.035, 0.035, R * 2.7, 20), brass);
  frame.add(axis);
  const profile = [
    [0, 0], [0.1, 0], [0.1, 0.04], [0.06, 0.09], [0.05, 0.15], [0.09, 0.21], [0.1, 0.27], [0.07, 0.34], [0.03, 0.39], [0, 0.41]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  for (const s of [1, -1]) {
    const finial = mesh(new THREE.LatheGeometry(profile, 28), brass);
    finial.position.y = s * R * 1.35;
    if (s < 0) finial.rotation.x = Math.PI;
    frame.add(finial);
  }

  // The earth at the centre. Skin unchanged: deep blue, brass graticule, Valencia marked.
  const earth = new THREE.Group();
  earth.add(mesh(new THREE.SphereGeometry(0.62, 48, 32), new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.35, roughness: 0.55 })));
  earth.add(mesh(new THREE.SphereGeometry(0.625, 24, 16), new THREE.MeshBasicMaterial({ color: BRASS, wireframe: true, transparent: true, opacity: 0.5 })));
  const lat = deg(39.47);
  const lon = deg(-0.38);
  const pin = mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }), 0.64 * Math.cos(lat) * Math.cos(lon), 0.64 * Math.sin(lat), -0.64 * Math.cos(lat) * Math.sin(lon));
  pin.add(halo(ctx, 0.5));
  earth.add(pin);
  frame.add(earth);

  return {
    root,
    radius: R * 1.35 + 0.5,
    spin: 0.21,
    elev: 0.05,
    tilt: 0.22,
    shadows: true,
    update(dt) {
      orbit.rotation.y += dt * 0.24;
      earth.rotation.y += dt * 0.12;
    }
  };
}

// ───────────────────────── Scales: finance, accounting and legal ─────────────────────────

export function buildScales(ctx: Ctx): Built {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.85;
  root.add(inner);
  const brass = new THREE.MeshStandardMaterial({ color: 0xeab444, metalness: 0.7, roughness: 0.28, emissive: 0x4a3410, emissiveIntensity: 0.8, envMapIntensity: 1.3 });
  const deep = new THREE.MeshStandardMaterial({ color: 0xc98d22, metalness: 0.7, roughness: 0.38, emissive: 0x3a2808, emissiveIntensity: 0.8, envMapIntensity: 1.2 });

  inner.add(mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.2, 56), deep, 0, 0.1, 0));
  inner.add(mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.18, 56), brass, 0, 0.29, 0));
  inner.add(mesh(new THREE.CylinderGeometry(0.09, 0.14, 2.55, 28), brass, 0, 1.65, 0));
  const topY = 3;
  inner.add(mesh(new THREE.SphereGeometry(0.18, 32, 24), brass, 0, topY, 0));
  inner.add(mesh(new THREE.SphereGeometry(0.09, 24, 16), brass, 0, topY + 0.24, 0));

  const L = 1.85;
  const C = 1.1;
  const beam = new THREE.Group();
  beam.position.y = topY;
  beam.add(mesh(new THREE.BoxGeometry(L * 2, 0.09, 0.13), brass));
  for (const s of [-1, 1]) beam.add(mesh(new THREE.SphereGeometry(0.075, 20, 14), brass, s * L, 0, 0));
  inner.add(beam);

  const bowl = new THREE.LatheGeometry([[0, 0], [0.3, 0.012], [0.55, 0.06], [0.75, 0.16], [0.79, 0.21]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  const mkPan = () => {
    const g = new THREE.Group();
    g.add(mesh(bowl, new THREE.MeshStandardMaterial({ color: BRASS, metalness: 1, roughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 1.2, emissive: 0x4a3410, emissiveIntensity: 0.7 })));
    return g;
  };
  const panL = mkPan();
  const panR = mkPan();
  inner.add(panL, panR);

  // Coins on the left, documents on the right
  const coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.055, 40);
  const coinMat = metal(0xd9b45e, 0.2);
  for (let i = 0; i < 6; i++) panL.add(mesh(coinGeo, coinMat, -0.22 + (i % 2) * 0.05, 0.06 + i * 0.06, 0.05));
  for (let i = 0; i < 4; i++) panL.add(mesh(coinGeo, coinMat, 0.25, 0.06 + i * 0.06, -0.1));
  const paper = new THREE.MeshStandardMaterial({ color: 0xefe3c4, roughness: 0.7, metalness: 0.05 });
  for (let i = 0; i < 4; i++) {
    const sheet = mesh(new THREE.BoxGeometry(0.8, 0.035, 0.58), paper, 0, 0.07 + i * 0.04, 0);
    sheet.rotation.y = (i - 1.5) * 0.12;
    panR.add(sheet);
  }
  panR.add(mesh(new THREE.TorusGeometry(0.1, 0.025, 10, 28), new THREE.MeshStandardMaterial({ color: 0x7a2530, roughness: 0.5 }), 0.15, 0.27, 0.1));

  // Chains
  const chainGeo = new THREE.BufferGeometry();
  chainGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3 * 3 * 2), 3));
  const chains = new THREE.LineSegments(chainGeo, lines(BRASS_HI, 0.9));
  inner.add(chains);

  // Coins drifting around the scales
  const orbit = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const coin = mesh(coinGeo, coinMat, Math.cos(a) * 2.35, 1.3 + Math.sin(i * 1.7) * 0.9, Math.sin(a) * 2.35);
    coin.scale.setScalar(0.8);
    orbit.add(coin);
  }
  inner.add(orbit);
  inner.add(halo(ctx, 3.2, SKY, 0.1));
  const lamp = new THREE.PointLight(0xffe3b0, 38, 14);
  lamp.position.set(2.5, 4.5, 4.5);
  root.add(lamp, new THREE.AmbientLight(0x9ab4d8, 0.8));

  const pos = chainGeo.attributes.position as THREE.BufferAttribute;
  return {
    root,
    radius: 3.0,
    spin: 0.26,
    elev: 0.22,
    tilt: 0.05,
    update(dt, t) {
      const th = 0.1 * Math.sin(t * 0.8);
      beam.rotation.z = th;
      const lx = -L * Math.cos(th);
      const ly = topY - L * Math.sin(th);
      const rx = L * Math.cos(th);
      const ry = topY + L * Math.sin(th);
      panL.position.set(lx, ly - C, 0);
      panR.position.set(rx, ry - C, 0);
      let i = 0;
      for (const [hx, hy, pan] of [[lx, ly, panL], [rx, ry, panR]] as const) {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          pos.setXYZ(i++, hx, hy, 0);
          pos.setXYZ(i++, pan.position.x + Math.cos(a) * 0.76, pan.position.y + 0.2, Math.sin(a) * 0.76);
        }
      }
      pos.needsUpdate = true;
      orbit.rotation.y += dt * 0.4;
      orbit.children.forEach((c, n) => (c.rotation.x += dt * (1 + n * 0.2)));
    }
  };
}

// ───────────────────────── DNA helix: healthcare ─────────────────────────

export function buildHelix(ctx: Ctx): Built {
  const root = new THREE.Group();
  const N = 34;
  const H = 4.5;
  const r = 0.78;
  const turns = 2.3;
  const brass = metal(BRASS, 0.25);
  const deep = metal(BRASS_DEEP, 0.35);
  const pts1: THREE.Vector3[] = [];
  const pts2: THREE.Vector3[] = [];
  for (let i = 0; i <= 140; i++) {
    const t = i / 140;
    const a = t * turns * Math.PI * 2;
    const y = (t - 0.5) * H;
    pts1.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    pts2.push(new THREE.Vector3(-Math.cos(a) * r, y, -Math.sin(a) * r));
  }
  root.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts1), 240, 0.065, 12), brass));
  root.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 240, 0.065, 12), deep));

  const gold = emissive(0xf0c25a, 0.6);
  const blue = emissive(SKY, 0.5);
  const rungGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 10);
  const nodeGeo = new THREE.SphereGeometry(0.1, 20, 14);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const a = t * turns * Math.PI * 2;
    const y = (t - 0.5) * H;
    const p1 = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const p2 = new THREE.Vector3(-Math.cos(a) * r, y, -Math.sin(a) * r);
    const dir = p2.clone().sub(p1);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const rung = mesh(rungGeo, i % 2 ? gold : blue);
    rung.position.copy(mid);
    rung.scale.y = dir.length() * 0.84;
    rung.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    root.add(rung);
    root.add(mesh(nodeGeo, i % 2 ? gold : blue, p1.x, p1.y, p1.z), mesh(nodeGeo, i % 2 ? blue : gold, p2.x, p2.y, p2.z));
  }

  // Medical crosses circling the helix
  const orbit = new THREE.Group();
  const crossMat = new THREE.MeshStandardMaterial({ color: 0xf3ead2, emissive: BRASS_HI, emissiveIntensity: 0.3, metalness: 0.3, roughness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const cross = new THREE.Group();
    cross.add(mesh(new THREE.BoxGeometry(0.5, 0.16, 0.12), crossMat), mesh(new THREE.BoxGeometry(0.16, 0.5, 0.12), crossMat));
    cross.position.set(Math.cos(a) * 1.95, Math.sin(i * 2.1) * 1.5, Math.sin(a) * 1.95);
    cross.rotation.y = -a + Math.PI / 2;
    cross.add(halo(ctx, 1, BRASS_HI, 0.35));
    orbit.add(cross);
  }
  root.add(orbit);

  return {
    root,
    radius: 2.6,
    spin: 0.4,
    elev: 0.12,
    tilt: 0.12,
    update(dt, t) {
      orbit.rotation.y -= dt * 0.5;
      orbit.children.forEach((c, i) => (c.position.y = Math.sin(t * 0.9 + i * 1.6) * 1.5));
    }
  };
}

// ───────────────────────── Containers: logistics and freight ─────────────────────────

function container(color: number) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.5 });
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.6, 0.6), body));
  const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.52, 0.035), body, 32);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 16; i++) {
    const x = -0.68 + (i / 15) * 1.36;
    m.setPosition(x, 0, 0.3);
    ribs.setMatrixAt(i * 2, m);
    m.setPosition(x, 0, -0.3);
    ribs.setMatrixAt(i * 2 + 1, m);
  }
  g.add(ribs);
  const frame = metal(BRASS_DEEP, 0.4);
  for (const [x, y, z] of [[-0.75, -0.3, -0.3], [0.75, -0.3, -0.3], [-0.75, -0.3, 0.3], [0.75, -0.3, 0.3], [-0.75, 0.3, -0.3], [0.75, 0.3, -0.3], [-0.75, 0.3, 0.3], [0.75, 0.3, 0.3]]) {
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), frame, x, y, z));
  }
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 0.6, 0.6)), lines(BRASS, 0.7)));
  return g;
}

export function buildContainers(ctx: Ctx): Built {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.5;
  root.add(inner);
  inner.add(mesh(new THREE.CylinderGeometry(3, 3.1, 0.14, 72), navy(0x0f2540), 0, -0.07, 0));
  inner.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(3, 3.1, 0.14, 72)), lines(BRASS, 0.5)));

  const colours = [0xe0a636, 0x1f4a7a, 0x7a2530, 0x946010, 0x2d6a62];
  let n = 0;
  const place = (x: number, y: number, z: number, rot = 0) => {
    const c = container(colours[n++ % colours.length]);
    c.position.set(x, 0.3 + y * 0.62, z);
    c.rotation.y = rot;
    inner.add(c);
  };
  for (const z of [-0.65, 0, 0.65]) {
    place(-0.35, 0, z);
    place(-0.35, 1, z);
  }
  place(-0.35, 2, 0);
  place(1.15, 0, -0.35, 0.05);
  place(1.15, 0, 0.35, -0.04);
  place(1.15, 1, 0);

  // Conveyor ring with parcels, and a flight path over the stack
  const ringR = 2.55;
  const belt = mesh(new THREE.TorusGeometry(ringR, 0.05, 10, 160), metal(BRASS, 0.3), 0, 0.07, 0);
  belt.rotation.x = Math.PI / 2;
  inner.add(belt);
  const parcels = new THREE.Group();
  const pc = [0xefe3c4, 0xe0a636, 0x1f4a7a, 0xefe3c4, 0x7a2530, 0xe0a636];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: pc[i], roughness: 0.55, metalness: 0.2 }), Math.cos(a) * ringR, 0.24, Math.sin(a) * ringR);
    p.rotation.y = -a;
    parcels.add(p);
  }
  inner.add(parcels);
  const arc = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.6, 0.2, 1), new THREE.Vector3(-1, 2.6, 0.5), new THREE.Vector3(1, 3.1, -0.3), new THREE.Vector3(2.6, 0.2, -1)]);
  inner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc.getPoints(80)), lines(BRASS_HI, 0.7)));
  const shipment = halo(ctx, 0.55);
  inner.add(shipment);

  return {
    root,
    radius: 3.5,
    spin: 0.2,
    elev: 0.42,
    tilt: 0,
    update(dt, t) {
      parcels.rotation.y -= dt * 0.35;
      shipment.position.copy(arc.getPoint((t * 0.12) % 1));
    }
  };
}

// ───────────────────────── Shopping bag: retail and e-commerce ─────────────────────────

export function buildBag(ctx: Ctx): Built {
  const root = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.5, 1.7, 0.9);
  const p = bodyGeo.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.82);
  bodyGeo.computeVertexNormals();
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe4ae3c, metalness: 0.9, roughness: 0.32, clearcoat: 0.4, envMapIntensity: 1.2 });
  root.add(mesh(bodyGeo, gold));
  const handleMat = metal(BRASS_DEEP, 0.35);
  for (const z of [0.2, -0.2]) {
    const h = mesh(new THREE.TorusGeometry(0.36, 0.035, 12, 48, Math.PI), handleMat, 0, 0.84, z);
    root.add(h);
  }
  // Badge on the front
  const badge = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 48), navy(0x0f2a4a, 0.4), 0, -0.05, 0.46);
  badge.rotation.x = Math.PI / 2;
  root.add(badge);
  const badgeRim = mesh(new THREE.TorusGeometry(0.3, 0.03, 12, 48), metal(BRASS_HI, 0.25), 0, -0.05, 0.47);
  root.add(badgeRim);
  const star = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 ? 0.05 : 0.17;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const sm = mesh(new THREE.ShapeGeometry(star), new THREE.MeshBasicMaterial({ color: 0xfbeaa2 }), 0, -0.05, 0.495);
  root.add(sm);

  // Parcels and price tags circling the bag
  const orbit = new THREE.Group();
  const cols = [0xefe3c4, 0x1f4a7a, 0xe0a636, 0x7a2530, 0xefe3c4];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const box = new THREE.Group();
    const s = 0.34 + (i % 3) * 0.08;
    box.add(mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.55, metalness: 0.2 })));
    box.add(mesh(new THREE.BoxGeometry(s + 0.01, 0.05, s + 0.01), metal(BRASS_HI, 0.3)));
    box.position.set(Math.cos(a) * 2.2, Math.sin(i * 1.9) * 0.9, Math.sin(a) * 2.2);
    orbit.add(box);
  }
  const tagShape = new THREE.Shape();
  tagShape.moveTo(-0.2, -0.28);
  tagShape.lineTo(0.2, -0.28);
  tagShape.lineTo(0.2, 0.12);
  tagShape.lineTo(0, 0.3);
  tagShape.lineTo(-0.2, 0.12);
  tagShape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0.12, 0.05, 0, Math.PI * 2, true);
  tagShape.holes.push(hole);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.6;
    const tag = mesh(new THREE.ExtrudeGeometry(tagShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 }), metal(BRASS_HI, 0.25), Math.cos(a) * 1.75, 1 + Math.sin(i * 2.4) * 0.7, Math.sin(a) * 1.75);
    tag.rotation.y = -a;
    tag.rotation.z = 0.3;
    orbit.add(tag);
  }
  root.add(orbit);
  root.add(halo(ctx, 3.6, SKY, 0.08));

  return {
    root,
    radius: 2.75,
    spin: 0.3,
    elev: 0.18,
    tilt: 0.08,
    update(dt, t) {
      orbit.rotation.y -= dt * 0.35;
      orbit.children.forEach((c, i) => (c.rotation.x = Math.sin(t * 0.8 + i) * 0.4));
    }
  };
}

// ───────────────────────── Open book: media and publishing ─────────────────────────

function paperTexture(seed: number) {
  const W = 256;
  const H = 340;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#efe3c4";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(60,44,20,0.85)";
  g.fillRect(24, 28, 110, 16);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = "rgba(60,44,20,0.55)";
  g.fillRect(24, 62, W - 48, 70);
  for (let y = 150; y < H - 24; y += 15) g.fillRect(24, y, 120 + rnd() * (W - 168), 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function buildBook(ctx: Ctx): Built {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.4;
  root.add(inner);
  const W = 2;
  const D = 2.7;
  const cover = new THREE.MeshStandardMaterial({ color: 0x1b3d66, roughness: 0.6, metalness: 0.2 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xefe3c4, roughness: 0.75 });
  const lift = 0.13;

  // Two halves laid out flat on either side of the spine, each lifted a little so it reads as an open volume
  for (const s of [1, -1]) {
    const half = new THREE.Group();
    half.rotation.z = s * lift;
    half.add(mesh(new THREE.BoxGeometry(W + 0.12, 0.07, D + 0.12), cover, (s * (W + 0.12)) / 2, -0.06, 0));
    for (let i = 0; i < 14; i++) {
      const wi = W - i * 0.012;
      half.add(mesh(new THREE.BoxGeometry(wi, 0.012, D - 0.1), paper, (s * wi) / 2, 0.012 * i + 0.006, 0));
    }
    const top = mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), new THREE.MeshStandardMaterial({ map: paperTexture(s > 0 ? 2 : 5), roughness: 0.8 }), (s * W) / 2, 0.19, 0);
    top.rotation.x = -Math.PI / 2;
    half.add(top);
    inner.add(half);
  }
  const spine = mesh(new THREE.CylinderGeometry(0.06, 0.06, D + 0.12, 16), metal(BRASS, 0.3), 0, -0.05, 0);
  spine.rotation.x = Math.PI / 2;
  inner.add(spine);

  // Turning pages
  const turners: { pivot: THREE.Group; offset: number }[] = [];
  for (let i = 0; i < 2; i++) {
    const pivot = new THREE.Group();
    pivot.position.y = 0.22;
    const sheet = mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), new THREE.MeshStandardMaterial({ map: paperTexture(i + 7), roughness: 0.8, side: THREE.DoubleSide }), W / 2, 0, 0);
    sheet.rotation.x = -Math.PI / 2;
    pivot.add(sheet);
    inner.add(pivot);
    turners.push({ pivot, offset: i * 1.9 });
  }

  // Headlines floating around the book
  const orbit = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const card = mesh(new THREE.PlaneGeometry(0.8, 0.55), new THREE.MeshStandardMaterial({ map: sheetTexture(i + 11), side: THREE.DoubleSide, roughness: 0.6, metalness: 0.2 }), Math.cos(a) * 2.4, 1.3 + Math.sin(i * 2) * 0.5, Math.sin(a) * 2.4);
    card.rotation.y = -a + Math.PI / 2;
    card.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.8, 0.55)), lines(BRASS, 0.8)));
    orbit.add(card);
  }
  inner.add(orbit);
  inner.add(halo(ctx, 3.4, SKY, 0.08));

  return {
    root,
    radius: 3.2,
    spin: 0.18,
    elev: 0.55,
    tilt: 0.04,
    update(dt, t) {
      orbit.rotation.y += dt * 0.3;
      for (const { pivot, offset } of turners) {
        const u = (((t + offset) / 3.8) % 1 + 1) % 1;
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        pivot.rotation.z = lift + e * (Math.PI - 2 * lift);
        pivot.position.y = 0.22 + Math.sin(u * Math.PI) * 0.35;
      }
    }
  };
}

// ───────────────────────── Mortarboard: education ─────────────────────────

export function buildCap(ctx: Ctx): Built {
  const root = new THREE.Group();
  const cap = new THREE.Group();
  cap.rotation.x = 0.12;
  root.add(cap);
  const cloth = new THREE.MeshStandardMaterial({ color: 0x0e2442, roughness: 0.78, metalness: 0.1 });
  cap.add(mesh(new THREE.CylinderGeometry(0.8, 0.72, 0.6, 56), cloth, 0, -0.3, 0));
  const board = mesh(new THREE.BoxGeometry(2.3, 0.09, 2.3), cloth, 0, 0.05, 0);
  board.rotation.y = Math.PI / 4;
  cap.add(board);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 0.09, 2.3)), lines(BRASS, 0.9));
  edge.rotation.y = Math.PI / 4;
  edge.position.y = 0.05;
  cap.add(edge);
  const brass = metal(BRASS, 0.25);
  cap.add(mesh(new THREE.SphereGeometry(0.1, 24, 16), brass, 0, 0.14, 0));
  const corner = new THREE.Vector3(1.63, 0.07, 0);
  cap.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(0.8, 0.2, 0.05), corner]), 30, 0.025, 8), brass));
  const tassel = new THREE.Group();
  tassel.position.copy(corner);
  tassel.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.7, 8), brass, 0, -0.35, 0));
  tassel.add(mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.12, 16), brass, 0, -0.72, 0));
  tassel.add(mesh(new THREE.ConeGeometry(0.11, 0.42, 20, 1, true), metal(BRASS_HI, 0.45), 0, -0.98, 0)).rotation.x = Math.PI;
  cap.add(tassel);

  // Books and a diploma circling the cap
  const orbit = new THREE.Group();
  const bookCols = [0x1f4a7a, 0x7a2530, 0x2d6a62];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const b = new THREE.Group();
    b.add(mesh(new THREE.BoxGeometry(0.75, 0.2, 0.55), new THREE.MeshStandardMaterial({ color: bookCols[i], roughness: 0.6 })));
    b.add(mesh(new THREE.BoxGeometry(0.72, 0.15, 0.52), new THREE.MeshStandardMaterial({ color: 0xefe3c4, roughness: 0.8 }), 0.03, 0, 0));
    b.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), metal(BRASS_HI, 0.3), 0, 0.105, 0));
    b.position.set(Math.cos(a) * 2.35, -0.9 + i * 0.7, Math.sin(a) * 2.35);
    b.rotation.y = -a;
    b.rotation.z = 0.2;
    orbit.add(b);
  }
  const diploma = new THREE.Group();
  diploma.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 24), new THREE.MeshStandardMaterial({ color: 0xefe3c4, roughness: 0.7 })));
  const ribbon = mesh(new THREE.TorusGeometry(0.125, 0.025, 10, 32), new THREE.MeshStandardMaterial({ color: 0x7a2530, roughness: 0.5 }));
  ribbon.rotation.x = Math.PI / 2;
  diploma.add(ribbon);
  diploma.rotation.z = Math.PI / 2 - 0.4;
  diploma.position.set(-2.1, 1.2, 0.9);
  orbit.add(diploma);
  root.add(orbit);
  root.add(halo(ctx, 3.8, SKY, 0.08));

  return {
    root,
    radius: 2.9,
    spin: 0.26,
    elev: 0.3,
    tilt: 0.05,
    update(dt, t) {
      orbit.rotation.y -= dt * 0.3;
      tassel.rotation.z = Math.sin(t * 1.7) * 0.12;
      cap.position.y = Math.sin(t * 0.9) * 0.08;
    }
  };
}

// ───────────────────────── Turbine and factory: manufacturing and energy ─────────────────────────

export function buildTurbine(ctx: Ctx): Built {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -1.9;
  root.add(inner);
  inner.add(mesh(new THREE.CylinderGeometry(2.5, 2.6, 0.14, 72), navy(0x0f2540), 0, -0.07, 0));
  inner.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.5, 2.6, 0.14, 72)), lines(BRASS, 0.5)));

  const white = new THREE.MeshPhysicalMaterial({ color: 0xece4d0, roughness: 0.3, metalness: 0.2, clearcoat: 0.6 });
  const brass = metal(BRASS, 0.28);
  const tower = new THREE.Group();
  tower.position.set(0.9, 0, -0.5);
  tower.add(mesh(new THREE.CylinderGeometry(0.07, 0.14, 2.6, 28), white, 0, 1.3, 0));
  tower.add(mesh(new THREE.BoxGeometry(0.28, 0.24, 0.6), white, 0, 2.66, 0.05));
  const rotor = new THREE.Group();
  rotor.position.set(0, 2.66, 0.4);
  rotor.add(mesh(new THREE.SphereGeometry(0.13, 24, 18), brass));
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.07, 0.1);
  bladeShape.lineTo(0.07, 0.1);
  bladeShape.lineTo(0.025, 1.3);
  bladeShape.lineTo(-0.01, 1.3);
  bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012 });
  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i / 3) * Math.PI * 2;
    holder.add(mesh(bladeGeo, white));
    rotor.add(holder);
  }
  tower.add(rotor);
  inner.add(tower);

  // Factory with a sawtooth roof and chimneys
  const factory = new THREE.Group();
  factory.position.set(-1.1, 0, 0.55);
  factory.add(mesh(new THREE.BoxGeometry(1.7, 0.7, 1), navy(0x1b3d66, 0.55), 0, 0.35, 0));
  const tooth = new THREE.Shape();
  tooth.moveTo(0, 0);
  tooth.lineTo(0.56, 0);
  tooth.lineTo(0.56, 0.3);
  tooth.closePath();
  const toothGeo = new THREE.ExtrudeGeometry(tooth, { depth: 1, bevelEnabled: false });
  for (let i = 0; i < 3; i++) {
    const t = mesh(toothGeo, metal(BRASS_DEEP, 0.45), -0.85 + i * 0.567, 0.7, -0.5);
    factory.add(t);
  }
  const winMat = emissive(0xfbeaa2, 0.9);
  for (let i = 0; i < 5; i++) factory.add(mesh(new THREE.BoxGeometry(0.2, 0.16, 0.02), winMat, -0.64 + i * 0.32, 0.38, 0.51));
  for (const x of [-0.55, -0.15]) factory.add(mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 20), metal(BRASS, 0.4), x, 1.15, -0.25));
  inner.add(factory);

  const smoke: { s: THREE.Sprite; x: number; o: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const s = halo(ctx, 0.5, 0xbfd0e6, 0.4);
    inner.add(s);
    smoke.push({ s, x: i % 2 ? -0.55 : -0.15, o: i / 10 });
  }

  // A small gear for the mechanical side
  const { geo } = gearGeometry(12, 0.16);
  const gear = mesh(geo, metal(BRASS, 0.3), 1.45, 0.6, 1.2);
  inner.add(gear);

  return {
    root,
    radius: 3.2,
    spin: 0.2,
    elev: 0.3,
    tilt: 0.04,
    update(dt, t) {
      rotor.rotation.z += dt * 1.3;
      gear.rotation.z -= dt * 0.9;
      for (const p of smoke) {
        const u = (t * 0.18 + p.o) % 1;
        p.s.position.set(-1.1 + p.x + u * 0.5, 1.7 + u * 1.2, 0.3);
        p.s.scale.setScalar(0.3 + u * 0.8);
        p.s.material.opacity = 0.42 * (1 - u);
      }
    }
  };
}

// ───────────────────────── Briefcase: professional services ─────────────────────────

export function buildBriefcase(ctx: Ctx): Built {
  const root = new THREE.Group();
  const caseGroup = new THREE.Group();
  root.add(caseGroup);
  const w = 2.4;
  const h = 1.6;
  const rr = 0.2;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + rr, -h / 2);
  shape.lineTo(w / 2 - rr, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rr);
  shape.lineTo(w / 2, h / 2 - rr);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2);
  shape.lineTo(-w / 2 + rr, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rr);
  shape.lineTo(-w / 2, -h / 2 + rr);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 5, curveSegments: 16 });
  bodyGeo.translate(0, 0, -0.35);
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x14274a, roughness: 0.5, metalness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  caseGroup.add(mesh(bodyGeo, leather));
  const brass = metal(BRASS, 0.25);
  caseGroup.add(mesh(new THREE.BoxGeometry(w + 0.16, 0.03, 0.02), brass, 0, 0.18, 0.44));
  // Corners, handle and clasps
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caseGroup.add(mesh(new THREE.SphereGeometry(0.11, 20, 14), brass, x * (w / 2 - 0.03), y * (h / 2 - 0.03), 0));
  const handle = mesh(new THREE.TorusGeometry(0.46, 0.045, 14, 48, Math.PI), brass, 0, h / 2 + 0.05, 0);
  caseGroup.add(handle);
  for (const x of [-0.46, 0.46]) caseGroup.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.2), brass, x, h / 2 + 0.02, 0));
  for (const x of [-0.65, 0.65]) {
    caseGroup.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), brass, x, 0.18, 0.45));
    caseGroup.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), emissive(0xf0c25a, 0.4), x, 0.18, 0.48)).rotation.x = Math.PI / 2;
  }
  caseGroup.rotation.x = 0.1;

  // Documents circling the case, and a check badge
  const orbit = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const card = mesh(new THREE.PlaneGeometry(0.85, 1.1), new THREE.MeshStandardMaterial({ map: sheetTexture(i + 21), side: THREE.DoubleSide, roughness: 0.55, metalness: 0.2 }), Math.cos(a) * 2.5, Math.sin(i * 1.7) * 0.9, Math.sin(a) * 2.5);
    card.rotation.y = -a + Math.PI / 2;
    card.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.85, 1.1)), lines(BRASS, 0.8)));
    orbit.add(card);
  }
  root.add(orbit);
  const badge = new THREE.Group();
  badge.add(mesh(new THREE.TorusGeometry(0.3, 0.04, 14, 48), brass));
  badge.add(mesh(new THREE.CircleGeometry(0.28, 40), new THREE.MeshStandardMaterial({ color: 0x14274a, roughness: 0.5 })));
  const tick = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.12, 0, 0.01), new THREE.Vector3(-0.03, -0.1, 0.01), new THREE.Vector3(0.14, 0.1, 0.01)]), 12, 0.03, 8), emissive(0xfbeaa2, 0.8));
  badge.add(tick);
  badge.position.set(1.45, 1.35, 0.5);
  root.add(badge);
  root.add(halo(ctx, 3.8, SKY, 0.08));

  return {
    root,
    radius: 3.2,
    spin: 0.28,
    elev: 0.2,
    tilt: 0.05,
    update(dt, t) {
      orbit.rotation.y -= dt * 0.3;
      badge.position.y = 1.35 + Math.sin(t * 1.4) * 0.08;
    }
  };
}

void deg;
