// A low-poly Times Square, facing One Times Square head-on.
// Every billboard is an ad for one of Brendan's projects, drawn on a canvas in
// one shared layout. The tower is the centerpiece; the flanking buildings carry
// the rest of the work, laid out so no two billboards overlap.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const mount = document.querySelector(".city");
const panel = document.querySelector(".city-panel");
const tip = document.querySelector(".city-tip");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- The ads ----------
// bg/ink: the ad's background and headline color. dark/light: the colors
// used by its drawn key visual.
const ADS = [
  { id: "name", kind: "name" },
  { id: "journey", title: "Journey", kicker: "Capstone, 2026", headline: "Every inch counts.",
    sub: "Child growth and nutrition, made clear for parents and doctors.",
    art: "journey", bg: "#0e4d33", ink: "#ffffff", dark: "#06281a", light: "#8ff0b4",
    href: "https://zion.luddy.indiana.edu/info-capstone-2026/journey", external: true,
    blurb: "My Informatics capstone at Indiana University: a platform that helps parents and healthcare providers track a child's growth and nutrition, spot concerning trends early, and get health alerts." },
  { id: "spider", title: "Spider-History", kicker: "Web design", headline: "Spider-Man, from 1962 to now.",
    sub: "A 12-page archive organized by decade, creators, and villains.",
    img: "assets/images/swinging_spiderman_cover.webp", focusY: 0.25,
    bg: "#b5121b", ink: "#ffffff",
    href: "projects/spiderman.html",
    blurb: "A multi-page site that organizes Spider-Man's history by decade, creators, and villains, built around clear information architecture and consistent navigation." },
  { id: "ots", title: "Fortnite × One Times Square", kicker: "Fly Studio", headline: "New Year's Eve in Times Square, built in Fortnite.",
    sub: "2M+ views on Fortnite's official Instagram.",
    img: "assets/images/OTS2.jpg", focusY: 0.3,
    bg: "#1f2bd8", ink: "#ffffff",
    href: "projects/fortnite.html",
    blurb: "At Fly Studio I designed and launched a custom Fortnite Creative map for a New Year's Eve campaign with One Times Square. It reached 2M+ views on Fortnite's official Instagram." },
  { id: "lego", title: "LEGO Intelligence Agent", kicker: "Dashboard", headline: "Know which sets retire next.",
    sub: "New releases and retiring sets, tracked automatically.",
    art: "lego", bg: "#ffcc00", ink: "#1b1300", dark: "#1b1300", light: "#fff3b0",
    href: "https://brandino101234.github.io/lego-intelligence-agent/", external: true,
    blurb: "A dashboard that tracks upcoming LEGO releases, sets about to retire, gifts with purchase, and the BrickLink Designer Program. Python scrapers run on a schedule and rebuild it automatically." },
  { id: "brandinos", title: "BrandinosBuilds", kicker: "Brand and content design", headline: "LEGO videos, posted daily.",
    sub: "Thumbnails, channel art, and series formats for TikTok, Instagram, and YouTube.",
    art: "brandinos", bg: "#ff5a1f", ink: "#ffffff", dark: "#3a1103", light: "#ffe2c9",
    href: "about.html",
    blurb: "I founded BrandinosBuilds and design all of its visual content across TikTok, Instagram, and YouTube: thumbnails, channel art, in-video graphics, and recurring series like Brick Blur." },
  { id: "vr", title: "Mindfulness in VR", kicker: "VR, Unity", headline: "Meditation, in virtual reality.",
    sub: "An immersive experience built in Unity.",
    art: "vr", bg: "#5a2bd6", ink: "#ffffff", dark: "#1a0b47", light: "#a6ecff",
    href: "https://www.youtube.com/watch?v=U2gG0RcOsK4", external: true,
    blurb: "A virtual reality meditation experience built in Unity, with interactive environments and calming visuals designed to help people relax." },
  { id: "draft", title: "Draft DNA", kicker: "Data app", headline: "Every NBA pick since 1996, graded.",
    sub: "Draft-night projections that update as careers unfold.",
    art: "draft", bg: "#0d1530", ink: "#ffffff", dark: "#06102a", light: "#4aa3ff",
    href: "https://draft-dna.streamlit.app", external: true,
    blurb: "An NBA draft analytics app. Every pick since 1996 gets a projection from draft-night data only, then a grade as his career unfolds, with prospect cards for 1,833 players." },
  { id: "robot", title: "Arduino Tank Robot", kicker: "Hardware", headline: "Meet Turny.",
    sub: "A servo-driven tank robot built with Arduino.",
    art: "robot", bg: "#c6ff3d", ink: "#14213d", dark: "#14213d", light: "#f4ffd6",
    href: "projects/robot.html",
    blurb: "A small tank robot I built with Arduino and servo motors, with button-triggered movement sequences and a lot of hardware debugging." },
  { id: "about", title: "About me", kicker: "Indiana University, 2026", headline: "Hi, I'm Brendan.",
    sub: "Designer, LEGO builder, IRONMAN 70.3 finisher.",
    img: "assets/images/about/sample-gates.jpg", focusY: 0.25,
    bg: "#14213d", ink: "#ffffff",
    href: "about.html",
    blurb: "I'm a designer and Informatics graduate from Indiana University, with minors in Business and Financial Literacy from the Kelley School. Outside of work: LEGO, triathlons, and basketball." },
  { id: "resume", kind: "text", title: "Resume", kicker: "PDF, one page", headline: "Resume", sub: "One page. Open the PDF.",
    bg: "#ffffff", ink: "#14213d",
    href: "assets/resume/brendan-nussenblatt-resume.pdf", external: true,
    blurb: "My one-page resume, as a PDF." },
  { id: "contact", kind: "text", title: "Contact", kicker: "Email", headline: "Let's talk.", sub: "brendannussenblatt@gmail.com",
    bg: "#e8412c", ink: "#ffffff",
    href: "mailto:brendannussenblatt@gmail.com",
    blurb: "Email is the best way to reach me. I'm happy to walk through any of these projects." },
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
  ctx.font = `800 ${Math.round(h * 0.055)}px "Archivo"`;
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
    ctx.font = `700 ${Math.round(tileH * 0.24)}px "Archivo", sans-serif`;
    ctx.fillText(m, tx + tileW / 2, stripY + tileH * 0.12);
    ctx.font = `900 ${Math.round(tileH * 0.5)}px "Archivo"`;
    ctx.fillText(d, tx + tileW / 2, stripY + tileH * 0.4);
  });

  // Tags above the first and last tiles
  ctx.font = `800 ${Math.round(h * 0.05)}px "Archivo"`;
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
  ctx.font = `800 ${Math.round(size)}px "Archivo"`;
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
  ctx.fillStyle = "#ffcf5a";
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
    ctx.fillStyle = i === pts.length - 1 ? "#ffcf5a" : "#ffffff";
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
  ctx.font = `900 ${Math.round(h * 0.2)}px "Archivo"`;
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
  ctx.font = `800 ${Math.round(ls)}px "Archivo"`;
  while (ctx.measureText("TikTok   Instagram   YouTube").width > fw && ls > 8) {
    ls -= 1;
    ctx.font = `800 ${Math.round(ls)}px "Archivo"`;
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

function fitHeadline(ctx, text, maxW, maxH, startSize, weight = 800) {
  let size = startSize;
  let lines;
  do {
    ctx.font = `${weight} ${size}px "Archivo"`;
    lines = wrap(ctx, text, maxW);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (lines.length * size * 1.02 <= maxH && widest <= maxW) break;
    size -= 4;
  } while (size > 20);
  return { size, lines };
}

// Draw a photo full-bleed into a box (cover crop)
function drawPhoto(ctx, img, x, y, w, h, focusY = 0.5) {
  if (!img) return;
  const r = Math.max(w / img.width, h / img.height);
  const iw = img.width * r, ih = img.height * r;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * focusY, iw, ih);
  ctx.restore();
}

// One shared ad layout, like a real billboard: the visual fills the top (or the
// left on wide boards), then a sentence-case headline, a short line under it,
// and the project name small at the bottom.
async function makeAdTexture(ad, aspect) {
  const H = 1024, W = Math.round(H * aspect);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const pad = Math.round(Math.min(W, H) * 0.07);
  ctx.textBaseline = "top";

  if (ad.kind === "name") {
    ctx.fillStyle = "#0b3ea8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    const head = fitHeadline(ctx, "Brendan Nussenblatt", W - pad * 2, H * 0.62, 300);
    head.lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * head.size * 1.0));
    ctx.font = `500 ${Math.round(H * 0.075)}px "Archivo"`;
    ctx.globalAlpha = 0.85;
    ctx.fillText("Designer, New York", pad, H - pad - H * 0.08);
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  }

  if (ad.kind === "text") {
    ctx.fillStyle = ad.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ad.ink;
    const head = fitHeadline(ctx, ad.headline, W - pad * 2, H * 0.5, 420);
    head.lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * head.size));
    let subSize = Math.round(H * 0.075);
    do {
      ctx.font = `500 ${subSize}px "Archivo"`;
      if (ctx.measureText(ad.sub).width <= W - pad * 2) break;
      subSize -= 2;
    } while (subSize > 14);
    ctx.fillText(ad.sub, pad, H - pad - subSize * 1.2);
    return new THREE.CanvasTexture(c);
  }

  const img = ad.img ? await loadImage(ad.img) : null;
  ctx.fillStyle = ad.bg;
  ctx.fillRect(0, 0, W, H);

  const landscape = aspect > 1.2;
  let tx, ty, tw, th;
  if (landscape) {
    const vw = Math.round(W * 0.5);
    if (ART[ad.art]) ART[ad.art](ctx, 0, 0, vw, H, ad);
    else drawPhoto(ctx, img, 0, 0, vw, H, ad.focusY);
    tx = vw + pad; ty = pad; tw = W - vw - pad * 2; th = H - pad * 2;
  } else {
    const vh = Math.round(H * 0.56);
    if (ART[ad.art]) ART[ad.art](ctx, 0, 0, W, vh, ad);
    else drawPhoto(ctx, img, 0, 0, W, vh, ad.focusY);
    tx = pad; ty = vh + pad * 0.8; tw = W - pad * 2; th = H - vh - pad * 1.8;
  }

  // Headline and one supporting line
  const titleSize = Math.round(Math.min(W, H) * 0.042);
  const subSize = Math.round(Math.min(W, H) * 0.048);
  ctx.fillStyle = ad.ink;
  const head = fitHeadline(ctx, ad.headline, tw, th - subSize * 2.6 - titleSize * 2, landscape ? 190 : 150);
  head.lines.forEach((l, i) => ctx.fillText(l, tx, ty + i * head.size * 1.02));
  const afterHead = ty + head.lines.length * head.size * 1.02 + subSize * 0.6;
  ctx.font = `500 ${subSize}px "Archivo"`;
  ctx.globalAlpha = 0.86;
  wrap(ctx, ad.sub, tw).slice(0, 2).forEach((l, i) => ctx.fillText(l, tx, afterHead + i * subSize * 1.3));

  // Project name, small, at the bottom
  ctx.globalAlpha = 0.6;
  ctx.font = `700 ${titleSize}px "Archivo"`;
  ctx.fillText(ad.title, tx, (landscape ? H : H) - pad - titleSize);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

// ---------- Scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.prepend(renderer.domElement);
renderer.domElement.setAttribute("aria-hidden", "true");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#121331");
scene.fog = new THREE.Fog("#121331", 140, 320);

const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 600);
const HOME = { pos: new THREE.Vector3(0, 24, 100), target: new THREE.Vector3(0, 38, 0) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.enableRotate = false;
controls.enableZoom = false;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.panSpeed = 0.9;
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.PAN };

// Dragging slides the view along the street, always facing the billboards.
// panLimitX stops it at the outer buildings; set in fitHome().
let panLimitX = 0;
const offset = new THREE.Vector3();
function clampPan() {
  offset.copy(camera.position).sub(controls.target);
  const x = THREE.MathUtils.clamp(controls.target.x, -panLimitX, panLimitX);
  const y = THREE.MathUtils.clamp(controls.target.y, HOME.target.y - 5, HOME.target.y + 5);
  controls.target.set(x, y, HOME.target.z);
  camera.position.copy(controls.target).add(offset);
}

scene.add(new THREE.HemisphereLight("#8f97d8", "#20182e", 0.9));
const keyLight = new THREE.DirectionalLight("#ffd6b0", 0.55);
keyLight.position.set(30, 60, 80);
scene.add(keyLight);

// Seeded random numbers, so the city is laid out the same on every visit
let seed = 24;
function random() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rng = (a, b) => a + random() * (b - a);

// Facades: floors of mostly dark windows, with a few warm lit ones grouped
// together the way offices actually look at night.
function windowsTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  for (let y = 10; y < c.height; y += 20) {
    const floorLit = random() < 0.35 ? rng(0.25, 0.7) : rng(0, 0.08);
    for (let x = 8; x < c.width; x += 14) {
      if (random() < floorLit) {
        g.fillStyle = random() < 0.8 ? "rgba(255, 214, 160, 0.9)" : "rgba(170, 186, 255, 0.7)";
        g.fillRect(x, y, 8, 11);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const winTex = windowsTexture();

const facadeColors = ["#2a2c4f", "#25274a", "#30304f", "#2b2846", "#232643"];
function building(x, zFront, w, d, h, color, lit = 0.15) {
  const mat = new THREE.MeshLambertMaterial({
    color: color || facadeColors[Math.floor(random() * facadeColors.length)],
    emissive: "#ffffff",
    emissiveMap: winTex.clone(),
    emissiveIntensity: lit,
  });
  mat.emissiveMap.repeat.set(Math.max(1, w / 18), Math.max(1, h / 36));
  mat.emissiveMap.offset.set(random(), random());
  mat.emissiveMap.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, h / 2, zFront - d / 2);
  scene.add(m);
  return m;
}

// Ground, the avenue, sidewalks, a crosswalk
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshLambertMaterial({ color: "#1b1a33" }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(22, 140), new THREE.MeshLambertMaterial({ color: "#111022" }));
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.03, 60);
scene.add(road);
const stripeMat = new THREE.MeshBasicMaterial({ color: "#c9cbe6" });
for (let i = -9; i <= 9; i += 2) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 5), stripeMat);
  s.rotation.x = -Math.PI / 2;
  s.position.set(i, 0.05, 30);
  scene.add(s);
}

// One Times Square: the biggest thing on the page
const tower = new THREE.Group();
const towerMat = new THREE.MeshLambertMaterial({ color: "#1b1c3a" });
const shaft = new THREE.Mesh(new THREE.BoxGeometry(19, 70, 14), towerMat);
shaft.position.set(0, 35, -7);
tower.add(shaft);
const crown = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 10), towerMat);
crown.position.set(0, 72.5, -7);
tower.add(crown);
const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 7, 8), towerMat);
mast.position.set(0, 78.5, -7);
tower.add(mast);
const ball = new THREE.Mesh(
  new THREE.IcosahedronGeometry(3, 1),
  new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#bfe6ff", emissiveIntensity: 0.9, flatShading: true, roughness: 0.35 })
);
ball.position.set(0, 84, -7);
tower.add(ball);
scene.add(tower);

// The zipper: the news ticker that wraps the tower, under the screens
const zipCanvas = document.createElement("canvas");
function drawZipper() {
  const c = zipCanvas;
  c.width = 2048; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#08070f";
  g.fillRect(0, 0, c.width, c.height);
  g.font = '700 54px "Archivo"';
  g.fillStyle = "#ffb347";
  g.textBaseline = "middle";
  g.fillText("BRENDAN NUSSENBLATT      DESIGNER      NEW YORK      PORTFOLIO      ", 30, 50);
}
drawZipper();
const zipTex = new THREE.CanvasTexture(zipCanvas);
zipTex.wrapS = THREE.RepeatWrapping;
zipTex.colorSpace = THREE.SRGBColorSpace;
const zipper = new THREE.Mesh(new THREE.BoxGeometry(19.6, 2.4, 14.6), new THREE.MeshBasicMaterial({ map: zipTex }));
zipper.position.set(0, 8.5, -7);
scene.add(zipper);

// Flanking buildings that carry the side billboards, nearly face-on
building(-25, 4, 24, 22, 66, "#2a2c4f");
building(25, 4, 24, 22, 66, "#2a2c4f");
building(-51, 10, 26, 24, 74, "#25274a");
building(51, 10, 26, 24, 74, "#25274a");
// Corners and the skyline behind
for (const side of [-1, 1]) {
  building(side * 76, 16, 24, 24, rng(55, 80));
  building(side * 98, 20, 22, 24, rng(60, 90));
  for (let x = 12; x < 130; x += rng(14, 20)) building(side * x, -36, rng(12, 18), 16, rng(70, 130), null, 0.14);
}
for (let x = -120; x < 120; x += rng(16, 24)) building(x, -70, rng(14, 22), 18, rng(90, 160), "#1d1f3b", 0.1);

// Taxis on the avenue
const taxis = [];
const taxiMat = new THREE.MeshLambertMaterial({ color: "#f4bf1a" });
const lampMat = new THREE.MeshBasicMaterial({ color: "#fff3cf" });
for (let i = 0; i < 6; i++) {
  const t = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 5), taxiMat);
  body.position.y = 0.9;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 2.6), taxiMat);
  cab.position.y = 1.85;
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.1), lampMat);
  lamp.position.set(0, 1, 2.52);
  t.add(body, cab, lamp);
  const lane = i % 2 === 0 ? -4.5 : 4.5;
  t.position.set(lane, 0, 10 + i * 16);
  t.userData.speed = (lane < 0 ? 1 : -1) * rng(8, 12);
  if (lane > 0) t.rotation.y = Math.PI;
  scene.add(t);
  taxis.push(t);
}

// ---------- Billboards ----------
// Tower screens run top to bottom; side billboards sit on the building fronts.
const BOARDS = [
  { ad: "name",      pos: [0, 61, 0.3],     rotY: 0, w: 16, h: 8.5 },
  { ad: "journey",   pos: [0, 48, 0.3],     rotY: 0, w: 16, h: 14 },
  { ad: "spider",    pos: [0, 33, 0.3],     rotY: 0, w: 16, h: 14 },
  { ad: "ots",       pos: [0, 18, 0.3],     rotY: 0, w: 16, h: 14 },
  { ad: "about",     pos: [-25, 45, 4.3],   rotY: 0, w: 17, h: 21 },
  { ad: "draft",     pos: [-25, 21, 4.3],   rotY: 0, w: 19, h: 12 },
  { ad: "brandinos", pos: [-51, 52, 10.3],  rotY: 0, w: 20, h: 12.5 },
  { ad: "robot",     pos: [-51, 29, 10.3],  rotY: 0, w: 14, h: 17 },
  { ad: "lego",      pos: [25, 45, 4.3],    rotY: 0, w: 17, h: 21 },
  { ad: "vr",        pos: [25, 21, 4.3],    rotY: 0, w: 19, h: 12 },
  { ad: "resume",    pos: [51, 52, 10.3],   rotY: 0, w: 20, h: 12.5 },
  { ad: "contact",   pos: [51, 29, 10.3],   rotY: 0, w: 14, h: 17 },
];

const boardMeshes = [];
const frameMat = new THREE.MeshLambertMaterial({ color: "#0e0d1d" });

async function buildBoards() {
  await Promise.all([
    document.fonts.load('800 100px "Archivo"'),
    document.fonts.load('700 100px "Archivo"'),
    document.fonts.load('500 40px "Archivo"'),
  ]).catch(() => {});
  drawZipper();
  zipTex.needsUpdate = true;

  for (const b of BOARDS) {
    const ad = AD[b.ad];
    const tex = await makeAdTexture(ad, b.w / b.h);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    mat.color.setScalar(0.94);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), mat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.8, b.h + 0.8, 0.6), frameMat);
    frame.position.z = -0.35;
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
  if (hovered && hovered !== mesh) hovered.material.color.setScalar(0.94);
  hovered = mesh;
  if (mesh) {
    mesh.material.color.setScalar(1.12);
    renderer.domElement.style.cursor = "pointer";
    tip.textContent = mesh.userData.ad.title;
    tip.style.left = e.clientX - mount.getBoundingClientRect().left + "px";
    tip.style.top = e.clientY - mount.getBoundingClientRect().top + "px";
    tip.classList.add("is-visible");
  } else {
    renderer.domElement.style.cursor = "ew-resize";
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
  link.textContent = ad.id === "resume" ? "Open the resume" : ad.id === "about" ? "Read about me" : ad.id === "contact" ? "Send an email" : "Open the project";
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
// Fit the whole composition: the full tower vertically, and both outer
// buildings horizontally on wide screens (on narrow ones, the tower and the
// two inner buildings, and you drag to see the rest).
function fitHome() {
  const aspect = camera.aspect;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const halfW = aspect < 1 ? 36 : 72;
  const distW = halfW / (Math.tan(halfFov) * aspect);
  const distH = 46 / Math.tan(halfFov);
  const dist = Math.max(distW, distH) + 6;
  HOME.pos.set(0, 24, dist);
  // How far you can slide: until the outer buildings' far edges (x = ±64)
  // reach the edge of the screen, plus a small nudge on wide screens.
  const visibleHalfW = Math.tan(halfFov) * aspect * (dist - 10);
  panLimitX = Math.max(5, 64 - visibleHalfW);
}

function resize() {
  const w = mount.clientWidth, h = mount.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 0.9 ? 58 : 46;
  camera.updateProjectionMatrix();
  fitHome();
  if (!focused && !tween) {
    camera.position.copy(HOME.pos);
    controls.target.copy(HOME.target);
    controls.update();
  }
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
    clampPan();
  }

  if (!reduceMotion) {
    ball.rotation.y += dt * 0.2;
    zipTex.offset.x += dt * 0.05;
    for (const t of taxis) {
      t.position.z += t.userData.speed * dt;
      if (t.position.z > 120) t.position.z = 6;
      if (t.position.z < 6) t.position.z = 120;
    }
  }
  renderer.render(scene, camera);
}

buildBoards().then(() => {
  mount.classList.add("is-ready");
  frame();
});
