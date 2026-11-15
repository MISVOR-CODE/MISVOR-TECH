"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildScene, disposeTree, makeGlow, type SceneKind } from "./scenes";

type Props = {
  kind: SceneKind;
  className?: string;
  /** Drag to turn. Turn off for purely decorative placements. */
  interactive?: boolean;
  /** When false the scene is not created (or stops rendering) until it becomes true again. */
  active?: boolean;
};

type Ctl = { dispose: () => void; setActive: (on: boolean) => void };

// Owns everything that is not specific to one scene: the renderer, lights, the camera
// framing, drag to turn, pausing when off screen, and cleanup. The WebGL context is only
// created once the element is close to the viewport (and active), so a page with several
// scenes does not pay for the ones it is not showing.
export default function Stage({ kind, className = "", interactive = true, active = true }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const ctl = useRef<Ctl | null>(null);
  const boot = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeRef.current = active;
    ctl.current?.setActive(active);
    boot.current?.();
  }, [active]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let visible = false;
    const tryStart = () => {
      if (disposed || ctl.current || !visible || !activeRef.current) return;
      ctl.current = start(el, kind, interactive, activeRef.current);
    };
    boot.current = tryStart;
    const gate = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        visible = true;
        gate.disconnect();
        tryStart();
      },
      { rootMargin: "240px" }
    );
    gate.observe(el);
    return () => {
      disposed = true;
      boot.current = null;
      gate.disconnect();
      ctl.current?.dispose();
      ctl.current = null;
    };
  }, [kind, interactive]);

  return (
    <div
      ref={host}
      className={className}
      aria-hidden="true"
      style={{ cursor: interactive ? "grab" : undefined, touchAction: "pan-y" }}
    />
  );
}

function start(el: HTMLDivElement, kind: SceneKind, interactive: boolean, initiallyActive: boolean): Ctl | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null; // No WebGL: the CSS light shafts behind the scene still carry the page.
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    width: "100%",
    height: "100%",
    display: "block",
    opacity: "0",
    transition: "opacity 1.2s ease"
  });
  el.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffe3b0, 2.4);
  key.position.set(4, 7, 6);
  const rim = new THREE.DirectionalLight(0x6f9bd6, 1.2);
  rim.position.set(-6, 2, -5);
  scene.add(key, rim);

  const glow = makeGlow();
  const built = buildScene(kind, { glow });
  // `pivot` carries what the visitor does with the mouse. The scene keeps its own motion inside.
  const pivot = new THREE.Group();
  pivot.add(built.root);
  scene.add(pivot);
  if (built.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const r = built.radius * 1.15;
    Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 40 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 3;
    built.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      if (mat.type === "MeshStandardMaterial" || mat.type === "MeshPhysicalMaterial") {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }
  const baseTilt = built.tilt ?? 0.1;
  pivot.rotation.x = baseTilt;

  // Frame the scene: the camera sits where a sphere of the scene's radius just fits
  // the narrower side of the canvas, with a margin, so nothing is ever clipped.
  const frame = () => {
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const dist = (built.radius * 1.14) / Math.sin(Math.min(vFov, hFov) / 2);
    const elev = built.elev ?? 0.12;
    camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.near = Math.max(0.1, dist - built.radius * 2);
    camera.far = dist + built.radius * 3;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(frame);
  ro.observe(el);
  frame();

  // Drag to turn. Scenes that spin keep the new angle, scenes that sway ease back.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let userY = 0;
  let userX = baseTilt;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    userY += (e.clientX - lastX) * 0.008;
    userX = THREE.MathUtils.clamp(userX + (e.clientY - lastY) * 0.004, baseTilt - 0.5, baseTilt + 0.6);
    lastX = e.clientX;
    lastY = e.clientY;
    if (reduce) {
      pivot.rotation.set(userX, userY, 0);
      renderer.render(scene, camera);
    }
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    el.style.cursor = "grab";
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };
  if (interactive) {
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  let raf = 0;
  let visible = true;
  let enabled = initiallyActive;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = 0;
    if (!visible || !enabled || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    built.root.rotation.y += built.spin * dt;
    built.update?.(dt, t);
    if (!dragging && built.spin === 0) userY *= 1 - Math.min(1, dt * 2);
    if (!dragging) userX += (baseTilt - userX) * Math.min(1, dt * 1.5);
    pivot.rotation.x += (userX - pivot.rotation.x) * 0.12;
    pivot.rotation.y += (userY - pivot.rotation.y) * 0.12;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!raf && !reduce && visible && enabled && !document.hidden) {
      clock.getDelta();
      raf = requestAnimationFrame(tick);
    }
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) run();
  });
  io.observe(el);
  document.addEventListener("visibilitychange", run);
  run();
  requestAnimationFrame(() => (canvas.style.opacity = "1"));

  const dispose = () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", run);
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    disposeTree(scene);
    glow.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  return {
    dispose,
    setActive(on: boolean) {
      enabled = on;
      if (on) run();
    }
  };
}
