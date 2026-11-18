// A low-poly Times Square, looking south at One Times Square.
// Every billboard is a designed ad for one of Brendan's projects, drawn on a
// canvas in one shared layout so the whole scene reads as one designed object.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const mount = document.querySelector(".city");
const panel = document.querySelector(".city-panel");
const tip = document.querySelector(".city-tip");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- The ads ----------
// Each ad: what it links to, its two-tone palette, and its copy.
const ADS = [
  { id: "name", kind: "name" },
  { id: "journey", title: "Journey", kicker: "Capstone, 2026", headline: "Every inch counts.",
    sub: "Child growth and nutrition, made clear for parents and doctors.",
    img: "assets/images/Journey.png", fit: "contain",
    bg: "#0e4d33", dark: "#06281a", light: "#8ff0b4", ink: "#ffffff",
    href: "https://zion.luddy.indiana.edu/info-capstone-2026/journey", external: true,
    blurb: "My Informatics capstone at Indiana University: a platform that helps parents and healthcare providers track a child's growth and nutrition, spot concerning trends early, and get health alerts." },
  { id: "spider", title: "Spider-History", kicker: "Web design", headline: "60 years. One web.",
    sub: "A 12-page archive of Spider-Man's history.",
    img: "assets/images/swinging_spiderman_cover.webp",
    bg: "#b5121b", dark: "#3d0509", light: "#ffd84a", ink: "#ffffff",
    href: "projects/spiderman.html",
    blurb: "A multi-page site that organizes Spider-Man's history by decade, creators, and villains, built around clear information architecture and consistent navigation." },
  { id: "ots", title: "Fortnite × One Times Square", kicker: "Fly Studio", headline: "2 million views. One ball drop.",
    sub: "A New Year's Eve Fortnite map for Times Square.",
    img: "assets/images/OTS2.jpg",
    bg: "#1f2bd8", dark: "#0a0d45", light: "#ff5ad6", ink: "#ffffff",
    href: "projects/fortnite.html",
    blurb: "At Fly Studio I designed and launched a custom Fortnite Creative map for a New Year's Eve campaign with One Times Square. It reached 2M+ views on Fortnite's official Instagram." },
  { id: "lego", title: "LEGO Intelligence Agent", kicker: "Dashboard", headline: "Never miss a brick.",
    sub: "Release dates and retiring sets, tracked automatically.",
    img: "assets/images/lego-intel.jpg",
    bg: "#ffcc00", dark: "#1b1300", light: "#fff3b0", ink: "#1b1300",
    href: "https://brandino101234.github.io/lego-intelligence-agent/", external: true,
    blurb: "A dashboard that tracks upcoming LEGO releases, sets about to retire, gifts with purchase, and the BrickLink Designer Program. Python scrapers run on a schedule and rebuild it automatically." },
  { id: "brandinos", title: "BrandinosBuilds", kicker: "Brand and content design", headline: "Brick by brick.",
    sub: "Thumbnails, channel art, and series formats for a LEGO brand.",
    img: "assets/images/about/lego.jpg",
    bg: "#ff5a1f", dark: "#3a1103", light: "#ffe2c9", ink: "#ffffff",
    href: "about.html",
    blurb: "I founded BrandinosBuilds and design all of its visual content across TikTok, Instagram, and YouTube: thumbnails, channel art, in-video graphics, and recurring series like Brick Blur." },
  { id: "vr", title: "Mindfulness in VR", kicker: "VR, Unity", headline: "Breathe in. Log out.",
    sub: "An immersive meditation experience.",
    img: "assets/images/VRcover.jpg",
    bg: "#5a2bd6", dark: "#1a0b47", light: "#a6ecff", ink: "#ffffff",
    href: "https://www.youtube.com/watch?v=U2gG0RcOsK4", external: true,
    blurb: "A virtual reality meditation experience built in Unity, with interactive environments and calming visuals designed to help people relax." },
  { id: "draft", title: "Draft DNA", kicker: "Data app", headline: "Draft night, decoded.",
    sub: "Career projections for 1,833 NBA picks.",
    art: "draft",
    bg: "#0d1530", dark: "#06102a", light: "#4aa3ff", ink: "#ffffff",
    href: "https://draft-dna.streamlit.app", external: true,
    blurb: "An NBA draft analytics app. Every pick since 1996 gets a projection from draft-night data only, then a grade as his career unfolds, with prospect cards for 1,833 players." },
  { id: "robot", title: "Arduino Tank Robot", kicker: "Hardware", headline: "Meet Turny.",
    sub: "A servo-driven tank robot.",
    img: "assets/images/arduino2.jpg",
    bg: "#c6ff3d", dark: "#14213d", light: "#f4ffd6", ink: "#14213d",
    href: "projects/robot.html",
    blurb: "A small tank robot I built with Arduino and servo motors, with button-triggered movement sequences and a lot of hardware debugging." },
  { id: "about", title: "About me", kicker: "Indiana University, 2026", headline: "Hi, I'm Brendan.",
    sub: "Designer. LEGO builder. IRONMAN 70.3 finisher.",
    img: "assets/images/about/sample-gates.jpg", focusY: 0.3,
    bg: "#14213d", dark: "#0a1122", light: "#ffcf5a", ink: "#ffffff",
    href: "about.html",
    blurb: "I'm a designer and Informatics graduate from Indiana University, with minors in Business and Financial Literacy from the Kelley School. Outside of work: LEGO, triathlons, and basketball." },
  { id: "resume", kind: "led", title: "Resume", kicker: "PDF, one page", headline: "Now hiring?", sub: "Read the resume",
    href: "assets/resume/brendan-nussenblatt-resume.pdf", external: true,
    blurb: "My one-page resume, as a PDF." },
];
const AD = Object.fromEntries(ADS.map((a) => [a.id, a]));

// ---------- Canvas helpers ----------
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Draw an image into a box as a two-tone (duotone) print, so photos and
// screenshots all share one look.
function drawDuotone(ctx, img, x, y, w, h, dark, light, fit = "cover", focusY = 0.5) {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(w));
  off.height = Math.max(1, Math.round(h));
  const o = off.getContext("2d");
  o.fillStyle = light;
  o.fillRect(0, 0, off.width, off.height);
  if (img) {
    const r = fit === "contain"
      ? Math.min(off.width / img.width, off.height / img.height) * 0.86
      : Math.max(off.width / img.width, off.height / img.height);
    const iw = img.width * r, ih = img.height * r;
    o.drawImage(img, (off.width - iw) / 2, (off.height - ih) * focusY, iw, ih);
  }
  const data = o.getImageData(0, 0, off.width, off.height);
  const d = data.data, a = hexToRgb(dark), b = hexToRgb(light);
  for (let i = 0; i < d.length; i += 4) {
    let t = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    t = Math.min(1, Math.max(0, (t - 0.08) * 1.25)); // a little extra contrast
    d[i] = a[0] + (b[0] - a[0]) * t;
    d[i + 1] = a[1] + (b[1] - a[1]) * t;
    d[i + 2] = a[2] + (b[2] - a[2]) * t;
  }
  o.putImageData(data, 0, 0);
  ctx.drawImage(off, x, y);
}

// Draft DNA key visual: a basketball with a projection range bar across it
// (floor, median, ceiling), the core idea of the app.
function drawDraftArt(ctx, x, y, w, h, ad) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = ad.dark;
  ctx.fillRect(x, y, w, h);

  // Basketball
  const r = Math.min(w, h) * 0.42;
  const cx = x + w * 0.5, cy = y + h * 0.46;
  const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  grad.addColorStop(0, "#7cc0ff");
  grad.addColorStop(1, "#1d4f9e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ad.dark;
  ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx - r * 1.35, cy, r * 1.0, -0.72, 0.72); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 1.35, cy, r * 1.0, Math.PI - 0.72, Math.PI + 0.72); ctx.stroke();

  // Projection range bar across the ball
  const barY = cy + r * 0.62;
  const x0 = x + w * 0.1, x1 = x + w * 0.9;
  const lo = x0 + (x1 - x0) * 0.18, hi = x0 + (x1 - x0) * 0.86, mid = x0 + (x1 - x0) * 0.47;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = h * 0.018;
  ctx.beginPath(); ctx.moveTo(x0, barY); ctx.lineTo(x1, barY); ctx.stroke();
  ctx.strokeStyle = ad.light;
  ctx.lineWidth = h * 0.05;
  ctx.beginPath(); ctx.moveTo(lo, barY); ctx.lineTo(hi, barY); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(mid, barY, h * 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ad.dark;
  ctx.lineWidth = h * 0.012;
  ctx.stroke();

  // Labels under the bar
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.font = `800 ${Math.round(h * 0.055)}px "Big Shoulders Display"`;
  ctx.textAlign = "left";
  ctx.fillText("FLOOR", lo - h * 0.02, barY + h * 0.05);
  ctx.textAlign = "right";
  ctx.fillText("CEILING", hi + h * 0.02, barY + h * 0.05);
  ctx.textAlign = "center";
  ctx.fillStyle = ad.light;
  ctx.fillText("#1 PICK", mid, y + h * 0.05);
  ctx.textAlign = "left";
  ctx.restore();
}

// Break a headline into lines that fit a width at a given font
function wrap(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function fitHeadline(ctx, text, maxW, maxH, startSize) {
  let size = startSize;
  let lines;
  do {
    ctx.font = `900 ${size}px "Big Shoulders Display"`;
    lines = wrap(ctx, text.toUpperCase(), maxW);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * size * 0.92 <= maxH && widest <= maxW) break;
    size -= 4;
  } while (size > 24);
  return { size, lines };
}

// One shared ad layout: picture on top (or left), headline, a footer strip
async function makeAdTexture(ad, aspect) {
  const H = 1024, W = Math.round(H * aspect);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const pad = Math.round(Math.min(W, H) * 0.06);

  if (ad.kind === "name") {
    ctx.fillStyle = "#0b3ea8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    const { size, lines } = fitHeadline(ctx, "Brendan Nussenblatt", W - pad * 2, H * 0.6, 260);
    ctx.textBaseline = "top";
    lines.forEach((l, i) => ctx.fillText(l, pad, pad * 1.4 + i * size * 0.92));
    ctx.font = `900 ${Math.round(H * 0.07)}px "Doto", monospace`;
    ctx.fillStyle = "#ffcf5a";
    ctx.fillText("DESIGNER, NEW YORK", pad, H - pad - H * 0.08);
    return new THREE.CanvasTexture(c);
  }

  if (ad.kind === "led") {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,176,32,0.10)";
    for (let y = 6; y < H; y += 14) for (let x = 6; x < W; x += 14) ctx.fillRect(x, y, 4, 4);
    ctx.fillStyle = "#ffb020";
    ctx.shadowColor = "rgba(255,176,32,0.8)";
    ctx.shadowBlur = 24;
    ctx.textBaseline = "top";
    ctx.font = `900 ${Math.round(H * 0.11)}px "Doto", monospace`;
    ctx.fillText(ad.headline.toUpperCase(), pad, H * 0.28);
    const big = fitHeadline(ctx, ad.sub, W - pad * 2, H * 0.4, 220);
    ctx.font = `900 ${big.size}px "Doto", monospace`;
    big.lines.forEach((l, i) => ctx.fillText(l, pad, H * 0.45 + i * big.size));
    return new THREE.CanvasTexture(c);
  }

  const img = ad.img ? await loadImage(ad.img) : null;
  ctx.fillStyle = ad.bg;
  ctx.fillRect(0, 0, W, H);

  const landscape = aspect > 1.15;
  const footerH = Math.round(H * 0.085);
  let textX, textY, textW, textH;

  if (landscape) {
    const imgW = Math.round(W * 0.5);
    if (ad.art === "draft") drawDraftArt(ctx, 0, 0, imgW, H - footerH, ad);
    else drawDuotone(ctx, img, 0, 0, imgW, H - footerH, ad.dark, ad.light, ad.fit, ad.focusY);
    textX = imgW + pad; textY = pad; textW = W - imgW - pad * 2; textH = H - footerH - pad * 2;
  } else {
    const imgH = Math.round(H * 0.5);
    if (ad.art === "draft") drawDraftArt(ctx, 0, 0, W, imgH, ad);
    else drawDuotone(ctx, img, 0, 0, W, imgH, ad.dark, ad.light, ad.fit, ad.focusY);
    textX = pad; textY = imgH + pad * 0.8; textW = W - pad * 2; textH = H - imgH - footerH - pad * 1.6;
  }

  // Headline, then a one-line subhead under it
  ctx.fillStyle = ad.ink;
  ctx.textBaseline = "top";
  const subSize = Math.round(Math.min(W, H) * 0.045);
  const head = fitHeadline(ctx, ad.headline, textW, textH - subSize * 3.2, landscape ? 200 : 170);
  head.lines.forEach((l, i) => ctx.fillText(l, textX, textY + i * head.size * 0.92));
  ctx.font = `600 ${subSize}px "Archivo", sans-serif`;
  ctx.globalAlpha = 0.9;
  const subLines = wrap(ctx, ad.sub, textW);
  const subY = textY + head.lines.length * head.size * 0.92 + subSize * 0.8;
  subLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, textX, subY + i * subSize * 1.25));
  ctx.globalAlpha = 1;

  // Footer strip: project name on the left, "BN" mark on the right
  ctx.fillStyle = ad.dark;
  ctx.fillRect(0, H - footerH, W, footerH);
  ctx.fillStyle = ad.light;
  ctx.font = `800 ${Math.round(footerH * 0.5)}px "Big Shoulders Display"`;
  ctx.textBaseline = "middle";
  ctx.fillText(ad.title.toUpperCase(), pad, H - footerH / 2);
  ctx.textAlign = "right";
  ctx.fillText("BN", W - pad, H - footerH / 2);
  ctx.textAlign = "left";

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// ---------- Scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
mount.prepend(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0c0a22");
scene.fog = new THREE.Fog("#0c0a22", 80, 210);

const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 400);
const HOME = { pos: new THREE.Vector3(0, 7, 36), target: new THREE.Vector3(0, 34, -40) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.45;
controls.minAzimuthAngle = -0.55;
controls.maxAzimuthAngle = 0.55;
controls.minPolarAngle = 1.15;
controls.maxPolarAngle = 1.72;

scene.add(new THREE.HemisphereLight("#6f7bff", "#1a0f2e", 0.55));
const warm = new THREE.DirectionalLight("#ffb27a", 0.6);
warm.position.set(20, 40, 30);
scene.add(warm);

// Seeded random numbers, so the city is laid out the same on every visit
let seed = 24;
function random() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Lit windows texture shared by every building
function windowsTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, 128, 256);
  for (let y = 4; y < 256; y += 10) {
    for (let x = 4; x < 128; x += 8) {
      const r = random();
      g.fillStyle = r > 0.86 ? "#ffd59a" : r > 0.8 ? "#8ea4ff" : "#05040c";
      g.fillRect(x, y, 4, 5);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const winTex = windowsTexture();

const buildingColors = ["#1c1a3f", "#221f4a", "#191734", "#272350", "#1e2446"];
function building(x, z, w, d, h, color) {
  const mat = new THREE.MeshLambertMaterial({
    color: color || buildingColors[Math.floor(random() * buildingColors.length)],
    emissive: "#ffffff",
    emissiveMap: winTex.clone(),
    emissiveIntensity: 0.32,
    flatShading: true,
  });
  mat.emissiveMap.repeat.set(Math.max(1, w / 4), Math.max(1, h / 6));
  mat.emissiveMap.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, h / 2, z);
  scene.add(m);
  return m;
}

// Street, sidewalks, crosswalks
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: "#14122a" }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 220), new THREE.MeshLambertMaterial({ color: "#0d0c1c" }));
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.02, -40);
scene.add(road);
const stripeMat = new THREE.MeshBasicMaterial({ color: "#cfd3ff" });
for (const zc of [18, -20]) {
  for (let i = -7; i <= 7; i += 1.6) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4), stripeMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set(i, 0.04, zc);
    scene.add(s);
  }
}

// The red TKTS steps, in the foreground
const steps = new THREE.Group();
const stepMat = new THREE.MeshStandardMaterial({ color: "#d0102a", emissive: "#ff1a3a", emissiveIntensity: 0.85, roughness: 0.6 });
for (let i = 0; i < 6; i++) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 2.2), stepMat);
  s.position.set(0, 0.35 + i * 0.7, 30 + i * 2.2);
  steps.add(s);
}
scene.add(steps);

// Side buildings, both sides of the square
const rng = (a, b) => a + random() * (b - a);
for (const side of [-1, 1]) {
  let z = 34;
  while (z > -120) {
    const d = rng(10, 16);
    // Inner faces stay at least 18 units from the street so billboards sit in front
    building(side * rng(25, 28), z - d / 2, rng(10, 14), d, rng(28, 70));
    z -= d + 0.5;
  }
  // a second, taller row behind
  for (let z2 = 20; z2 > -140; z2 -= 18) building(side * rng(40, 48), z2, 14, 14, rng(50, 100));
}

// One Times Square: the tower at the end of the square
const tower = new THREE.Group();
const towerMat = new THREE.MeshLambertMaterial({ color: "#16142e", flatShading: true });
const shaft = new THREE.Mesh(new THREE.BoxGeometry(10, 64, 9), towerMat);
shaft.position.y = 32;
tower.add(shaft);
const crown = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 6), towerMat);
crown.position.y = 67;
tower.add(crown);
const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 6), towerMat);
mast.position.y = 74;
tower.add(mast);

// The ball, low-poly and glowing
const ball = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.6, 1),
  new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#9fd8ff", emissiveIntensity: 1.1, flatShading: true, metalness: 0.2, roughness: 0.3 })
);
ball.position.y = 79;
tower.add(ball);
tower.position.set(0, 0, -45);
scene.add(tower);

// The zipper: an LED ticker band around the tower
function zipperTexture() {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#050505";
  g.fillRect(0, 0, c.width, c.height);
  g.font = '900 60px "Doto", monospace';
  g.fillStyle = "#ffb020";
  g.textBaseline = "middle";
  g.fillText("BRENDAN NUSSENBLATT ◆ DESIGNER ◆ NEW YORK ◆ NOW SHOWING ◆ ", 20, 50);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const zipTex = zipperTexture();
const zipper = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.6, 9.6), new THREE.MeshBasicMaterial({ map: zipTex }));
zipper.position.set(0, 14, -45);
scene.add(zipper);

// Taxis
const taxis = [];
const taxiMat = new THREE.MeshLambertMaterial({ color: "#ffc61a", emissive: "#5a3d00", flatShading: true });
const lightMat = new THREE.MeshBasicMaterial({ color: "#fff6d8" });
for (let i = 0; i < 8; i++) {
  const t = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4.2), taxiMat);
  body.position.y = 0.8;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), taxiMat);
  cab.position.y = 1.6;
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.1), lightMat);
  lamp.position.set(0, 0.9, 2.12);
  t.add(body, cab, lamp);
  const lane = i % 2 === 0 ? -3.5 : 3.5;
  t.position.set(lane, 0, -120 + i * 22);
  t.userData.speed = (lane < 0 ? 1 : -1) * rng(9, 14);
  if (lane > 0) t.rotation.y = Math.PI;
  scene.add(t);
  taxis.push(t);
}

// ---------- Billboards ----------
// Each one: which ad, where, which way it faces, and its size in world units.
const BOARDS = [
  { ad: "name",      pos: [0, 58, -40.3],   rotY: 0, w: 8.6, h: 7.2 },
  { ad: "journey",   pos: [0, 48, -40.3],   rotY: 0, w: 8.6, h: 10.4 },
  { ad: "spider",    pos: [0, 36.5, -40.3], rotY: 0, w: 8.6, h: 10.4 },
  { ad: "ots",       pos: [0, 25, -40.3],   rotY: 0, w: 8.6, h: 10.4 },
  { ad: "about",     pos: [-13.6, 27, 0],   rotY: 0.72, w: 11, h: 14.5 },
  { ad: "brandinos", pos: [-13.6, 19, -18], rotY: 0.72, w: 13, h: 8.6 },
  { ad: "draft",     pos: [-13.6, 41, -26], rotY: 0.7, w: 13, h: 8.8 },
  { ad: "lego",      pos: [13.6, 27, 0],    rotY: -0.72, w: 11, h: 14.5 },
  { ad: "vr",        pos: [13.6, 19.5, -17], rotY: -0.72, w: 8.5, h: 11 },
  { ad: "robot",     pos: [13.6, 41.5, -24],  rotY: -0.7, w: 8.5, h: 10.5 },
  { ad: "resume",    pos: [13.6, 11, -32], rotY: -0.7, w: 11, h: 5.5 },
];

const boardMeshes = [];
const frameMat = new THREE.MeshLambertMaterial({ color: "#0a0918", flatShading: true });

async function buildBoards() {
  await Promise.all([
    document.fonts.load('900 100px "Big Shoulders Display"'),
    document.fonts.load('800 100px "Big Shoulders Display"'),
    document.fonts.load('900 60px "Doto"'),
    document.fonts.load('600 40px "Archivo"'),
  ]).catch(() => {});

  for (const b of BOARDS) {
    const ad = AD[b.ad];
    const tex = await makeAdTexture(ad, b.w / b.h);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    mat.color.setScalar(0.92);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), mat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, b.h + 0.6, 0.5), frameMat);
    frame.position.z = -0.3;
    const g = new THREE.Group();
    g.add(frame, screen);
    g.position.set(...b.pos);
    g.rotation.y = b.rotY;
    scene.add(g);
    if (ad.href) {
      screen.userData = { ad, board: b, group: g };
      boardMeshes.push(screen);
    }
  }
}

// ---------- Interaction ----------
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;
let focused = null;

function setPointer(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

function pick() {
  ray.setFromCamera(pointer, camera);
  const hit = ray.intersectObjects(boardMeshes, false)[0];
  return hit ? hit.object : null;
}

function setHover(mesh, e) {
  if (hovered && hovered !== mesh) hovered.material.color.setScalar(0.92);
  hovered = mesh;
  if (mesh) {
    mesh.material.color.setScalar(1.25);
    renderer.domElement.style.cursor = "pointer";
    tip.textContent = mesh.userData.ad.title;
    tip.style.left = e.clientX - mount.getBoundingClientRect().left + "px";
    tip.style.top = e.clientY - mount.getBoundingClientRect().top + "px";
    tip.classList.add("is-visible");
  } else {
    renderer.domElement.style.cursor = "grab";
    tip.classList.remove("is-visible");
  }
}

renderer.domElement.addEventListener("pointermove", (e) => {
  if (focused) return;
  setPointer(e);
  setHover(pick(), e);
});
renderer.domElement.addEventListener("pointerleave", () => setHover(null));
renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (moved > 6) return; // that was a drag, not a click
  setPointer(e);
  const mesh = pick();
  if (mesh) focusBoard(mesh);
});

// Smooth camera moves
let tween = null;
function flyTo(pos, target, ms = 1100) {
  if (reduceMotion) ms = 0;
  tween = { from: camera.position.clone(), fromT: controls.target.clone(), pos, target, t0: performance.now(), ms };
}

function focusBoard(mesh) {
  const { ad, group, board } = mesh.userData;
  focused = mesh;
  setHover(null);
  controls.enabled = false;
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(group.quaternion);
  const dist = Math.max(board.w, board.h) * 1.55;
  const target = group.position.clone();
  const pos = target.clone().add(normal.multiplyScalar(dist));
  // On wide screens, slide the view so the billboard sits left of the panel
  if (mount.clientWidth > 900) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(group.quaternion).multiplyScalar(board.w * 0.6);
    target.add(right);
    pos.add(right);
  }
  flyTo(pos, target);
  mount.classList.add("is-focused");

  panel.querySelector(".kicker").textContent = ad.kicker;
  panel.querySelector("h2").textContent = ad.title;
  panel.querySelector("p").textContent = ad.blurb;
  const link = panel.querySelector(".open");
  link.href = ad.href;
  link.textContent = ad.id === "resume" ? "Open the resume" : ad.id === "about" ? "Read about me" : "Open the project";
  if (ad.external) { link.target = "_blank"; link.rel = "noopener"; } else { link.removeAttribute("target"); link.removeAttribute("rel"); }
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("is-open"));
  link.focus({ preventScroll: true });
}

function backToSquare() {
  if (!focused) return;
  focused = null;
  mount.classList.remove("is-focused");
  panel.classList.remove("is-open");
  setTimeout(() => { panel.hidden = true; }, 250);
  flyTo(HOME.pos.clone(), HOME.target.clone());
}

panel.querySelector(".back").addEventListener("click", backToSquare);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") backToSquare(); });

// ---------- Rendering ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.5, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = mount.clientWidth, h = mount.clientHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  // Narrow screens: step back so the tower and both sides still fit
  camera.fov = w / h < 0.9 ? 68 : 50;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(mount);
resize();

let visible = true;
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(mount);

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!visible || document.hidden) return;

  if (tween) {
    const k = tween.ms === 0 ? 1 : Math.min(1, (performance.now() - tween.t0) / tween.ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(tween.from, tween.pos, e);
    controls.target.lerpVectors(tween.fromT, tween.target, e);
    camera.lookAt(controls.target);
    if (k === 1) {
      tween = null;
      if (!focused) controls.enabled = true;
    }
  } else if (controls.enabled) {
    controls.update();
  }

  if (!reduceMotion) {
    ball.rotation.y += dt * 0.25;
    zipTex.offset.x += dt * 0.06;
    for (const t of taxis) {
      t.position.z += t.userData.speed * dt;
      if (t.position.z > 40) t.position.z = -140;
      if (t.position.z < -140) t.position.z = 40;
    }
  }
  composer.render();
}

buildBoards().then(() => {
  mount.classList.add("is-ready");
  frame();
});
