import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePng(filePath) {
  const data = fs.readFileSync(filePath);
  let pos = 8;
  const chunks = [];
  let idat = Buffer.alloc(0);
  while (pos < data.length) {
    const len = data.readUInt32BE(pos);
    const ctype = data.toString('ascii', pos + 4, pos + 8);
    const cdata = data.subarray(pos + 8, pos + 8 + len);
    if (ctype === 'IDAT') idat = Buffer.concat([idat, cdata]);
    else if (ctype !== 'IEND') chunks.push({ ctype, cdata });
    pos += 12 + len;
  }
  const w = chunks[0].cdata.readUInt32BE(0);
  const h = chunks[0].cdata.readUInt32BE(4);
  const colorType = chunks[0].cdata[9];
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 4;
  const raw = zlib.inflateSync(idat);
  const stride = 1 + w * bpp;
  const pixels = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(w * bpp);

  for (let y = 0; y < h; y++) {
    const row = raw.subarray(y * stride + 1, (y + 1) * stride);
    const ftype = raw[y * stride];
    const unfilt = Buffer.alloc(w * bpp);
    if (ftype === 2) {
      for (let i = 0; i < w * bpp; i++) unfilt[i] = (row[i] + prev[i]) & 0xff;
    } else if (ftype === 1) {
      for (let i = 0; i < w * bpp; i++) {
        const left = i >= bpp ? unfilt[i - bpp] : 0;
        unfilt[i] = (row[i] + left) & 0xff;
      }
    } else if (ftype === 3) {
      for (let i = 0; i < w * bpp; i++) {
        const left = i >= bpp ? unfilt[i - bpp] : 0;
        const up = prev[i];
        unfilt[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
      }
    } else if (ftype === 4) {
      for (let i = 0; i < w * bpp; i++) {
        const a = i >= bpp ? unfilt[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        unfilt[i] = (row[i] + pr) & 0xff;
      }
    } else row.copy(unfilt);
    prev = unfilt;

    for (let x = 0; x < w; x++) {
      const pIdx = (y * w + x) * 4;
      if (bpp === 4) {
        pixels[pIdx] = unfilt[x * 4];
        pixels[pIdx + 1] = unfilt[x * 4 + 1];
        pixels[pIdx + 2] = unfilt[x * 4 + 2];
        pixels[pIdx + 3] = unfilt[x * 4 + 3];
      } else if (bpp === 3) {
        pixels[pIdx] = unfilt[x * 3];
        pixels[pIdx + 1] = unfilt[x * 3 + 1];
        pixels[pIdx + 2] = unfilt[x * 3 + 2];
        pixels[pIdx + 3] = 255;
      }
    }
  }
  return { w, h, pixels };
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  if (typeof zlib.crc32 === 'function') {
    return zlib.crc32(buf);
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(ctype, cdata) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(cdata.length, 0);
  const type = Buffer.from(ctype, 'ascii');
  const combined = Buffer.concat([type, cdata]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crc]);
}

function encodePng(w, h, rgba) {
  const filtered = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const fOffset = y * (1 + w * 4);
    filtered[fOffset] = 0;
    rgba.copy(filtered, fOffset + 1, y * w * 4, (y + 1) * w * 4);
  }

  const idat = zlib.deflateSync(filtered, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    pngHeader,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

export function generateStickers() {
  try {
    // 1. Minimalist Theme (Bunny at Laptop)
    {
      const srcPath = '/home/kittu/.gemini/antigravity-ide/brain/15091e67-2a54-41f1-af31-78a5483c6dc7/.user_uploaded/media_1790666382857.png';
      const outPath = '/home/kittu/lupyd-about/public/minimalist-theme.png';
      const { w: origW, pixels } = decodePng(srcPath);

      const cropW = origW;
      const cropH = 137;
      const img = Buffer.alloc(cropW * cropH * 4);
      for (let y = 0; y < cropH; y++) {
        pixels.copy(img, y * cropW * 4, y * origW * 4, (y * origW + cropW) * 4);
      }

      const visited = new Uint8Array(cropW * cropH);
      const q = [];
      for (let x = 0; x < cropW; x++) {
        q.push(x, 0);
        q.push(x, cropH - 1);
      }
      for (let y = 0; y < cropH; y++) {
        q.push(0, y);
        q.push(cropW - 1, y);
      }

      let head = 0;
      while (head < q.length) {
        const x = q[head++];
        const y = q[head++];
        const idx = y * cropW + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pIdx = idx * 4;
        const r = img[pIdx], g = img[pIdx + 1], b = img[pIdx + 2];

        const isSlate = (g - r >= 6 && b - r >= 8 && r < 185) || (Math.abs(r - 143) < 30 && Math.abs(g - 166) < 30 && Math.abs(b - 172) < 30);
        const isPurple = (b > 135 && r > 70 && g < 115) || (r > 105 && b > 145 && g < 115);
        const isCornerHandle = (x <= 14 || x >= cropW - 15) && (y <= 14) && (r > 200 && g > 200 && b > 200);
        const isBottomEdge = (y >= cropH - 3) && (r > 185 || isPurple || isSlate);

        if (isSlate || isPurple || isCornerHandle || isBottomEdge) {
          img[pIdx + 3] = 0;
          if (x + 1 < cropW && !visited[idx + 1]) q.push(x + 1, y);
          if (x - 1 >= 0 && !visited[idx - 1]) q.push(x - 1, y);
          if (y + 1 < cropH && !visited[idx + cropW]) q.push(x, y + 1);
          if (y - 1 >= 0 && !visited[idx - cropW]) q.push(x, y - 1);
        }
      }

      for (let y = 0; y < cropH; y++) {
        for (let x = 0; x < cropW; x++) {
          const pIdx = (y * cropW + x) * 4;
          const r = img[pIdx], g = img[pIdx + 1], b = img[pIdx + 2];
          const isPurple = (b > 130 && r > 65 && g < 115) || (r > 100 && b > 140 && g < 115);
          const isCornerArtifact = (x <= 6 || x >= cropW - 7) && (y <= 8);
          const isRightEdgeSlate = (x >= 155 && y >= 125 && g - r >= 4 && b - r >= 4);
          if (isPurple || isCornerArtifact || isRightEdgeSlate) {
            img[pIdx + 3] = 0;
          }
        }
      }

      fs.writeFileSync(outPath, encodePng(cropW, cropH, img));
    }

    // 2. No Distractions (Person shouting with megaphone)
    {
      const srcPath = '/home/kittu/.gemini/antigravity-ide/brain/15091e67-2a54-41f1-af31-78a5483c6dc7/.user_uploaded/media_1790666388120.png';
      const outPath = '/home/kittu/lupyd-about/public/no-distractions.png';
      const { w: origW, pixels } = decodePng(srcPath);

      const cropW = origW;
      const cropH = 376;
      const img = Buffer.alloc(cropW * cropH * 4);
      for (let y = 0; y < cropH; y++) {
        pixels.copy(img, y * cropW * 4, y * origW * 4, (y * origW + cropW) * 4);
      }

      const visited = new Uint8Array(cropW * cropH);
      const q = [];
      for (let x = 0; x < cropW; x++) {
        q.push(x, 0);
        q.push(x, cropH - 1);
      }
      for (let y = 0; y < cropH; y++) {
        q.push(0, y);
        q.push(cropW - 1, y);
      }

      let head = 0;
      while (head < q.length) {
        const x = q[head++];
        const y = q[head++];
        const idx = y * cropW + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pIdx = idx * 4;
        const r = img[pIdx], g = img[pIdx + 1], b = img[pIdx + 2];

        const isYellow = ((r - b) > 28 && (g - b) > 22 && r > 200 && g > 180);
        const isPurple = (b > 135 && r > 70 && g < 110) || (r > 110 && b > 145 && g < 110);
        const isFloor = (y >= 325 && (x < 145 || x > 255));
        const isOuter = (x <= 14 || x >= 322 || y <= 10);

        if (isYellow || isPurple || isFloor || isOuter) {
          img[pIdx + 3] = 0;
          if (x + 1 < cropW && !visited[idx + 1]) q.push(x + 1, y);
          if (x - 1 >= 0 && !visited[idx - 1]) q.push(x - 1, y);
          if (y + 1 < cropH && !visited[idx + cropW]) q.push(x, y + 1);
          if (y - 1 >= 0 && !visited[idx - cropW]) q.push(x, y - 1);
        }
      }

      // Cleanup remaining yellow pixels and horizontal tick marks
      for (let y = 0; y < cropH; y++) {
        for (let x = 0; x < cropW; x++) {
          const pIdx = (y * cropW + x) * 4;
          const r = img[pIdx], g = img[pIdx + 1], b = img[pIdx + 2];
          const isPurple = (b > 130 && r > 65 && g < 115) || (r > 100 && b > 140 && g < 115);
          const isYellowPkt = ((r - b) > 26 && (g - b) > 20 && b < 210 && r > 205 && g > 185);
          const isFloorLine = (y >= 325 && y <= 335 && (x <= 148 || x >= 253));
          if (isPurple || isYellowPkt || x >= 321 || x <= 14 || isFloorLine || (y >= 325 && (x < 142 || x > 258))) {
            img[pIdx + 3] = 0;
          }
        }
      }

      fs.writeFileSync(outPath, encodePng(cropW, cropH, img));
    }

    fs.writeFileSync('/home/kittu/lupyd-about/scripts/log.txt', 'Clean stickers ready!');
  } catch (err) {
    fs.writeFileSync('/home/kittu/lupyd-about/scripts/log.txt', err.stack);
  }
}
