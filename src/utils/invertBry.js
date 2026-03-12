// PATH: src/utils/invertBry.js

import { bryToRgb, clamp } from "./colorMath";

// Weighted squared distance (green matters most)
function rgbErrorWeighted(sim, rgb) {
  const dr = sim.r - rgb.r;
  const dg = sim.g - rgb.g;
  const db = sim.b - rgb.b;

  return dr * dr * 0.2126 + dg * dg * 0.7152 + db * db * 0.0722;
}

function clampBry(v) {
  return clamp(Math.round(v), 0, 100);
}

/**
 * Invert RGB -> BRY by searching for BRY that best reproduces the RGB
 * using YOUR simulation model bryToRgb().
 *
 * Two-stage search:
 * - Coarse grid step=5 (9261 checks)
 * - Refine locally step=1 around best (up to 1331 checks)
 *
 * Run this ONLY on click.
 */
export function invertRgbToBry(rgb, opts = {}) {
  const coarseStep = opts.coarseStep ?? 5;
  const refineRadius = opts.refineRadius ?? 5;
  const refineStep = opts.refineStep ?? 1;

  let best = { b: 0, r: 0, y: 0 };
  let bestErr = Infinity;

  // Stage 1: coarse scan
  for (let b = 0; b <= 100; b += coarseStep) {
    for (let r = 0; r <= 100; r += coarseStep) {
      for (let y = 0; y <= 100; y += coarseStep) {
        const sim = bryToRgb(b, r, y);
        const err = rgbErrorWeighted(sim, rgb);
        if (err < bestErr) {
          bestErr = err;
          best = { b, r, y };
          if (bestErr === 0) return best;
        }
      }
    }
  }

  // Stage 2: refine locally around best
  const bMin = clampBry(best.b - refineRadius);
  const bMax = clampBry(best.b + refineRadius);
  const rMin = clampBry(best.r - refineRadius);
  const rMax = clampBry(best.r + refineRadius);
  const yMin = clampBry(best.y - refineRadius);
  const yMax = clampBry(best.y + refineRadius);

  for (let b = bMin; b <= bMax; b += refineStep) {
    for (let r = rMin; r <= rMax; r += refineStep) {
      for (let y = yMin; y <= yMax; y += refineStep) {
        const sim = bryToRgb(b, r, y);
        const err = rgbErrorWeighted(sim, rgb);
        if (err < bestErr) {
          bestErr = err;
          best = { b, r, y };
          if (bestErr === 0) return best;
        }
      }
    }
  }

  return best;
}