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
  { id: "journey", title: "Journey", kicker: "Capstone, 2026", headline: "Every inch counts",
    sub: "Child growth and nutrition, made clear for parents and doctors.",
    art: "journey",
    bg: "#0e4d33", dark: "#06281a", light: "#8ff0b4", ink: "#ffffff",
    href: "https://zion.luddy.indiana.edu/info-capstone-2026/journey", external: true,
    blurb: "My Informatics capstone at Indiana University: a platform that helps parents and healthcare providers track a child's growth and nutrition, spot concerning trends early, and get health alerts." },
  { id: "spider", title: "Spider-History", kicker: "Web design", headline: "60 years, one web",
    sub: "A 12-page archive of Spider-Man's history.",
    img: "assets/images/swinging_spiderman_cover.webp",
    bg: "#b5121b", dark: "#3d0509", light: "#ffd84a", ink: "#ffffff",
    href: "projects/spiderman.html",
    fullColor: true,
    blurb: "A multi-page site that organizes Spider-Man's history by decade, creators, and villains, built around clear information architecture and consistent navigation." },
  { id: "ots", title: "Fortnite × One Times Square", kicker: "Fly Studio", headline: "2 million views, one ball drop",
    sub: "A New Year's Eve Fortnite map for Times Square.",
    img: "assets/images/OTS2.jpg",
    bg: "#1f2bd8", dark: "#0a0d45", light: "#ff5ad6", ink: "#ffffff",
    href: "projects/fortnite.html",
    fullColor: true,
    blurb: "At Fly Studio I designed and launched a custom Fortnite Creative map for a New Year's Eve campaign with One Times Square. It reached 2M+ views on Fortnite's official Instagram." },
  { id: "lego", title: "LEGO Intelligence Agent", kicker: "Dashboard", headline: "Never miss a brick",
    sub: "Release dates and retiring sets, tracked automatically.",
    art: "lego",
    bg: "#d01012", dark: "#2a0405", light: "#ffd6d2", ink: "#ffffff",
    href: "https://brandino101234.github.io/lego-intelligence-agent/", external: true,
    blurb: "A dashboard that tracks upcoming LEGO releases, sets about to retire, gifts with purchase, and the BrickLink Designer Program. Python scrapers run on a schedule and rebuild it automatically." },
  { id: "brandinos", title: "BrandinosBuilds", kicker: "Brand and content design", headline: "Brick by brick",
    sub: "Thumbnails, channel art, and series formats for a LEGO brand.",
    art: "brandinos",
    bg: "#ff5a1f", dark: "#3a1103", light: "#ffe2c9", ink: "#ffffff",
    href: "about.html",
    blurb: "I founded BrandinosBuilds and design all of its visual content across TikTok, Instagram, and YouTube: thumbnails, channel art, in-video graphics, and recurring series like Brick Blur." },
  { id: "vr", title: "Mindfulness in VR", kicker: "VR, Unity", headline: "Breathe in, log out",
    sub: "An immersive meditation experience.",
    art: "vr",
    bg: "#5a2bd6", dark: "#1a0b47", light: "#a6ecff", ink: "#ffffff",
    href: "https://www.youtube.com/watch?v=U2gG0RcOsK4", external: true,
    blurb: "A virtual reality meditation experience built in Unity, with interactive environments and calming visuals designed to help people relax." },
  { id: "draft", title: "Draft DNA", kicker: "Data app", headline: "Draft night, decoded",
    sub: "Career projections for 1,833 NBA picks.",
    art: "draft",
    bg: "#0d1530", dark: "#06102a", light: "#4aa3ff", ink: "#ffffff",
    href: "https://draft-dna.streamlit.app", external: true,
    blurb: "An NBA draft analytics app. Every pick since 1996 gets a projection from draft-night data only, then a grade as his career unfolds, with prospect cards for 1,833 players." },
  { id: "robot", title: "Arduino Tank Robot", kicker: "Hardware", headline: "Meet Turny",
    sub: "A servo-driven tank robot.",
    art: "robot",
    bg: "#c6ff3d", dark: "#14213d", light: "#f4ffd6", ink: "#14213d",
    href: "projects/robot.html",
    blurb: "A small tank robot I built with Arduino and servo motors, with button-triggered movement sequences and a lot of hardware debugging." },
  { id: "about", title: "About me", kicker: "Indiana University, 2026", headline: "Hi, I'm Brendan",
    sub: "Designer. LEGO builder. IRONMAN 70.3 finisher.",
    img: "assets/images/about/sample-gates.jpg", focusY: 0.3,
    bg: "#14213d", dark: "#0a1122", light: "#cfdcff", ink: "#ffffff",
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
// Draw a photo in its own colors (cover crop)
function drawFull(ctx, img, x, y, w, h, focusY = 0.5) {
  if (!img) return;
  const r = Math.max(w / img.width, h / img.height);
  const iw = img.width * r, ih = img.height * r;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * focusY, iw, ih);
  ctx.restore();
}

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
  ctx.font = `800 ${Math.round(h * 0.055)}px "Schibsted Grotesk"`;
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

// LEGO Intelligence Agent key visual: a stack of bricks over a release-calendar
// strip, with one set tagged NEW and one tagged RETIRING.
function drawLegoArt(ctx, x, y, w, h, ad) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = ad.dark;
  ctx.fillRect(x, y, w, h);

  // One brick, seen from the front: body, darker base edge, studs on top
  function brick(bx, by, bw, bh, studs, face, shade) {
    const studW = bw / studs * 0.56, studH = bh * 0.26;
    ctx.fillStyle = face;
    for (let i = 0; i < studs; i++) {
      const sx = bx + (bw / studs) * (i + 0.5) - studW / 2;
      ctx.fillRect(sx, by - studH, studW, studH);
      ctx.fillStyle = shade;
      ctx.fillRect(sx + studW * 0.72, by - studH, studW * 0.28, studH);
      ctx.fillStyle = face;
    }
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = shade;
    ctx.fillRect(bx, by + bh * 0.82, bw, bh * 0.18);
    ctx.fillRect(bx + bw * 0.93, by, bw * 0.07, bh);
  }

  const unit = Math.min(w * 0.17, h * 0.13);
  const baseY = y + h * 0.62;
  const left = x + w * 0.5 - unit * 2.6;
  brick(left, baseY - unit, unit * 4, unit, 4, "#ffcc00", "#c99700");
  brick(left + unit * 1.2, baseY - unit * 2.3, unit * 3, unit, 3, "#ff5a1f", "#c23f0e");
  brick(left + unit * 0.4, baseY - unit * 3.6, unit * 2, unit, 2, "#3a8dff", "#1f5fc0");

  // Release-calendar strip
  const tiles = [["NOV", "1"], ["NOV", "4"], ["JAN", "1"], ["DEC", "31"]];
  const stripY = y + h * 0.72, gap = w * 0.025;
  const tileW = (w * 0.86 - gap * (tiles.length - 1)) / tiles.length, tileH = h * 0.2;
  tiles.forEach(([m, d], i) => {
    const tx = x + w * 0.07 + i * (tileW + gap);
    ctx.fillStyle = i === 3 ? "#ff3b3b" : i === 0 ? "#ffcc00" : "rgba(255,243,176,0.14)";
    ctx.fillRect(tx, stripY, tileW, tileH);
    ctx.fillStyle = i === 0 ? ad.dark : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `700 ${Math.round(tileH * 0.24)}px "Schibsted Grotesk"`;
    ctx.fillText(m, tx + tileW / 2, stripY + tileH * 0.12);
    ctx.font = `900 ${Math.round(tileH * 0.5)}px "Schibsted Grotesk"`;
    ctx.fillText(d, tx + tileW / 2, stripY + tileH * 0.4);
  });

  // Tags above the first and last tiles
  ctx.font = `800 ${Math.round(h * 0.05)}px "Schibsted Grotesk"`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffcc00";
  ctx.fillText("NEW", x + w * 0.07, stripY - h * 0.065);
  ctx.textAlign = "right";
  ctx.fillStyle = "#ff6b6b";
  ctx.fillText("RETIRING", x + w * 0.93, stripY - h * 0.065);
  ctx.textAlign = "left";
  ctx.restore();
}

// ---------- Drawn key visuals ----------
// Shared helpers so every visual uses the same frame, type, and colors.
function artFrame(ctx, x, y, w, h, ad) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = ad.dark;
  ctx.fillRect(x, y, w, h);
}
function artLabel(ctx, text, tx, ty, size, color, align = "left") {
  ctx.font = `800 ${Math.round(size)}px "Schibsted Grotesk"`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, tx, ty);
  ctx.textAlign = "left";
}

// Journey: a growth chart with a height ruler
function drawJourneyArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  const gx = x + w * 0.2, gy = y + h * 0.12, gw = w * 0.72, gh = h * 0.7;
  ctx.strokeStyle = "rgba(143,240,180,0.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(gx, gy + (gh / 5) * i); ctx.lineTo(gx + gw, gy + (gh / 5) * i); ctx.stroke();
  }
  // Ruler down the left side
  ctx.fillStyle = "#e8fff1";
  ctx.fillRect(x + w * 0.06, gy, w * 0.07, gh);
  ctx.fillStyle = ad.dark;
  for (let i = 0; i <= 20; i++) {
    const ty = gy + (gh / 20) * i, long = i % 5 === 0;
    ctx.fillRect(x + w * 0.06, ty - 1.5, w * (long ? 0.05 : 0.028), 3);
  }
  // Growth curve with check-in dots
  const pts = [0, 0.18, 0.33, 0.46, 0.57, 0.66, 0.74, 0.8].map((v, i, a) => [gx + (gw / (a.length - 1)) * i, gy + gh - gh * (0.08 + v)]);
  ctx.strokeStyle = ad.light;
  ctx.lineWidth = h * 0.022;
  ctx.lineJoin = ctx.lineCap = "round";
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  pts.forEach(([px, py], i) => {
    ctx.fillStyle = i === pts.length - 1 ? "#e8fff1" : "#ffffff";
    ctx.beginPath(); ctx.arc(px, py, h * (i === pts.length - 1 ? 0.03 : 0.018), 0, Math.PI * 2); ctx.fill();
  });
  artLabel(ctx, "AGE", gx + gw, gy + gh + h * 0.03, h * 0.06, ad.light, "right");
  ctx.restore();
}

// Spider-History: a web, with a 1962 to 2026 timeline under it
function drawSpiderArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  const cx = x + w * 0.5, cy = y + h * 0.42, R = Math.max(w, h) * 0.62;
  const spokes = 12;
  ctx.strokeStyle = ad.light;
  ctx.lineWidth = h * 0.009;
  for (let i = 0; i < spokes; i++) {
    const a = (Math.PI * 2 / spokes) * i;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
  }
  for (let r = 1; r <= 7; r++) {
    const rr = R * 0.11 * r * (1 + r * 0.06);
    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
      const a0 = (Math.PI * 2 / spokes) * i, a1 = (Math.PI * 2 / spokes) * (i + 1);
      const p0 = [cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr];
      const p1 = [cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr];
      const am = (a0 + a1) / 2, sag = rr * 0.86;
      if (i === 0) ctx.moveTo(...p0);
      ctx.quadraticCurveTo(cx + Math.cos(am) * sag, cy + Math.sin(am) * sag, ...p1);
    }
    ctx.stroke();
  }
  // Timeline band
  const by = y + h * 0.8;
  ctx.fillStyle = ad.dark;
  ctx.fillRect(x, by - h * 0.02, w, h * 0.22);
  ctx.strokeStyle = ad.light;
  ctx.lineWidth = h * 0.012;
  ctx.beginPath(); ctx.moveTo(x + w * 0.08, by + h * 0.06); ctx.lineTo(x + w * 0.92, by + h * 0.06); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const tx = x + w * 0.08 + (w * 0.84 / 6) * i;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(tx, by + h * 0.06, h * 0.016, 0, Math.PI * 2); ctx.fill();
  }
  artLabel(ctx, "1962", x + w * 0.08, by + h * 0.1, h * 0.065, "#ffffff");
  artLabel(ctx, "2026", x + w * 0.92, by + h * 0.1, h * 0.065, "#ffffff", "right");
  ctx.restore();
}

// Fortnite x One Times Square: the ball on the tower, confetti, 2M+
function drawOtsArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  // Confetti
  const colors = [ad.light, "#ffd84a", "#ffffff", "#5ad6ff"];
  let k = 7;
  for (let i = 0; i < 70; i++) {
    k = (k * 9301 + 49297) % 233280;
    const r1 = k / 233280;
    k = (k * 9301 + 49297) % 233280;
    const r2 = k / 233280;
    ctx.fillStyle = colors[i % colors.length];
    ctx.save();
    ctx.translate(x + r1 * w, y + r2 * h * 0.75);
    ctx.rotate(r1 * 6);
    ctx.fillRect(0, 0, w * 0.022, h * 0.01);
    ctx.restore();
  }
  // Tower
  const tw = w * 0.2, tx = x + w * 0.5 - tw / 2, top = y + h * 0.42;
  ctx.fillStyle = "#121540";
  ctx.fillRect(tx, top, tw, h);
  ctx.fillStyle = ad.light;
  for (let i = 0; i < 3; i++) ctx.fillRect(tx + tw * 0.12, top + h * 0.06 + i * h * 0.14, tw * 0.76, h * 0.1);
  ctx.fillStyle = "#121540";
  ctx.fillRect(x + w * 0.5 - w * 0.008, y + h * 0.3, w * 0.016, h * 0.13);
  // The ball: a faceted circle
  const bx = x + w * 0.5, by = y + h * 0.25, br = Math.min(w, h) * 0.13;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#9fd8ff";
  ctx.lineWidth = br * 0.08;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * br, by + Math.sin(a) * br); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(bx, by, br * 0.55, 0, Math.PI * 2); ctx.stroke();
  // 2M+
  ctx.font = `900 ${Math.round(h * 0.2)}px "Schibsted Grotesk"`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("2M+", x + w * 0.06, y + h * 0.04);
  artLabel(ctx, "VIEWS", x + w * 0.06, y + h * 0.24, h * 0.055, ad.light);
  ctx.restore();
}

// Mindfulness in VR: a headset floating over a calm horizon
function drawVrArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  // Sun and horizon
  ctx.fillStyle = "rgba(166,236,255,0.25)";
  ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.7, w * 0.3, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = ad.light;
  ctx.lineWidth = h * 0.01;
  for (let i = 0; i < 4; i++) {
    const wy = y + h * (0.72 + i * 0.07), amp = h * 0.012;
    ctx.globalAlpha = 1 - i * 0.2;
    ctx.beginPath();
    for (let px = 0; px <= w; px += w / 40) {
      const py = wy + Math.sin(px / w * Math.PI * 4 + i) * amp;
      px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Headset
  const hw = w * 0.62, hh = h * 0.22, hx = x + w * 0.5 - hw / 2, hy = y + h * 0.22;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(hx, hy, hw, hh, hh * 0.35); ctx.fill();
  ctx.fillStyle = ad.dark;
  ctx.beginPath(); ctx.roundRect(hx + hw * 0.08, hy + hh * 0.2, hw * 0.36, hh * 0.6, hh * 0.25); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hx + hw * 0.56, hy + hh * 0.2, hw * 0.36, hh * 0.6, hh * 0.25); ctx.fill();
  ctx.fillStyle = ad.light;
  ctx.fillRect(hx - w * 0.06, hy + hh * 0.38, w * 0.06, hh * 0.24);
  ctx.fillRect(hx + hw, hy + hh * 0.38, w * 0.06, hh * 0.24);
  ctx.restore();
}

// Arduino Tank Robot: Turny, drawn from the side
function drawRobotArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  const base = y + h * 0.78;
  // Treads
  ctx.fillStyle = "#0b1226";
  ctx.beginPath(); ctx.roundRect(x + w * 0.12, base - h * 0.12, w * 0.76, h * 0.14, h * 0.07); ctx.fill();
  ctx.fillStyle = ad.light;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(x + w * 0.2 + i * w * 0.15, base - h * 0.05, h * 0.035, 0, Math.PI * 2); ctx.fill();
  }
  // Body
  ctx.fillStyle = "#3aa0ff";
  ctx.fillRect(x + w * 0.18, base - h * 0.36, w * 0.64, h * 0.24);
  ctx.fillStyle = "#c6ff3d";
  ctx.fillRect(x + w * 0.18, base - h * 0.4, w * 0.64, h * 0.05);
  // The ladder arm
  ctx.save();
  ctx.translate(x + w * 0.42, base - h * 0.42);
  ctx.rotate(-0.42);
  ctx.fillStyle = "#ff8a3d";
  const aw = w * 0.62, ah = h * 0.09;
  ctx.fillRect(0, -ah, aw, ah);
  ctx.fillStyle = ad.dark;
  for (let i = 1; i < 8; i++) ctx.fillRect((aw / 8) * i, -ah * 0.8, aw * 0.018, ah * 0.6);
  ctx.restore();
  // Button
  ctx.fillStyle = "#ffd84a";
  ctx.beginPath(); ctx.arc(x + w * 0.7, base - h * 0.42, h * 0.025, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// BrandinosBuilds: a video thumbnail frame with a play button and bricks
function drawBrandinosArt(ctx, x, y, w, h, ad) {
  artFrame(ctx, x, y, w, h, ad);
  const fw = w * 0.84, fh = fw * 9 / 16 > h * 0.7 ? h * 0.7 : fw * 9 / 16;
  const fx = x + (w - fw) / 2, fy = y + h * 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, fh * 0.08); ctx.fill();
  // Pixel blocks: the Brick Blur look
  const cell = fh / 6;
  const palette = ["#ff5a1f", "#ffcc00", "#3a8dff", "#ffe2c9"];
  for (let r = 0; r < 6; r++) for (let c = 0; c < Math.floor(fw / cell); c++) {
    if ((r * 7 + c * 3) % 5 === 0) {
      ctx.fillStyle = palette[(r + c) % palette.length];
      ctx.fillRect(fx + c * cell + 2, fy + r * cell + 2, cell - 4, cell - 4);
    }
  }
  // Play button
  ctx.fillStyle = ad.dark;
  ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, fh * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(fx + fw / 2 - fh * 0.06, fy + fh / 2 - fh * 0.1);
  ctx.lineTo(fx + fw / 2 + fh * 0.11, fy + fh / 2);
  ctx.lineTo(fx + fw / 2 - fh * 0.06, fy + fh / 2 + fh * 0.1);
  ctx.closePath();
  ctx.fill();
  let ls = h * 0.055;
  ctx.font = `700 ${Math.round(ls)}px "Schibsted Grotesk"`;
  while (ctx.measureText("TikTok   Instagram   YouTube").width > fw && ls > 8) {
    ls -= 1;
    ctx.font = `700 ${Math.round(ls)}px "Schibsted Grotesk"`;
  }
  artLabel(ctx, "TikTok   Instagram   YouTube", x + w / 2, fy + fh + h * 0.05, ls, ad.light, "center");
  ctx.restore();
}

const ART = {
  draft: drawDraftArt, lego: drawLegoArt, journey: drawJourneyArt, spider: drawSpiderArt,
  ots: drawOtsArt, vr: drawVrArt, robot: drawRobotArt, brandinos: drawBrandinosArt,
};

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
    ctx.font = `700 ${size}px "Schibsted Grotesk"`;
    lines = wrap(ctx, text, maxW);
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
    ctx.font = `900 ${Math.round(H * 0.07)}px "Schibsted Grotesk"`;
    ctx.fillStyle = "#bcd0ff";
    ctx.fillText("Designer, New York", pad, H - pad - H * 0.08);
    return new THREE.CanvasTexture(c);
  }

  if (ad.kind === "led") {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,90,74,0.10)";
    for (let y = 6; y < H; y += 14) for (let x = 6; x < W; x += 14) ctx.fillRect(x, y, 4, 4);
    ctx.fillStyle = "#ff5a4a";
    ctx.shadowColor = "rgba(255,90,74,0.8)";
    ctx.shadowBlur = 24;
    ctx.textBaseline = "top";
    ctx.font = `900 ${Math.round(H * 0.11)}px "Schibsted Grotesk"`;
    ctx.fillText(ad.headline, pad, H * 0.28);
    const big = fitHeadline(ctx, ad.sub, W - pad * 2, H * 0.4, 220);
    ctx.font = `900 ${big.size}px "Schibsted Grotesk"`;
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
    if (ART[ad.art]) ART[ad.art](ctx, 0, 0, imgW, H - footerH, ad);
    else if (ad.fullColor) drawFull(ctx, img, 0, 0, imgW, H - footerH, ad.focusY);
    else drawDuotone(ctx, img, 0, 0, imgW, H - footerH, ad.dark, ad.light, ad.fit, ad.focusY);
    textX = imgW + pad; textY = pad; textW = W - imgW - pad * 2; textH = H - footerH - pad * 2;
  } else {
    const imgH = Math.round(H * 0.5);
    if (ART[ad.art]) ART[ad.art](ctx, 0, 0, W, imgH, ad);
    else if (ad.fullColor) drawFull(ctx, img, 0, 0, W, imgH, ad.focusY);
    else drawDuotone(ctx, img, 0, 0, W, imgH, ad.dark, ad.light, ad.fit, ad.focusY);
    textX = pad; textY = imgH + pad * 0.8; textW = W - pad * 2; textH = H - imgH - footerH - pad * 1.6;
  }

  // Headline, then a one-line subhead under it
  ctx.fillStyle = ad.ink;
  ctx.textBaseline = "top";
  const subSize = Math.round(Math.min(W, H) * 0.045);
  const head = fitHeadline(ctx, ad.headline, textW, textH - subSize * 3.2, landscape ? 200 : 170);
  head.lines.forEach((l, i) => ctx.fillText(l, textX, textY + i * head.size * 0.92));
  ctx.font = `600 ${subSize}px "Schibsted Grotesk"`;
  ctx.globalAlpha = 0.9;
  const subLines = wrap(ctx, ad.sub, textW);
  const subY = textY + head.lines.length * head.size * 0.92 + subSize * 0.8;
  subLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, textX, subY + i * subSize * 1.25));
  ctx.globalAlpha = 1;

  // Footer strip: project name on the left, "BN" mark on the right
  ctx.fillStyle = ad.dark;
  ctx.fillRect(0, H - footerH, W, footerH);
  ctx.fillStyle = ad.light;
  ctx.font = `800 ${Math.round(footerH * 0.5)}px "Schibsted Grotesk"`;
  ctx.textBaseline = "middle";
  ctx.fillText(ad.title, pad, H - footerH / 2);
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
const HOME = { pos: new THREE.Vector3(0, 7, 36), target: new THREE.Vector3(0, 37, -40) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.45;
controls.minAzimuthAngle = -0.16;
controls.maxAzimuthAngle = 0.16;
controls.minPolarAngle = 1.38;
controls.maxPolarAngle = 1.62;

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

const rng = (a, b) => a + random() * (b - a);

// ---------- Buildings ----------
// A few facade "materials", each drawn once on a canvas: a base color map with
// floor lines, columns, and window frames, plus an emissive map of lit windows.
// Lit offices cluster on some floors and leave others dark, like a real city.
const FACADES = [
  { kind: "masonry", wall: "#4a3a33", frame: "#2c221e", glass: "#141019", winW: 0.5, warm: 0.9 },
  { kind: "limestone", wall: "#5b5248", frame: "#363029", glass: "#15131b", winW: 0.45, warm: 0.92 },
  { kind: "glass", wall: "#1d2c4a", frame: "#33456a", glass: "#22375e", winW: 0.86, warm: 0.6 },
  { kind: "darkglass", wall: "#151827", frame: "#2a3046", glass: "#1a1f33", winW: 0.88, warm: 0.5 },
  { kind: "office", wall: "#2f3242", frame: "#1d1f2b", glass: "#171a28", winW: 0.66, warm: 0.75 },
];

function facadeTextures(f) {
  const W = 512, H = 1024, cols = 16, floors = 32;
  const cw = W / cols, fh = H / floors;
  const base = document.createElement("canvas");
  base.width = W; base.height = H;
  const b = base.getContext("2d");
  const glow = document.createElement("canvas");
  glow.width = W; glow.height = H;
  const e = glow.getContext("2d");
  b.fillStyle = f.wall;
  b.fillRect(0, 0, W, H);
  e.fillStyle = f.wall;
  e.fillRect(0, 0, W, H);
  e.fillStyle = "rgba(0, 0, 0, 0.72)";
  e.fillRect(0, 0, W, H);

  for (let fl = 0; fl < floors; fl++) {
    const y = fl * fh;
    // Floor slab line
    b.fillStyle = f.frame;
    b.fillRect(0, y, W, fh * (f.kind.includes("glass") ? 0.08 : 0.16));
    e.fillStyle = "rgba(0, 0, 0, 0.5)";
    e.fillRect(0, y, W, fh * (f.kind.includes("glass") ? 0.08 : 0.16));
    // How lit this floor is: most floors are dark, some are busy
    const busy = random() < 0.22 ? rng(0.35, 0.75) : rng(0, 0.06);
    let run = 0;
    for (let c = 0; c < cols; c++) {
      const ww = cw * f.winW, wh = fh * (f.kind.includes("glass") ? 0.82 : 0.6);
      const x = c * cw + (cw - ww) / 2, wy = y + fh * (f.kind.includes("glass") ? 0.12 : 0.26);
      b.fillStyle = f.glass;
      b.fillRect(x, wy, ww, wh);
      // Lit windows come in runs (one office = several windows)
      if (run > 0 || random() < busy) {
        if (run === 0) run = Math.floor(rng(1, 4));
        run--;
        const warm = random() < f.warm;
        e.fillStyle = warm ? `rgba(255, ${Math.round(rng(190, 215))}, ${Math.round(rng(135, 165))}, ${rng(0.55, 0.9).toFixed(2)})` : `rgba(175, 195, 255, ${rng(0.45, 0.75).toFixed(2)})`;
        e.fillRect(x, wy, ww, wh);
      }
    }
    // Masonry gets vertical piers between windows
    if (!f.kind.includes("glass")) {
      b.fillStyle = f.frame;
      for (let c = 0; c <= cols; c += 2) { b.fillRect(c * cw - 2, y, 4, fh); e.fillStyle = "rgba(0,0,0,0.5)"; e.fillRect(c * cw - 2, y, 4, fh); b.fillStyle = f.frame; }
    } else {
      b.fillStyle = f.frame;
      for (let c = 0; c <= cols; c++) b.fillRect(c * cw - 1, y, 2, fh);
    }
  }
  const map = new THREE.CanvasTexture(base);
  const emissiveMap = new THREE.CanvasTexture(glow);
  for (const t of [map, emissiveMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  }
  return { map, emissiveMap };
}
// Two lighting variations per material, so neighbors don't match
const FACADE_TEX = FACADES.map((f) => [facadeTextures(f), facadeTextures(f)]);

const roofMat = new THREE.MeshLambertMaterial({ color: "#1a1824" });
const corniceMat = new THREE.MeshLambertMaterial({ color: "#2b2530" });
const tankMat = new THREE.MeshLambertMaterial({ color: "#5a4334" });
const shopColors = ["#ff4d6d", "#ffd23f", "#4fd1ff", "#ffffff", "#ff8a3d", "#7cff8a"];

function blockMesh(x, y0, z, w, d, h, fi) {
  const f = FACADES[fi];
  const tex = FACADE_TEX[fi][Math.floor(random() * 2)];
  // One floor is about 3.6 units tall; one column about 2.2 units wide
  const map = tex.map.clone(), emissiveMap = tex.emissiveMap.clone();
  const rx = Math.max(0.5, w / 29), ry = Math.max(0.5, h / 96);
  for (const t of [map, emissiveMap]) {
    t.repeat.set(rx, ry);
    t.offset.set(Math.floor(random() * 16) / 16, Math.floor(random() * 32) / 32);
    t.needsUpdate = true;
  }
  const side = new THREE.MeshLambertMaterial({ map, emissive: "#ffffff", emissiveMap, emissiveIntensity: 0.7 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roofMat, roofMat, side, side]);
  m.position.set(x, y0 + h / 2, z);
  scene.add(m);
  // Cornice at the top of masonry blocks
  if (!f.kind.includes("glass")) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.9, d + 0.8), corniceMat);
    c.position.set(x, y0 + h + 0.45, z);
    scene.add(c);
  }
}

function rooftop(x, y, z, w, d, fi) {
  const f = FACADES[fi];
  if (!f.kind.includes("glass") && random() < 0.6) {
    // Classic NYC water tower on legs
    const tank = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 10), tankMat);
    barrel.position.y = 3.3;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 10), tankMat);
    cap.position.y = 5.2;
    tank.add(barrel, cap);
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2, 0.15), roofMat);
      leg.position.set(lx, 1, lz);
      tank.add(leg);
    }
    tank.position.set(x + rng(-w / 4, w / 4), y, z + rng(-d / 4, d / 4));
    scene.add(tank);
  }
  // Mechanical boxes
  for (let i = 0; i < Math.floor(rng(1, 3)); i++) {
    const bw = rng(2, w * 0.35), bh = rng(1.2, 3), bd = rng(2, d * 0.35);
    const box = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), roofMat);
    box.position.set(x + rng(-w / 4, w / 4), y + bh / 2, z + rng(-d / 4, d / 4));
    scene.add(box);
  }
  // Antenna on glass towers, with a red aircraft light
  if (f.kind.includes("glass") && random() < 0.5) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), roofMat);
    ant.position.set(x, y + 3, z);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: "#ff3b3b" }));
    light.position.set(x, y + 6.1, z);
    scene.add(ant, light);
  }
}

// A building: a base block plus setbacks as it gets taller, a roof, and on the
// square a lit storefront band at street level.
function building(x, z, w, d, h, fi, onSquare = false) {
  if (fi === undefined) fi = Math.floor(random() * FACADES.length);
  let y = 0, bw = w, bd = d;
  const tiers = h > 60 ? 3 : h > 38 ? 2 : 1;
  const heights = tiers === 3 ? [0.55, 0.28, 0.17] : tiers === 2 ? [0.7, 0.3] : [1];
  for (let t = 0; t < tiers; t++) {
    const th = h * heights[t];
    blockMesh(x, y, z, bw, bd, th, fi);
    y += th + (FACADES[fi].kind.includes("glass") ? 0 : 0.9);
    // Step back toward the building's center (away from the street) each tier
    bw *= 0.8; bd *= 0.82;
  }
  rooftop(x, y, z, bw, bd, fi);
  if (onSquare) {
    // Storefront band facing the street, with a lit sign above it
    const dir = Math.sign(-x) || 1;
    const shop = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.92, 3.2),
      new THREE.MeshBasicMaterial({ color: "#fff1d6", toneMapped: false }));
    shop.rotation.y = dir * Math.PI / 2;
    shop.position.set(x + dir * (w / 2 + 0.05), 1.7, z);
    scene.add(shop);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.7, 0.9),
      new THREE.MeshBasicMaterial({ color: shopColors[Math.floor(random() * shopColors.length)], toneMapped: false }));
    sign.rotation.y = dir * Math.PI / 2;
    sign.position.set(x + dir * (w / 2 + 0.06), 4, z);
    scene.add(sign);
  }
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
for (const side of [-1, 1]) {
  let z = 34;
  while (z > -120) {
    const d = rng(10, 16);
    // Inner faces stay at least 18 units from the street so billboards sit in front
    building(side * rng(25, 28), z - d / 2, rng(10, 14), d, rng(28, 70), undefined, true);
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
const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 6), towerMat);
mast.position.y = 72;
tower.add(mast);

// The ball, low-poly and glowing
const ball = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.6, 1),
  new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#9fd8ff", emissiveIntensity: 1.1, flatShading: true, metalness: 0.2, roughness: 0.3 })
);
ball.position.y = 75.6;
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
  g.font = '900 60px "Schibsted Grotesk"';
  g.fillStyle = "#ff5a4a";
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
  { ad: "about",     pos: [-13.6, 32, 0],   rotY: 0.72, w: 11, h: 14.5 },
  { ad: "brandinos", pos: [-9.9, 27, -30], rotY: 0.72, w: 13, h: 8.6 },
  { ad: "draft",     pos: [-13.6, 46, -26], rotY: 0.7, w: 13, h: 8.8 },
  { ad: "lego",      pos: [13.6, 32, 0],    rotY: -0.72, w: 11, h: 14.5 },
  { ad: "vr",        pos: [10.6, 28, -30], rotY: -0.72, w: 8.5, h: 11 },
  { ad: "robot",     pos: [13.6, 46.5, -24],  rotY: -0.7, w: 8.5, h: 10.5 },
  { ad: "resume",    pos: [10.6, 15.5, -34], rotY: -0.7, w: 11, h: 5.5 },
];

const boardMeshes = [];
const frameMat = new THREE.MeshLambertMaterial({ color: "#0a0918", flatShading: true });

async function buildBoards() {
  await Promise.all([
    document.fonts.load('900 100px "Schibsted Grotesk"'),
    document.fonts.load('800 100px "Schibsted Grotesk"'),
    document.fonts.load('900 60px "Schibsted Grotesk"'),
    document.fonts.load('600 40px "Schibsted Grotesk"'),
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
