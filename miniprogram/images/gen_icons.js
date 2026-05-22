/**
 * Generate 6 tabBar PNG icons (pure Node.js stdlib, no npm deps).
 * Output: tab-schedule.png, tab-schedule-active.png,
 *         tab-students.png,  tab-students-active.png,
 *         tab-settings.png,  tab-settings-active.png
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 81, H = 81;
const GRAY = [148, 163, 184];  // #94a3b8
const BLUE = [59,  130, 246];  // #3b82f6

// ── PNG writer ────────────────────────────────────────────────────────────────

function writePng(filePath, canvas) {
  // canvas[y][x] = [r, g, b, a]
  const raw = Buffer.alloc(H * (1 + W * 4));
  let i = 0;
  for (let y = 0; y < H; y++) {
    raw[i++] = 0; // filter: None
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = canvas[y][x];
      raw[i++] = r; raw[i++] = g; raw[i++] = b; raw[i++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = crc32(typeAndData);
    const buf = Buffer.alloc(4 + 4 + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    typeAndData.copy(buf, 4);
    buf.writeUInt32BE(crc >>> 0, 4 + 4 + data.length);
    return buf;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const out = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(filePath, out);
}

// CRC-32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── Drawing primitives ────────────────────────────────────────────────────────

function newCanvas() {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => [0, 0, 0, 0]));
}

function sdfCircle(x, y, cx, cy, r) {
  return r - Math.hypot(x - cx, y - cy);
}

function sdfRRect(x, y, x1, y1, x2, y2, r) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const hx = Math.max((x2 - x1) / 2 - r, 0);
  const hy = Math.max((y2 - y1) / 2 - r, 0);
  const qx = Math.max(Math.abs(x - cx) - hx, 0);
  const qy = Math.max(Math.abs(y - cy) - hy, 0);
  return r - Math.sqrt(qx * qx + qy * qy);
}

function sdfToAlpha(d) {
  return Math.max(0, Math.min(255, Math.round((d + 0.5) * 255)));
}

function paint(canvas, color, sdfFn) {
  const [r3, g3, b3] = color;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = sdfToAlpha(sdfFn(x + 0.5, y + 0.5));
      if (a > canvas[y][x][3]) canvas[y][x] = [r3, g3, b3, a];
    }
  }
}

function eraseCircle(canvas, cx, cy, r) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const erase = sdfToAlpha(-sdfCircle(x + 0.5, y + 0.5, cx, cy, r));
      if (erase > 0) {
        const old_a = canvas[y][x][3];
        canvas[y][x] = [...canvas[y][x].slice(0, 3), Math.max(0, old_a - erase)];
      }
    }
  }
}

// ── Icon shapes ───────────────────────────────────────────────────────────────

function makeSchedule(color) {
  const c = newCanvas();
  // Main body
  paint(c, color, (x, y) => sdfRRect(x, y, 10, 18, 71, 70, 6));
  // Left hook
  paint(c, color, (x, y) => sdfRRect(x, y, 23, 9, 33, 26, 5));
  // Right hook
  paint(c, color, (x, y) => sdfRRect(x, y, 48, 9, 58, 26, 5));
  return c;
}

function makeStudents(color) {
  const c = newCanvas();
  // Head
  paint(c, color, (x, y) => sdfCircle(x, y, 40.5, 22, 13));
  // Shoulders (wide arc via large-corner rounded rect)
  paint(c, color, (x, y) => sdfRRect(x, y, 11, 41, 70, 76, 28));
  return c;
}

function makeSettings(color) {
  const c = newCanvas();
  const cx = 40.5, cy = 40.5;
  // Outer filled disk
  paint(c, color, (x, y) => sdfCircle(x, y, cx, cy, 32));
  // 8 tooth blobs around perimeter
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const tx = cx + 27 * Math.cos(angle);
    const ty = cy + 27 * Math.sin(angle);
    paint(c, color, (x, y) => sdfCircle(x, y, tx, ty, 11));
  }
  // Center hole
  eraseCircle(c, cx, cy, 14);
  return c;
}

// ── Generate ──────────────────────────────────────────────────────────────────

const outDir = __dirname;
const icons = [
  ['tab-schedule.png',        makeSchedule,  GRAY],
  ['tab-schedule-active.png', makeSchedule,  BLUE],
  ['tab-students.png',        makeStudents,  GRAY],
  ['tab-students-active.png', makeStudents,  BLUE],
  ['tab-settings.png',        makeSettings,  GRAY],
  ['tab-settings-active.png', makeSettings,  BLUE],
];

for (const [name, fn, color] of icons) {
  const canvas = fn(color);
  writePng(path.join(outDir, name), canvas);
  console.log('✓ ' + name);
}
console.log('\n完成！图标已生成到: ' + outDir);
