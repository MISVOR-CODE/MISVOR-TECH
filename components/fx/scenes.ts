import * as THREE from "three";
import { cities } from "@/lib/site";
import { BRASS, BRASS_DEEP, BRASS_HI, NAVY, SKY, deg, emissive, halo, lines, metal, sheetTexture, gearGeometry, type Built, type Ctx, type SceneKind } from "./kit";
import { buildArmillary, buildBag, buildBook, buildBriefcase, buildCap, buildContainers, buildHelix, buildScales, buildTurbine } from "./industry";

export { disposeTree, makeGlow, type SceneKind, type Built } from "./kit";

// ───────────────────────── Globe: the hero ─────────────────────────
// A navy world with the cities the work has been delivered from, light travelling
// between them, and three tilted brass rings carrying the fields MISVOR works in.
// Every ring is inclined 40 degrees or less from the horizontal, so however the
// scene turns it never shows a vertical edge-on line.

// Same mapping as the portfolio globe, so pins land on the right place of the Earth texture.
function latLon(lat: number, lon: number, r: number) {
  const phi = deg(90 - lat);
  const theta = deg(lon + 180);
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta) * r, Math.cos(phi) * r, Math.sin(phi) * Math.sin(theta) * r);
}

function buildGlobe(ctx: Ctx): Built {
  const root = new THREE.Group();
  const R = 1.35;

  const earth = new THREE.Group();
  earth.rotation.y = -Math.PI / 2; // Valencia faces the viewer to begin with
  // The Earth from the portfolio: same textures, same Phong settings.
  const loader = new THREE.TextureLoader();
  const load = (file: string, srgb = false) => {
    const t = loader.load(`/images/earth/${file}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const earthMat = new THREE.MeshPhongMaterial({
    map: load("earth_atmos_2048.jpg", true),
    specularMap: load("earth_specular_2048.jpg"),
    specular: new THREE.Color(0x4488aa),
    shininess: 22,
    bumpMap: load("earth_normal_2048.jpg"),
    bumpScale: 0.012
  });
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(R, 72, 72), earthMat));
  earth.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.001, 72, 72),
      new THREE.MeshBasicMaterial({ map: load("earth_lights_2048.png", true), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.38, depthWrite: false })
    )
  );
  root.add(earth);
  root.add(new THREE.AmbientLight(0x6f8fb4, 1.7));
  for (const [scale, opacity, color] of [
    [1.1, 0.042, 0x00aaff],
    [1.065, 0.072, 0x002288],
    [1.145, 0.022, 0x00ff9d]
  ] as const) {
    root.add(
      new THREE.Mesh(new THREE.SphereGeometry(R * scale, 40, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.BackSide, depthWrite: false }))
    );
  }

  // Cities and the arcs that join them to Valencia
  const unit = cities.map((c) => latLon(c.lat, c.lon, 1));
  const homeHalo = halo(ctx, 0.6, BRASS_HI);
  cities.forEach((_, i) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.052 : 0.034, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }));
    dot.position.copy(unit[i].clone().multiplyScalar(R * 1.012));
    dot.add(i === 0 ? homeHalo : halo(ctx, 0.34, BRASS_HI));
    earth.add(dot);
  });

  const pulses: { pts: THREE.Vector3[]; spr: THREE.Sprite; offset: number; speed: number }[] = [];
  for (let i = 1; i < cities.length; i++) {
    const a = unit[0];
    const b = unit[i];
    const ang = a.angleTo(b);
    const lift = 0.1 + 0.22 * (ang / Math.PI);
    const pts: THREE.Vector3[] = [];
    const N = 64;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const s = Math.sin(ang);
      const p = a
        .clone()
        .multiplyScalar(Math.sin((1 - t) * ang) / s)
        .add(b.clone().multiplyScalar(Math.sin(t * ang) / s));
      p.multiplyScalar(R * (1.012 + lift * Math.sin(Math.PI * t)));
      pts.push(p);
    }
    earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lines(BRASS_HI, 0.6)));
    const spr = halo(ctx, 0.28);
    earth.add(spr);
    pulses.push({ pts, spr, offset: i / cities.length, speed: 0.14 + 0.025 * i });
  }

  // Rings with orbiting field markers
  const specs = [
    { r: R * 1.38, inc: 14, az: 0, tube: 0.03, deep: true, nodes: 2, speed: 0.35 },
    { r: R * 1.56, inc: -28, az: 70, tube: 0.022, deep: false, nodes: 3, speed: -0.28 },
    { r: R * 1.74, inc: 40, az: -35, tube: 0.018, deep: false, nodes: 5, speed: 0.2 }
  ];
  const nodeMat = emissive();
  const orbits: { g: THREE.Group; speed: number }[] = [];
  for (const s of specs) {
    const tilt = new THREE.Group();
    tilt.rotation.order = "YXZ";
    tilt.rotation.y = deg(s.az);
    tilt.rotation.x = deg(s.inc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s.r, s.tube, 12, 180), metal(s.deep ? BRASS_DEEP : BRASS, s.deep ? 0.42 : 0.3));
    ring.rotation.x = Math.PI / 2;
    tilt.add(ring);
    const orbit = new THREE.Group();
    tilt.add(orbit);
    for (let i = 0; i < s.nodes; i++) {
      const a = (i / s.nodes) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), nodeMat);
      n.position.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r);
      n.add(halo(ctx, 0.5, BRASS_HI, 0.8));
      orbit.add(n);
    }
    root.add(tilt);
    orbits.push({ g: orbit, speed: s.speed });
  }

  return {
    root,
    radius: R * 1.74 + 0.16,
    spin: 0.12,
    elev: 0.16,
    tilt: 0.1,
    update(dt, t) {
      for (const o of orbits) o.g.rotation.y += dt * o.speed;
      for (const p of pulses) {
        const u = (t * p.speed + p.offset) % 1;
        const f = u * (p.pts.length - 1);
        const i = Math.floor(f);
        p.spr.position.lerpVectors(p.pts[i], p.pts[Math.min(i + 1, p.pts.length - 1)], f - i);
        p.spr.material.opacity = Math.sin(u * Math.PI);
      }
      homeHalo.scale.setScalar(0.52 + 0.12 * Math.sin(t * 2.4));
    }
  };
}

// ───────────────────────── Neural core: AI agents ─────────────────────────

function buildNeural(ctx: Ctx): Built {
  const root = new THREE.Group();
  const R = 1.7;
  const nodeMat = emissive();
  const key = (v: THREE.Vector3) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;

  const makeShell = (radius: number, lineColor: number, lineOpacity: number) => {
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const edges = new THREE.EdgesGeometry(geo);
    const g = new THREE.Group();
    g.add(new THREE.LineSegments(edges, lines(lineColor, lineOpacity)));
    g.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: 0x1c3a5e, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.14, flatShading: true, side: THREE.DoubleSide, depthWrite: false })
      )
    );
    const pos = edges.attributes.position;
    const verts = new Map<string, THREE.Vector3>();
    const adj = new Map<string, string[]>();
    for (let i = 0; i < pos.count; i += 2) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, i);
      const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
      const ka = key(a);
      const kb = key(b);
      verts.set(ka, a);
      verts.set(kb, b);
      adj.set(ka, [...(adj.get(ka) ?? []), kb]);
      adj.set(kb, [...(adj.get(kb) ?? []), ka]);
    }
    const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(radius * 0.036, 16, 12), nodeMat, verts.size);
    const m = new THREE.Matrix4();
    [...verts.values()].forEach((v, i) => {
      m.setPosition(v);
      nodes.setMatrixAt(i, m);
    });
    g.add(nodes);
    return { group: g, verts, adj };
  };

  const outer = makeShell(R, BRASS, 0.55);
  const inner = makeShell(R * 0.5, BRASS_HI, 0.8);
  root.add(outer.group, inner.group);

  // Core, with fine threads running out to the inner shell
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }));
  const coreHalo = halo(ctx, 1.9, BRASS_HI);
  core.add(coreHalo);
  root.add(core);
  const threadPts: THREE.Vector3[] = [];
  inner.verts.forEach((v) => threadPts.push(new THREE.Vector3(), v.clone()));
  inner.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(threadPts), lines(BRASS, 0.28)));

  // Signals hopping from node to node across the outer shell
  const pulses = Array.from({ length: 16 }, () => {
    const keys = [...outer.verts.keys()];
    const from = keys[Math.floor(Math.random() * keys.length)];
    const spr = halo(ctx, 0.3);
    outer.group.add(spr);
    return { from, to: outer.adj.get(from)![0], t: Math.random(), speed: 0.7 + Math.random() * 0.7, spr };
  });

  return {
    root,
    radius: R * 1.08,
    spin: 0.28,
    elev: 0.12,
    tilt: 0.12,
    update(dt, t) {
      inner.group.rotation.y -= dt * 0.55;
      inner.group.rotation.x += dt * 0.2;
      coreHalo.scale.setScalar(1.7 + 0.25 * Math.sin(t * 2.2));
      for (const p of pulses) {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.from = p.to;
          const next = outer.adj.get(p.from)!;
          p.to = next[Math.floor(Math.random() * next.length)];
        }
        p.spr.position.lerpVectors(outer.verts.get(p.from)!, outer.verts.get(p.to)!, p.t);
        p.spr.material.opacity = Math.sin(p.t * Math.PI);
      }
    }
  };
}

// ───────────────────────── Gears: workflow automation ─────────────────────────
// Four gears that really mesh. Each follower is phased from the driver so a tooth
// always meets a gap on the line between their centres.


function buildGears(): Built {
  const root = new THREE.Group();
  const plane = new THREE.Group();
  root.add(plane);

  const specs = [
    { teeth: 16, parent: -1, alpha: 0, depth: 0.3, deep: false },
    { teeth: 11, parent: 0, alpha: deg(40), depth: 0.26, deep: true },
    { teeth: 8, parent: 0, alpha: deg(140), depth: 0.22, deep: false },
    { teeth: 12, parent: 0, alpha: deg(250), depth: 0.26, deep: true }
  ];
  const gears = specs.map((s) => {
    const { geo, rp, rTip } = gearGeometry(s.teeth, s.depth);
    const mesh = new THREE.Mesh(geo, metal(s.deep ? BRASS_DEEP : BRASS, s.deep ? 0.4 : 0.28));
    plane.add(mesh);
    return { ...s, mesh, rp, rTip };
  });

  const centre = new THREE.Vector3();
  gears.forEach((g) => {
    if (g.parent >= 0) {
      const p = gears[g.parent];
      const d = p.rp + g.rp;
      g.mesh.position.set(p.mesh.position.x + Math.cos(g.alpha) * d, p.mesh.position.y + Math.sin(g.alpha) * d, 0);
    }
    centre.add(g.mesh.position);
  });
  centre.multiplyScalar(1 / gears.length);
  let radius = 0;
  for (const g of gears) {
    g.mesh.position.sub(centre);
    radius = Math.max(radius, Math.hypot(g.mesh.position.x, g.mesh.position.y) + g.rTip + 0.1);
  }

  const drive = (theta: number) => {
    const d = gears[0];
    d.mesh.rotation.z = theta;
    for (const g of gears.slice(1)) {
      // rot_j = -(Ni/Nj) rot_i + a + pi - pi/Nj + a Ni/Nj
      g.mesh.rotation.z = -(d.teeth / g.teeth) * theta + g.alpha + Math.PI - Math.PI / g.teeth + (g.alpha * d.teeth) / g.teeth;
    }
  };
  drive(0);

  return {
    root,
    radius: radius + 0.15,
    spin: 0,
    elev: 0.1,
    tilt: 0.12,
    update(_dt, t) {
      drive(t * 0.4);
      root.rotation.y = Math.sin(t * 0.25) * 0.55;
    }
  };
}

// ───────────────────────── Data bars: analytics ─────────────────────────

function buildBars(ctx: Ctx): Built {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.55;
  root.add(inner);

  const n = 9;
  const gap = 0.27;
  const size = 0.2;
  const bars = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.32, envMapIntensity: 1.1 }),
    n * n
  );
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const deep = new THREE.Color(BRASS_DEEP);
  const hi = new THREE.Color(BRASS_HI);
  const col = new THREE.Color();
  const setBars = (t: number) => {
    let i = 0;
    for (let x = 0; x < n; x++) {
      for (let z = 0; z < n; z++) {
        const px = (x - (n - 1) / 2) * gap;
        const pz = (z - (n - 1) / 2) * gap;
        const w = 0.5 + 0.5 * Math.sin(px * 2.1 + t * 1.1) * Math.cos(pz * 1.8 - t * 0.9);
        const h = 0.18 + w * 1.25;
        dummy.position.set(px, h / 2, pz);
        dummy.scale.set(size, h, size);
        dummy.updateMatrix();
        bars.setMatrixAt(i, dummy.matrix);
        bars.setColorAt(i, col.copy(deep).lerp(hi, w));
        i++;
      }
    }
    bars.instanceMatrix.needsUpdate = true;
    if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
  };
  setBars(0);
  inner.add(bars);

  const side = n * gap + 0.3;
  const plateGeo = new THREE.BoxGeometry(side, 0.07, side);
  const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.5, roughness: 0.5 }));
  plate.position.y = -0.04;
  inner.add(plate);
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(plateGeo), lines(BRASS, 0.7));
  rim.position.y = -0.04;
  inner.add(rim);

  // A trend line floating above the field, ending in a lit node
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.3, 0.95, -0.3),
    new THREE.Vector3(-0.6, 1.2, 0.1),
    new THREE.Vector3(0, 1.65, 0),
    new THREE.Vector3(0.7, 1.6, 0.25),
    new THREE.Vector3(1.3, 2.25, -0.1)
  ]);
  inner.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.024, 8), emissive(BRASS_HI, 0.7)));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }));
  tip.position.copy(curve.getPoint(1));
  const tipHalo = halo(ctx, 0.7);
  tip.add(tipHalo);
  inner.add(tip);

  return {
    root,
    radius: 2.45,
    spin: 0.24,
    elev: 0.5,
    tilt: 0,
    update(_dt, t) {
      setBars(t);
      tipHalo.scale.setScalar(0.6 + 0.12 * Math.sin(t * 2.6));
    }
  };
}

// ───────────────────────── Shield: security and compliance ─────────────────────────

function buildShield(ctx: Ctx): Built {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const outline = new THREE.Shape();
  outline.moveTo(0, 1.4);
  outline.bezierCurveTo(0.4, 1.25, 0.85, 1.15, 1.15, 1.15);
  outline.lineTo(1.15, 0.25);
  outline.bezierCurveTo(1.15, -0.65, 0.6, -1.2, 0, -1.6);
  outline.bezierCurveTo(-0.6, -1.2, -1.15, -0.65, -1.15, 0.25);
  outline.lineTo(-1.15, 1.15);
  outline.bezierCurveTo(-0.85, 1.15, -0.4, 1.25, 0, 1.4);

  const frameGeo = new THREE.ExtrudeGeometry(outline, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 32 });
  frameGeo.translate(0, 0, -0.13);
  body.add(new THREE.Mesh(frameGeo, metal(BRASS, 0.28)));

  const faceGeo = new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelEnabled: false, curveSegments: 32 });
  const face = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.55, roughness: 0.4 }));
  face.scale.set(0.84, 0.84, 1);
  face.position.set(0, -0.02, 0.17);
  body.add(face);

  // Keyhole, glowing
  const key = new THREE.Shape();
  key.absarc(0, 0.32, 0.2, 0, Math.PI * 2, false);
  const stem = new THREE.Shape();
  stem.moveTo(-0.09, 0.2);
  stem.lineTo(0.09, 0.2);
  stem.lineTo(0.15, -0.38);
  stem.lineTo(-0.15, -0.38);
  stem.closePath();
  const keyMat = new THREE.MeshBasicMaterial({ color: 0xffe9b5 });
  for (const s of [key, stem]) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 24), keyMat);
    m.position.z = 0.235;
    body.add(m);
  }
  const keyHalo = halo(ctx, 1.4, BRASS_HI, 0.55);
  keyHalo.position.set(0, 0.1, 0.3);
  body.add(keyHalo);

  // Two scanning rings and their orbiting lights
  const nodeMat = emissive();
  const orbits: { g: THREE.Group; speed: number }[] = [];
  for (const s of [
    { r: 1.95, inc: 24, az: 0, speed: 0.5, nodes: 3 },
    { r: 2.2, inc: -18, az: 60, speed: -0.35, nodes: 2 }
  ]) {
    const tilt = new THREE.Group();
    tilt.rotation.order = "YXZ";
    tilt.rotation.y = deg(s.az);
    tilt.rotation.x = deg(s.inc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s.r, 0.016, 10, 160), metal(BRASS, 0.3));
    ring.rotation.x = Math.PI / 2;
    tilt.add(ring);
    const orbit = new THREE.Group();
    tilt.add(orbit);
    for (let i = 0; i < s.nodes; i++) {
      const a = (i / s.nodes) * Math.PI * 2;
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), nodeMat);
      n.position.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r);
      n.add(halo(ctx, 0.5, BRASS_HI, 0.8));
      orbit.add(n);
    }
    root.add(tilt);
    orbits.push({ g: orbit, speed: s.speed });
  }

  return {
    root,
    radius: 2.4,
    spin: 0,
    elev: 0.1,
    tilt: 0.06,
    update(dt, t) {
      body.rotation.y = Math.sin(t * 0.5) * 0.6;
      keyHalo.material.opacity = 0.45 + 0.15 * Math.sin(t * 2);
      for (const o of orbits) o.g.rotation.y += dt * o.speed;
    }
  };
}

// ───────────────────────── Document stack: document intelligence ─────────────────────────


function buildStack(ctx: Ctx): Built {
  const root = new THREE.Group();
  const geo = new THREE.BoxGeometry(1.7, 0.04, 2.25);
  const edgeGeo = new THREE.EdgesGeometry(geo);
  const sheets: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshStandardMaterial({ map: sheetTexture(i + 1), metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.94 });
    const sheet = new THREE.Mesh(geo, mat);
    sheet.position.y = (i - 2) * 0.42;
    sheet.rotation.y = (i % 2 ? 1 : -1) * deg(6 + i * 2);
    sheet.add(new THREE.LineSegments(edgeGeo, lines(BRASS, 0.65)));
    root.add(sheet);
    sheets.push(sheet);
  }

  // A light that reads each sheet in turn
  const scanMat = new THREE.MeshBasicMaterial({ color: BRASS_HI, transparent: true, opacity: 0.2, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.9), scanMat);
  scan.rotation.x = -Math.PI / 2;
  root.add(scan);
  const scanEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.3, 2.9)), lines(0xfff1c9, 0.9));
  scanEdge.rotation.x = -Math.PI / 2;
  root.add(scanEdge);

  // Extracted fields drifting out of the stack
  const chipGeo = new THREE.BoxGeometry(0.34, 0.09, 0.14);
  const chipMat = emissive(0xdcb15a, 0.6);
  const chips = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const chip = new THREE.Mesh(chipGeo, chipMat);
    const a = (i / 7) * Math.PI * 2;
    chip.position.set(Math.cos(a) * 1.95, (i % 4) * 0.45 - 0.7, Math.sin(a) * 1.95);
    chip.rotation.y = -a;
    chips.add(chip);
  }
  root.add(chips);
  const glowBase = halo(ctx, 3.2, SKY, 0.18);
  glowBase.position.y = -1.3;
  root.add(glowBase);

  return {
    root,
    radius: 2.4,
    spin: 0.22,
    elev: 0.42,
    tilt: 0,
    update(dt, t) {
      const y = Math.sin(t * 0.7) * 1.05;
      scan.position.y = y;
      scanEdge.position.y = y;
      chips.rotation.y -= dt * 0.35;
    }
  };
}

export function buildScene(kind: SceneKind, ctx: Ctx): Built {
  switch (kind) {
    case "armillary":
      return buildArmillary(ctx);
    case "globe":
      return buildGlobe(ctx);
    case "neural":
      return buildNeural(ctx);
    case "gears":
      return buildGears();
    case "bars":
      return buildBars(ctx);
    case "shield":
      return buildShield(ctx);
    case "stack":
      return buildStack(ctx);
    case "scales":
      return buildScales(ctx);
    case "helix":
      return buildHelix(ctx);
    case "containers":
      return buildContainers(ctx);
    case "bag":
      return buildBag(ctx);
    case "book":
      return buildBook(ctx);
    case "cap":
      return buildCap(ctx);
    case "turbine":
      return buildTurbine(ctx);
    case "briefcase":
      return buildBriefcase(ctx);
  }
}
