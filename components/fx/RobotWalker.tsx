"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRobot, robotEnvironment } from "./robot";

// The MISVOR AI robot lives on a transparent canvas laid over the whole section, with one world
// unit per robot unit and the camera set so that the canvas bottom is y = 0 and x grows with CSS
// pixels. That lets him stand, fly and point at the real button in the page, on any screen size.
//
// The loop (he is always on screen):
//   lean on the left wall -> walk right -> turn to the visitor and wave -> fly to the button and
//   point at it -> land -> walk to the middle and point again -> walk back -> turn, wave, lean.
//
// Kept deliberately calm: eased walking (speed follows distance, steps follow speed), a body glow
// while flying, a shadow that shrinks with height, natural waving, and pointing arms and index
// finger computed from the real position of the button. With reduced motion he leans on the wall.

type Phase = "lean" | "rise" | "walkR" | "waveR" | "fly" | "hover" | "land" | "walkM" | "pointM" | "walkL" | "waveL" | "settle";

const deg = THREE.MathUtils.degToRad;
const LEAN = deg(8);
// Idle arms are twisted 85 degrees about their length: the elbow then bends forward like a real walking arm
// and the palm turns toward the body. The acting arm untwists to 0 (palm to the screen) to wave or point.
const REST_TWIST = 85;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function RobotWalker() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const section = el?.parentElement;
    if (!el || !section) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL: the section reads fine without him.
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { width: "100%", height: "100%", display: "block" });
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.environment = robotEnvironment(renderer);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    const rim = new THREE.DirectionalLight(0x9db8ff, 1.5);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 0.9);
    scene.add(key, key.target, rim, hemi);

    const bot = createRobot();
    const J = bot.J as Record<string, { set: (v: number) => void }>;
    const DEF = bot.DEF as Record<string, number>;
    const rig = new THREE.Group(); // position and lean, pivoting at the feet
    rig.add(bot.root);
    scene.add(rig);

    const gc = document.createElement("canvas");
    gc.width = gc.height = 64;
    const gg = gc.getContext("2d")!;
    const grad = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,244,214,1)");
    grad.addColorStop(0.4, "rgba(251,234,162,0.5)");
    grad.addColorStop(1, "rgba(251,234,162,0)");
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);

    // Contact shadow
    const sc = document.createElement("canvas");
    sc.width = sc.height = 64;
    const sg = sc.getContext("2d")!;
    const sgr = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    sgr.addColorStop(0, "rgba(0,0,0,0.6)");
    sgr.addColorStop(1, "rgba(0,0,0,0)");
    sg.fillStyle = sgr;
    sg.fillRect(0, 0, 64, 64);
    const shadowTex = new THREE.CanvasTexture(sc);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);

    // The room: two brass-trimmed pilasters and a floor
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f2238, metalness: 0.6, roughness: 0.45 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xe4ae3c, metalness: 1, roughness: 0.3 });
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), wallMat);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 2.4), wallMat);
    const floorEdge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.04), trimMat);
    scene.add(wallL, wallR, floor, floorEdge);

    // Glow: while he flies, the blue and gold trim brightens, the metal takes on a warm sheen, a soft
    // aura blooms behind him and a warm light follows him. Materials are collected once.
    const glowMats: { m: THREE.Material; basic: boolean; color: THREE.Color; emissive: THREE.Color; ei: number }[] = [];
    const seen = new Set<THREE.Material>();
    bot.root.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (!mat || seen.has(mat)) return;
      seen.add(mat);
      const any = mat as THREE.MeshStandardMaterial & THREE.MeshBasicMaterial;
      if (mat.type === "MeshBasicMaterial") glowMats.push({ m: mat, basic: true, color: any.color.clone(), emissive: new THREE.Color(), ei: 0 });
      else if (any.emissive) glowMats.push({ m: mat, basic: false, color: any.color.clone(), emissive: any.emissive.clone(), ei: any.emissiveIntensity ?? 1 });
    });
    const warmTint = new THREE.Color(0xffc45e);
    const auraWarm = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    auraWarm.scale.setScalar(8);
    const auraBlue = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x5f8fff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    auraBlue.scale.setScalar(4);
    const glowLight = new THREE.PointLight(0xffe0a0, 0, 16, 1.6);
    scene.add(auraWarm, auraBlue, glowLight);
    let glowApplied = -1;

    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

    // Layout (CSS pixels), refreshed on resize
    let W = 1;
    let H = 1;
    let u = 40;
    let narrow = false;
    let camD = 40;
    let floorPx = 20;
    let wallPx = 30;
    const L = { xLean: 200, xRight: 1200, xMid: 600, hoverX: 900, hoverY: 150, btnX: 700, btnY: 400 };
    const measure = () => {
      const s = section.getBoundingClientRect();
      W = Math.max(1, s.width);
      H = Math.max(1, s.height);
      narrow = W < 640;
      // Below the desktop breakpoint a sticky bar sits at the bottom of the screen, so the floor rises above it
      floorPx = W < 1024 ? 86 : 20;
      wallPx = narrow ? 12 : 34;
      // The robot is sized to the floor space left under the text, so he always fits on screen
      const stage = section.querySelector<HTMLElement>("[data-robot-stage]");
      const stageTop = stage ? stage.getBoundingClientRect().top - s.top : H * 0.55;
      const avail = H - floorPx - stageTop - 10;
      const robotPx = clamp(avail, 190, 340);
      u = robotPx / 7.1;
      renderer.setSize(W, H, false);
      cam.aspect = W / H;
      const d = H / u / (2 * Math.tan(deg(cam.fov / 2)));
      camD = d;
      cam.position.set(W / (2 * u), H / (2 * u), d);
      cam.lookAt(W / (2 * u), H / (2 * u), 0);
      cam.near = Math.max(0.1, d - 40);
      cam.far = d + 60;
      cam.updateProjectionMatrix();

      const btn = section.querySelector<HTMLElement>("[data-robot-target]");
      const b = btn?.getBoundingClientRect();
      L.btnX = b ? b.left - s.left + b.width / 2 : W / 2;
      L.btnY = b ? H - (b.top - s.top + b.height / 2) : H * 0.6; // from the bottom
      const btnRight = b ? b.right - s.left : W / 2 + 120;
      const chips = section.querySelector<HTMLElement>("ul")?.getBoundingClientRect();
      const clearRight = Math.max(btnRight, chips ? chips.right - s.left : 0);
      // Shoulder pad reaches ~2.2u from his centre; leaning tips it toward the wall, so the feet stand a little out
      L.xLean = wallPx + (2.2 * Math.cos(LEAN) + 4.5 * Math.sin(LEAN)) * u + 6;
      // The WhatsApp button floats at the bottom right, so he stops a little short of that wall
      L.xRight = Math.max(L.xLean + 3 * u, W - wallPx - 2.5 * u - 64);
      if (narrow) {
        // The button spans most of a phone, so he hovers just under it and points up
        L.hoverX = L.xRight;
        L.hoverY = 1.2 * u;
      } else {
        L.hoverX = clamp(clearRight + 1.9 * u, L.btnX + 2 * u, L.xRight);
        const headRoom = H - floorPx - 7.6 * u - 64;
        L.hoverY = clamp(L.btnY - floorPx - 4.5 * u, 1.4 * u, Math.max(1.4 * u, headRoom));
      }
      L.xMid = clamp(narrow ? W * 0.5 : L.btnX - 2.8 * u, L.xLean + 2.5 * u, L.xRight - 2.5 * u);

      const hu = H / u + 2;
      wallL.scale.set(wallPx / u, hu, 2.2);
      wallL.position.set(wallPx / u / 2, hu / 2 - 1, -0.2);
      wallR.scale.set(wallPx / u, hu, 2.2);
      wallR.position.set((W - wallPx / 2) / u, hu / 2 - 1, -0.2);
      floor.scale.set(W / u, 1, 1);
      floor.position.set(W / (2 * u), floorPx / u - 0.05, 0);
      floorEdge.scale.set(W / u, 1, 1);
      floorEdge.position.set(W / (2 * u), floorPx / u + 0.005, 1.2);
    };

    // State
    const cur: Record<string, number> = { ...DEF };
    let phase: Phase = "lean";
    let pt = 0;
    let xPx = 0;
    let yPx = 0; // feet above the floor
    let vx = 0;
    let vel = 0;
    let yaw = 0.3;
    let lean = LEAN;
    let bank = 0;
    let glow = 0;
    let pointed = false;
    let firstRun = true;
    let walkPhase = 0;
    const flyFrom = { x: 0, y: 0 };
    const landFrom = { x: 0, y: 0 };

    const setPointed = (on: boolean) => {
      if (on === pointed) return;
      pointed = on;
      section.querySelector<HTMLElement>("[data-robot-target]")?.setAttribute("data-pointed", String(on));
    };
    const go = (p: Phase) => {
      phase = p;
      pt = 0;
    };

    const base = (): Record<string, number> => ({
      szR: -12, szL: 12, sxR: -7, sxL: -7, syR: REST_TWIST, syL: REST_TWIST, elR: -16, elL: -16, fiR: 28, fiL: 28, pnR: 0, pnL: 0, wrR: -6, wrL: 6, wxR: 4, wxL: 4, wyR: 0, wyL: -2 * REST_TWIST,
      hsR: 0, hsL: 0, knR: 0, knL: 0, anR: 0, anL: 0, hzR: -10, hzL: 10, hy: 0, hx: 0, hz: 0, torso: 0, tx: 0, tz: 0, mo: 0
    });

    // Eased horizontal motion: speed follows the distance left
    const walkTo = (target: number, vmax: number, dt: number) => {
      const d = target - xPx;
      const vt = Math.sign(d) * Math.min(vmax, Math.abs(d) * 2.6 + 10);
      vel += (vt - vel) * (1 - Math.exp(-dt * 4.2));
      xPx += vel * dt;
      if (Math.abs(d) < 1.5 && Math.abs(vel) < 16) {
        xPx = target;
        vel = 0;
        return true;
      }
      return false;
    };
    // Walking: a calm stride. Hips dip at full stride (never rise), feet stay flat to the floor, arms
    // swing opposite the legs with a gentle elbow, wrists and fingers stay relaxed.
    const applyGait = (tg: Record<string, number>, v: number, dt: number, vmax: number) => {
      const gait = clamp(Math.abs(v) / (vmax * 0.6), 0, 1);
      walkPhase += (Math.abs(v) / u) * 1.45 * dt;
      const A = 19 * gait;
      const s = Math.sin(walkPhase);
      const c = Math.cos(walkPhase);
      tg.hsR = A * s;
      tg.hsL = -A * s;
      tg.knR = 30 * gait * Math.max(0, -c);
      tg.knL = 30 * gait * Math.max(0, c);
      tg.anR = -(tg.hsR + tg.knR) * 0.85;
      tg.anL = -(tg.hsL + tg.knL) * 0.85;
      tg.sxR = -7 - 15 * gait * s;
      tg.sxL = -7 + 15 * gait * s;
      tg.szR = lerp(-12, -9, gait);
      tg.szL = lerp(12, 9, gait);
      tg.elR = -15 - 12 * gait * Math.max(0, s);
      tg.elL = -15 - 12 * gait * Math.max(0, -s);
      tg.fiR = 20;
      tg.fiL = 20;
      tg.torso = 4 * gait * s;
      tg.tx = 3 * gait;
      tg.hy = -3 * gait * s; // the head counter-turns a touch
      return gait;
    };

    // Relaxed lean on the wall: arms easy, weight on one leg
    const leanPose = (tg: Record<string, number>) => {
      tg.szR = -2; // the wall-side arm hangs close to the body so the hand stays on screen
      tg.elR = -14;
      tg.szL = 16;
      tg.elL = -28;
      tg.fiL = 34;
      tg.hsL = -6;
      tg.hzL = 6;
      tg.knL = 6;
      tg.hz = -5;
      tg.tz = -3;
    };

    // The wave from the mascot file: upper arm 25 degrees out, elbow bent 120 so the forearm points up
    // beside the head, wrist swaying, fingers open. The left arm mirrors it.
    const wavePose = (tg: Record<string, number>, t: number, side: "R" | "L", w: number) => {
      const sg = side === "R" ? -1 : 1;
      const sw = Math.sin(t * 6.5);
      tg["sz" + side] = lerp(tg["sz" + side], sg * 25, w);
      tg["el" + side] = lerp(tg["el" + side], -120 + 7 * Math.sin(t * 6.5 + 1), w);
      tg["wr" + side] = lerp(tg["wr" + side], sg * 8 - sg * 26 * sw * -1, w);
      tg["fi" + side] = lerp(tg["fi" + side], 0, w);
      tg["wy" + side] = lerp(tg["wy" + side], 0, w); // palm to the screen
      tg["sy" + side] = lerp(tg["sy" + side], 0, w);
      tg.hz = lerp(tg.hz, sg * 4, w);
    };

    // Pointing: the arm reaches toward the button with an open, relaxed hand, like presenting it
    const pointPose = (tg: Record<string, number>, side: "R" | "L", elev: number, w = 1) => {
      const sg = side === "R" ? -1 : 1;
      tg["sz" + side] = lerp(tg["sz" + side], sg * clamp(90 + elev, 45, 160), w);
      tg["sx" + side] = lerp(tg["sx" + side], -8, w);
      tg["el" + side] = lerp(tg["el" + side], -10, w);
      tg["wr" + side] = lerp(tg["wr" + side], 0, w);
      tg["fi" + side] = lerp(tg["fi" + side], 8, w);
      tg["wy" + side] = lerp(tg["wy" + side], 0, w); // palm to the screen
      tg["sy" + side] = lerp(tg["sy" + side], 0, w);
    };

    const frame = (t: number, dt: number) => {
      pt += dt;
      const tg = base();
      // Subtle life in the idle arms
      tg.elR += 1.6 * Math.sin(t * 1.1);
      tg.elL += 1.6 * Math.sin(t * 1.3 + 1);
      const fc = Math.atan2(W / (2 * u) - xPx / u, camD); // the yaw that faces the visitor from here
      let targetYaw = fc;
      let targetLean = 0;
      let mouth = 0;
      let lookX = 0;
      let lookY = 0;
      let gait = 0;
      let kSmooth = 7;
      let glowTarget = 0;
      let point = false;

      switch (phase) {
        case "lean": {
          leanPose(tg);
          targetYaw = 0.3;
          targetLean = LEAN;
          if (pt > (firstRun ? 2.4 : 3.6)) {
            firstRun = false;
            go("rise");
          }
          break;
        }
        case "rise": {
          const k = smooth(clamp(pt / 0.8, 0, 1));
          leanPose(tg);
          for (const key2 of ["szL", "elL", "fiL", "hsL", "hzL", "knL", "hz", "tz"]) tg[key2] = lerp(tg[key2], base()[key2], k);
          targetYaw = lerp(0.3, Math.PI / 2, smooth(clamp((pt - 0.2) / 0.6, 0, 1)));
          targetLean = LEAN * (1 - k);
          kSmooth = 9;
          if (pt > 0.8) go("walkR");
          break;
        }
        case "walkR": {
          const vmax = narrow ? 125 : 165;
          const done = walkTo(L.xRight, vmax, dt);
          targetYaw = Math.PI / 2;
          gait = applyGait(tg, vel, dt, vmax);
          kSmooth = 10;
          if (done) go("waveR");
          break;
        }
        case "waveR": {
          // Reach the wall, turn to the visitor, wave
          targetYaw = lerp(Math.PI / 2, fc, smooth(clamp(pt / 0.6, 0, 1)));
          const w = smooth(clamp((pt - 0.55) / 0.45, 0, 1)) * (1 - smooth(clamp((pt - 2.7) / 0.5, 0, 1)));
          wavePose(tg, t, "R", w);
          mouth = 0.2 * w;
          if (pt > 3.3) {
            flyFrom.x = xPx;
            flyFrom.y = yPx;
            go("fly");
          }
          break;
        }
        case "fly": {
          const dur = 2.3;
          const s = inOut(clamp(pt / dur, 0, 1));
          // Rise first, glide across, then settle onto the hover point
          const p1x = flyFrom.x - 0.1 * (flyFrom.x - L.hoverX);
          const p1y = L.hoverY * 0.95;
          const p2x = lerp(flyFrom.x, L.hoverX, 0.6);
          const p2y = L.hoverY * 1.1 + 6;
          const a = (1 - s) ** 3;
          const b = 3 * (1 - s) ** 2 * s;
          const c = 3 * (1 - s) * s * s;
          const d = s ** 3;
          const nx = a * flyFrom.x + b * p1x + c * p2x + d * L.hoverX;
          const ny = a * flyFrom.y + b * p1y + c * p2y + d * L.hoverY;
          vx = (nx - xPx) / Math.max(dt, 1e-3);
          xPx = nx;
          yPx = ny;
          glowTarget = 1;
          targetYaw = fc * 0.8;
          // Easy flight: arms a little out and back, hands soft, legs trailing together
          tg.sxR = 16;
          tg.sxL = 16;
          tg.szR = -26;
          tg.szL = 26;
          tg.elR = -34;
          tg.elL = -34;
          tg.fiR = 22;
          tg.fiL = 22;
          tg.hsR = 12;
          tg.hsL = 7;
          tg.knR = 28;
          tg.knL = 38;
          tg.anR = 20;
          tg.anL = 20;
          tg.tx = 7;
          kSmooth = 6;
          if (pt >= dur) {
            vx = 0;
            go("hover");
          }
          break;
        }
        case "hover": {
          // Point at the button from beside it (or from below on a phone)
          glowTarget = 1;
          targetYaw = fc * 0.7;
          yPx = L.hoverY + Math.sin(t * 2) * 3;
          xPx = L.hoverX + Math.sin(t * 1.2) * 2;
          const dx = xPx - L.btnX;
          const dy = L.btnY - (floorPx + yPx + 4.5 * u);
          const elev = THREE.MathUtils.radToDeg(Math.atan2(dy, dx));
          const w = smooth(clamp((pt - 0.35) / 0.5, 0, 1)) * (1 - smooth(clamp((pt - 2.8) / 0.5, 0, 1)));
          tg.sxR = 16;
          tg.sxL = 16;
          tg.szR = -26;
          tg.szL = 26;
          tg.elR = -34;
          tg.elL = -34;
          tg.hsR = 8;
          tg.hsL = 4;
          tg.knR = 26;
          tg.knL = 38;
          tg.anR = 20;
          tg.anL = 20;
          pointPose(tg, "R", dx > 0 ? elev : 180 - elev, w);
          tg.hy = -32 * w;
          tg.hx = -clamp(elev * 0.35, -8, 16) * w;
          lookX = -0.9 * w;
          point = w > 0.6;
          kSmooth = 7;
          if (pt > 3.4) {
            landFrom.x = xPx;
            landFrom.y = yPx;
            go("land");
          }
          break;
        }
        case "land": {
          const dur = 1.5;
          const s = clamp(pt / dur, 0, 1);
          yPx = lerp(landFrom.y, 0, 1 - (1 - s) * (1 - s));
          glowTarget = s < 0.85 ? 1 : 0;
          targetYaw = fc;
          const prep = smooth(clamp((s - 0.5) / 0.45, 0, 1));
          tg.hsR = -4 * prep;
          tg.hsL = -8 * prep;
          tg.knR = lerp(28, 6, prep);
          tg.knL = lerp(38, 8, prep);
          tg.sxR = 8;
          tg.sxL = 8;
          tg.szR = -28;
          tg.szL = 28;
          if (pt >= dur) {
            yPx = 0;
            go("walkM");
          }
          break;
        }
        case "walkM": {
          const vmax = narrow ? 120 : 160;
          const done = walkTo(L.xMid, vmax, dt);
          targetYaw = -Math.PI / 2;
          gait = applyGait(tg, vel, dt, vmax);
          kSmooth = 10;
          if (done) go("pointM");
          break;
        }
        case "pointM": {
          // Turn to the visitor and present the button with a raised arm and an extended finger
          const turn = smooth(clamp(pt / 0.6, 0, 1));
          targetYaw = lerp(-Math.PI / 2, fc * 0.6, turn);
          const dx = L.btnX - xPx;
          const dy = L.btnY - (floorPx + 4.5 * u);
          const elev = THREE.MathUtils.radToDeg(Math.atan2(dy, Math.abs(dx) < 1 ? 1 : dx));
          const w = smooth(clamp((pt - 0.6) / 0.5, 0, 1)) * (1 - smooth(clamp((pt - 2.9) / 0.5, 0, 1)));
          const side = dx >= 0 ? "L" : "R";
          pointPose(tg, side, dx >= 0 ? elev : 180 - elev, w);
          tg.hy = clamp(THREE.MathUtils.radToDeg(Math.atan2(dx, 14 * u)) * 0.9, -40, 40) * w;
          tg.hx = -clamp(elev * 0.3, 6, 22) * w;
          lookX = (dx >= 0 ? 0.8 : -0.8) * w;
          lookY = 0.6 * w;
          mouth = 0.12 * w;
          point = w > 0.6;
          if (pt > 3.5) go("walkL");
          break;
        }
        case "walkL": {
          const vmax = narrow ? 120 : 165;
          const done = walkTo(L.xLean, vmax, dt);
          targetYaw = -Math.PI / 2;
          gait = applyGait(tg, vel, dt, vmax);
          kSmooth = 10;
          if (done) go("waveL");
          break;
        }
        case "waveL": {
          // Reach the wall, turn to the visitor, wave
          targetYaw = lerp(-Math.PI / 2, fc, smooth(clamp(pt / 0.6, 0, 1)));
          const w = smooth(clamp((pt - 0.55) / 0.45, 0, 1)) * (1 - smooth(clamp((pt - 2.7) / 0.5, 0, 1)));
          // Same right-arm wave as at the other wall: from here his left arm turns away from the visitor
          wavePose(tg, t, "R", w);
          mouth = 0.2 * w;
          if (pt > 3.3) go("settle");
          break;
        }
        case "settle": {
          // Turn back to the room and lean into the wall
          const k = smooth(clamp(pt / 1.0, 0, 1));
          leanPose(tg);
          for (const key2 of ["szL", "elL", "fiL", "hsL", "hzL", "knL", "hz", "tz"]) tg[key2] = lerp(base()[key2], tg[key2], k);
          targetYaw = lerp(fc, 0.3, smooth(clamp(pt / 0.8, 0, 1)));
          targetLean = LEAN * smooth(clamp((pt - 0.35) / 0.65, 0, 1));
          kSmooth = 8;
          if (pt > 1.1) go("lean");
          break;
        }
      }
      setPointed(point);

      const k = 1 - Math.exp(-dt * kSmooth);
      for (const key2 in J) {
        const want = tg[key2] ?? DEF[key2];
        cur[key2] += (want - cur[key2]) * k;
        J[key2].set(cur[key2]);
      }
      const ky = 1 - Math.exp(-dt * 6);
      yaw += (targetYaw - yaw) * ky;
      lean += (targetLean - lean) * (1 - Math.exp(-dt * 7));
      glow += (glowTarget - glow) * (1 - Math.exp(-dt * 3.2));
      const bankTarget = phase === "fly" ? clamp(-vx / (u * 7), -1, 1) * 0.25 : 0;
      bank += (bankTarget - bank) * (1 - Math.exp(-dt * 5));
      const look = { x: lookX, y: lookY };

      const breathe = 0.012 * Math.sin(t * 1.8);
      const bob = gait > 0.05 ? -0.2 * gait * Math.abs(Math.sin(walkPhase)) : breathe;
      bot.pelvis.position.y = 3.15 + bob;
      bot.root.rotation.y = yaw;
      const bk = t % 4.3 > 4.18 ? 0.1 : 1;
      bot.eyes.forEach((e: THREE.Object3D, i: number) => {
        e.scale.set(1, bk, 1);
        e.position.set((i ? 1 : -1) * 0.5 + look.x * 0.06, look.y * 0.04, -0.02);
      });
      bot.mouth.scale.y = 1 + mouth * 2.2;
      const pu = (0.03 + 0.05 * glow) * Math.sin(t * (3 + 3 * glow));
      bot.haloB.scale.set(1 + pu, 1 + pu, 1);

      const xu = xPx / u;
      const yu = floorPx / u + yPx / u;
      rig.position.set(xu, yu, 0);
      rig.rotation.z = lean + bank;

      // Glow while flying
      if (Math.abs(glow - glowApplied) > 0.004) {
        glowApplied = glow;
        for (const e of glowMats) {
          if (e.basic) (e.m as THREE.MeshBasicMaterial).color.copy(e.color).multiplyScalar(1 + 1.1 * glow);
          else {
            const m = e.m as THREE.MeshStandardMaterial;
            m.emissive.copy(e.emissive).lerp(warmTint, glow * 0.2);
            m.emissiveIntensity = e.ei + 0.12 * glow;
          }
        }
      }
      const pulse = 0.88 + 0.12 * Math.sin(t * 2.4);
      auraWarm.position.set(xu, yu + 3.6, -1.2);
      auraBlue.position.set(xu, yu + 3.9, -1);
      (auraWarm.material as THREE.SpriteMaterial).opacity = 0.2 * glow * pulse;
      (auraBlue.material as THREE.SpriteMaterial).opacity = 0.08 * glow * pulse;
      glowLight.position.set(xu, yu + 4.2, 4);
      glowLight.intensity = 22 * glow;

      const alt = yPx / u;
      shadow.position.set(xu, floorPx / u + 0.05, 0);
      shadow.scale.setScalar(1 / (1 + alt * 0.45));
      shadowMat.opacity = 0.85 / (1 + alt * 0.8);

      key.position.set(xu + 4, yu + 9, 7);
      key.target.position.set(xu, yu + 3, 0);
      rim.position.set(xu - 6, yu + 5, -6);
    };

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = false;
    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      frame(clock.elapsedTime, dt);
      renderer.render(scene, cam);
      raf = requestAnimationFrame(loop);
    };
    const run = () => {
      if (!raf && visible && !document.hidden && !reduce) {
        clock.getDelta();
        raf = requestAnimationFrame(loop);
      }
    };

    const staticPose = () => {
      measure();
      phase = "lean";
      xPx = L.xLean;
      yaw = 0.3;
      lean = LEAN;
      for (let i = 0; i < 30; i++) frame(i * 0.05, 0.05);
      renderer.render(scene, cam);
    };

    measure();
    xPx = L.xLean;
    const ro = new ResizeObserver(() => {
      if (reduce) staticPose();
      else {
        const leaning = phase === "lean";
        measure();
        if (leaning) xPx = L.xLean;
      }
    });
    ro.observe(section);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (reduce) staticPose();
          else run();
        }
      },
      { threshold: [0, 0.15] }
    );
    io.observe(section);
    document.addEventListener("visibilitychange", run);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", run);
      setPointed(false);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) x.dispose();
      });
      glowTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={host} className="pointer-events-none absolute inset-0 z-20" aria-hidden="true" />;
}
