"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

function faceTexture() {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const base = g.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S / 2);
  base.addColorStop(0, "#ead08f");
  base.addColorStop(0.6, "#c39a4b");
  base.addColorStop(1, "#8d6a2b");
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);

  // Engraved wave rings, like the guilloche on a banknote
  g.strokeStyle = "rgba(70,46,10,0.35)";
  g.lineWidth = 1.4;
  for (let k = 0; k < 34; k++) {
    g.beginPath();
    for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.01) {
      const r = 150 + k * 5 + 7 * Math.sin(t * 14 + k * 0.22);
      const x = S / 2 + r * Math.cos(t);
      const y = S / 2 + r * Math.sin(t);
      if (t === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  // Rim and lettering
  g.strokeStyle = "rgba(60,38,6,0.7)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(S / 2, S / 2, 470, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.arc(S / 2, S / 2, 330, 0, Math.PI * 2);
  g.stroke();

  const text = "MISVOR  \u2022  AI AND AUTOMATION  \u2022  WORLDWIDE  \u2022  ";
  g.fillStyle = "#3a2608";
  g.font = '600 62px "Bodoni Moda", Georgia, serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    g.save();
    g.translate(S / 2, S / 2);
    g.rotate(i * step - Math.PI / 2);
    g.translate(0, -400);
    g.fillText(text[i], 0, 0);
    g.restore();
  }

  g.font = '700 128px "Bodoni Moda", Georgia, serif';
  g.fillStyle = "#3a2608";
  g.fillText("MISVOR", S / 2, S / 2 - 6);
  g.fillStyle = "rgba(255,240,200,0.5)";
  g.fillText("MISVOR", S / 2 - 3, S / 2 - 9);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI / 2;
  return tex;
}

// A struck brass seal that turns slowly and leans toward the cursor.
export default function Medallion({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", opacity: "0", transition: "opacity 1s ease" });
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 7);
    const key = new THREE.DirectionalLight(0xffe3b0, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);

    const tex = faceTexture();
    const face = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.85, roughness: 0.38, envMapIntensity: 1.1 });
    const edge = new THREE.MeshStandardMaterial({ color: 0xc39a4b, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.24, 96, 1), [edge, face, face]);
    coin.rotation.x = Math.PI / 2;
    const rimGeo = new THREE.TorusGeometry(1.46, 0.07, 16, 120);
    const rimA = new THREE.Mesh(rimGeo, edge);
    rimA.position.z = 0.12;
    const rimB = rimA.clone();
    rimB.position.z = -0.12;
    const group = new THREE.Group();
    const body = new THREE.Group();
    body.add(coin, rimA, rimB);
    group.add(body);
    scene.add(group);

    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    let visible = true;
    let t = 0;
    const frame = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      t += 0.016;
      body.rotation.y = t * 0.5;
      group.rotation.x += (py * 0.35 - group.rotation.x) * 0.06;
      group.rotation.z += (-px * 0.12 - group.rotation.z) * 0.06;
      group.position.y = Math.sin(t * 0.9) * 0.06;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", start);
    start();
    requestAnimationFrame(() => (canvas.style.opacity = "1"));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onMove);
      coin.geometry.dispose();
      rimGeo.dispose();
      face.dispose();
      edge.dispose();
      tex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={host} className={className} aria-hidden="true" />;
}
