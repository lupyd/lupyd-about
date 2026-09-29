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

export function generateStickers() {
  const log = [];
  try {
    const img1 = decodePng('/home/kittu/.gemini/antigravity-ide/brain/15091e67-2a54-41f1-af31-78a5483c6dc7/.user_uploaded/media_1790666382857.png');
    // In img1, check which pixels are NOT slate and NOT purple
    // slate: (b - r >= 15 && g - r >= 12)
    // purple: (b > 160 && r > 80 && g < 100)
    let minX1 = img1.w, maxX1 = 0, minY1 = img1.h, maxY1 = 0;
    for (let y = 0; y < 140; y++) {
      for (let x = 0; x < img1.w; x++) {
        const i = (y * img1.w + x) * 4;
        const r = img1.pixels[i], g = img1.pixels[i+1], b = img1.pixels[i+2];
        const isPurple = (b > 160 && r > 80 && g < 100);
        const isSlate = (b - r >= 15 && g - r >= 12 && r < 180);
        const isWhiteSelectionHandle = (r > 250 && g > 250 && b > 250 && (x < 10 || x > 165 || y < 10 || y > 130));
        if (!isPurple && !isSlate && !isWhiteSelectionHandle) {
          if (x < minX1) minX1 = x;
          if (x > maxX1) maxX1 = x;
          if (y < minY1) minY1 = y;
          if (y > maxY1) maxY1 = y;
        }
      }
    }
    log.push(`Img1 illustration bounds: minX=${minX1}, maxX=${maxX1}, minY=${minY1}, maxY=${maxY1}`);

    const img2 = decodePng('/home/kittu/.gemini/antigravity-ide/brain/15091e67-2a54-41f1-af31-78a5483c6dc7/.user_uploaded/media_1790666388120.png');
    // In img2, yellow is: (r > 220 && g > 200 && b < 210 && (r - b) > 35)
    // purple is: (b > 150 && r > 70 && g < 110)
    // white bottom is: (y > 375 && r > 230 && g > 230 && b > 230)
    let minX2 = img2.w, maxX2 = 0, minY2 = img2.h, maxY2 = 0;
    for (let y = 0; y < img2.h; y++) {
      for (let x = 0; x < img2.w; x++) {
        const i = (y * img2.w + x) * 4;
        const r = img2.pixels[i], g = img2.pixels[i+1], b = img2.pixels[i+2];
        const isPurple = (b > 150 && r > 70 && g < 110);
        const isYellow = (r > 220 && g > 200 && b < 210 && (r - b) > 35);
        const isBottomWhite = (y > 375 && r > 225 && g > 225 && b > 225);
        if (!isPurple && !isYellow && !isBottomWhite) {
          if (x < minX2) minX2 = x;
          if (x > maxX2) maxX2 = x;
          if (y < minY2) minY2 = y;
          if (y > maxY2) maxY2 = y;
        }
      }
    }
    log.push(`Img2 illustration bounds: minX=${minX2}, maxX=${maxX2}, minY=${minY2}, maxY=${maxY2}`);

    fs.writeFileSync('/home/kittu/lupyd-about/scripts/log.txt', log.join('\n'));
  } catch (err) {
    fs.writeFileSync('/home/kittu/lupyd-about/scripts/log.txt', err.stack);
  }
}
