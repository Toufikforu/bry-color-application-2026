// PATH: src/utils/sampling.js

import { clamp } from "./colorMath";

// Perceived brightness (0..255)
export function brightness(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Average sample with glare/shadow protection
export function sampleAverageFiltered(ctx, x, y, radius) {
  const { width, height } = ctx.canvas;
  const x0 = clamp(Math.floor(x - radius), 0, width - 1);
  const y0 = clamp(Math.floor(y - radius), 0, height - 1);
  const x1 = clamp(Math.floor(x + radius), 0, width - 1);
  const y1 = clamp(Math.floor(y + radius), 0, height - 1);

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const data = ctx.getImageData(x0, y0, w, h).data;

  const SHADOW_MAX = 35;
  const GLARE_MIN = 235;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;
  let rawRSum = 0,
    rawGSum = 0,
    rawBSum = 0,
    rawCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rawRSum += r;
    rawGSum += g;
    rawBSum += b;
    rawCount++;

    const br = brightness(r, g, b);
    if (br <= SHADOW_MAX) continue;
    if (br >= GLARE_MIN) continue;

    rSum += r;
    gSum += g;
    bSum += b;
    count++;
  }

  if (count < Math.max(5, Math.floor(rawCount * 0.35))) {
    if (rawCount === 0) return { r: 0, g: 0, b: 0 };
    return {
      r: Math.round(rawRSum / rawCount),
      g: Math.round(rawGSum / rawCount),
      b: Math.round(rawBSum / rawCount),
    };
  }

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}
