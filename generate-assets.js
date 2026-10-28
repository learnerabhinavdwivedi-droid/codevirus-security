/**
 * Asset Generator for Codevirus Security
 * Generates logo-navy.png and chat-wallpaper.png as pristine PNG files.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'binary');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(w, h, rgbaCallback) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(h * (1 + w * 4));
  let offset = 0;
  for (let y = 0; y < h; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = rgbaCallback(x, y, w, h);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// 1. Generate logo-navy.png (128x128 Codevirus Security Shield)
function generateLogo() {
  const size = 128;
  return createPng(size, size, (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = Math.abs(x - cx);
    
    // Shield geometry
    // Upper part: box with rounded top
    // Lower part: tapers to a point at bottom
    let insideShield = false;
    let borderShield = false;
    
    if (y >= 16 && y <= 68 && dx <= 44) {
      insideShield = true;
      if (dx >= 38 || y <= 22) borderShield = true;
    } else if (y > 68 && y <= 112) {
      const progress = (y - 68) / 44;
      const curMaxDx = 44 * (1 - progress * progress * 0.95);
      if (dx <= curMaxDx) {
        insideShield = true;
        if (dx >= curMaxDx - 6 || y >= 106) borderShield = true;
      }
    }

    if (!insideShield) {
      // Rounded corner anti-aliasing / transparent outside
      return [0, 0, 0, 0];
    }

    if (borderShield) {
      // Cyan/Blue electric gradient border
      const t = y / h;
      return [
        Math.round(0 + t * 37),   // 0 -> 37
        Math.round(229 - t * 130),// 229 -> 99
        Math.round(255 - t * 20), // 255 -> 235
        255
      ];
    }

    // Inside shield: deep navy / cyber blue
    // Add central Padlock/Tech emblem
    // Lock body: y between 56 and 86, dx <= 18
    if (y >= 58 && y <= 86 && dx <= 18) {
      // Lock keyhole:
      const distFromHole = Math.hypot(x - cx, y - 68);
      if (distFromHole <= 4 || (y >= 68 && y <= 77 && dx <= 2.5)) {
        return [10, 31, 68, 255]; // Navy cutout
      }
      return [0, 229, 255, 255]; // Cyan lock body
    }
    // Lock shackle: y between 40 and 58, dx between 7 and 14
    if (y >= 42 && y <= 58 && dx >= 7 && dx <= 14) {
      return [0, 229, 255, 255]; // Cyan shackle
    }
    if (y >= 38 && y <= 45 && dx <= 14) {
      return [0, 229, 255, 255]; // Top curve
    }

    // Background shield fill: gradient from #0A1F44 to #0E2A5E
    const grad = y / h;
    return [
      Math.round(10 + grad * 12),
      Math.round(31 + grad * 15),
      Math.round(68 + grad * 30),
      255
    ];
  });
}

// 2. Generate chat-wallpaper.png (300x300 seamless WhatsApp cyber-security doodle tile)
function generateWallpaper() {
  const size = 300;
  return createPng(size, size, (x, y, w, h) => {
    // Base color: WhatsApp dark background #0b141a (r:11, g:20, b:26)
    let r = 11, g = 20, b = 26, a = 255;
    
    // Pattern grid of subtle cyber doodles:
    // 1. Mini shield at (50, 50)
    // 2. Code brackets < > at (150, 60)
    // 3. Lock at (250, 50)
    // 4. Tech node/circle at (60, 160)
    // 5. Terminal cursor _ at (160, 160)
    // 6. Cyber key at (250, 170)
    // 7. Mini shield at (150, 250)
    // 8. Circuit dots & connections
    
    let isDoodle = false;

    // Mini shield at (50, 50) & (250, 250)
    [ [50, 50], [250, 250] ].forEach(([cx, cy]) => {
      const dx = Math.abs(x - cx);
      const dy = y - cy;
      if (dy >= -15 && dy <= 5 && dx <= 12 && (dx >= 10 || dy <= -13)) isDoodle = true;
      if (dy > 5 && dy <= 16 && dx <= 12 * (1 - (dy - 5) / 12) && dx >= 12 * (1 - (dy - 5) / 12) - 2) isDoodle = true;
    });

    // Code brackets < > at (150, 60)
    {
      const cx = 150, cy = 60;
      // < bracket
      const dx1 = x - (cx - 10);
      const dy1 = Math.abs(y - cy);
      if (Math.abs(dx1 + dy1) <= 1.5 && dy1 <= 10) isDoodle = true;
      // > bracket
      const dx2 = x - (cx + 10);
      if (Math.abs(dx2 - dy1) <= 1.5 && dy1 <= 10) isDoodle = true;
      // slash /
      if (Math.abs((x - cx) + (y - cy) * 0.4) <= 1.2 && Math.abs(y - cy) <= 10) isDoodle = true;
    }

    // Mini padlock at (250, 50) & (50, 250)
    [ [250, 50], [50, 250] ].forEach(([cx, cy]) => {
      const dx = Math.abs(x - cx);
      const dy = y - cy;
      // Shackle
      if (dy >= -10 && dy <= -2 && dx >= 4 && dx <= 7) isDoodle = true;
      if (dy >= -12 && dy <= -9 && dx <= 7) isDoodle = true;
      // Body
      if (dy >= -2 && dy <= 8 && dx <= 9 && (dx >= 7 || dy <= 0 || dy >= 6)) isDoodle = true;
    });

    // Tech node/chip at (60, 150)
    {
      const dist = Math.hypot(x - 60, y - 150);
      if (Math.abs(dist - 8) <= 1.2) isDoodle = true;
      if (dist <= 3) isDoodle = true;
      if (Math.abs(y - 150) <= 1 && Math.abs(x - 60) >= 8 && Math.abs(x - 60) <= 15) isDoodle = true;
      if (Math.abs(x - 60) <= 1 && Math.abs(y - 150) >= 8 && Math.abs(y - 150) <= 15) isDoodle = true;
    }

    // Terminal prompt >_ at (160, 160)
    {
      const cx = 160, cy = 160;
      const dx = x - (cx - 8);
      const dy = Math.abs(y - cy);
      if (Math.abs(dx - dy) <= 1.2 && dy <= 6) isDoodle = true;
      // cursor _
      if (x >= cx + 2 && x <= cx + 12 && Math.abs(y - (cy + 6)) <= 1.2) isDoodle = true;
    }

    // Cyber key at (250, 160)
    {
      const dist = Math.hypot(x - 245, y - 160);
      if (Math.abs(dist - 6) <= 1.2) isDoodle = true;
      if (y === 160 && x >= 251 && x <= 265) isDoodle = true;
      if (x === 261 && y >= 160 && y <= 165) isDoodle = true;
      if (x === 265 && y >= 160 && y <= 164) isDoodle = true;
    }

    if (isDoodle) {
      // Subtle cyan/emerald doodle tint with soft contrast
      return [24, 45, 54, 255];
    }

    return [r, g, b, a];
  });
}

const logoData = generateLogo();
const wallpaperData = generateWallpaper();

const targets = [
  path.join(__dirname, 'frontend', 'public'),
  path.join(__dirname, 'frontend', 'dist')
];

targets.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, 'logo-navy.png'), logoData);
    fs.writeFileSync(path.join(dir, 'chat-wallpaper.png'), wallpaperData);
    console.log(`✓ Generated logo-navy.png (${logoData.length}b) & chat-wallpaper.png (${wallpaperData.length}b) in ${dir}`);
  }
});
