// PATH: src/utils/colorMath.js

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ---------- RGB -> RYB (0..255) ----------
export function rgbToRyb255(r255, g255, b255) {
  let r = r255 / 255;
  let g = g255 / 255;
  let b = b255 / 255;

  const w = Math.min(r, g, b);
  r -= w;
  g -= w;
  b -= w;

  const mg = Math.max(r, g, b);

  let y = Math.min(r, g);
  r -= y;
  g -= y;

  if (b > 0 && g > 0) {
    b = b + g;
    g = 0;
  }
  y = y + g;

  const my = Math.max(r, y, b);
  if (my > 0) {
    const n = mg / my;
    r *= n;
    y *= n;
    b *= n;
  }

  r += w;
  y += w;
  b += w;

  return [Math.round(r * 255), Math.round(y * 255), Math.round(b * 255)]; // [R,Y,B]
}

// RYB -> BRY % (your order: Blue, Red, Yellow)
export function ryb255ToBry100(ryb) {
  const r = Math.round((ryb[0] / 255) * 100);
  const y = Math.round((ryb[1] / 255) * 100);
  const b = Math.round((ryb[2] / 255) * 100);
  return { b, r, y };
}

// ✅ NEW: BRY -> RGB object (SIMULATED) - approximation
export function bryToRgb(b, r, y) {
  const B = clamp(b, 0, 100) / 100;
  const R = clamp(r, 0, 100) / 100;
  const Y = clamp(y, 0, 100) / 100;

  const white = [1, 1, 1],
    red = [1, 0, 0],
    yellow = [1, 1, 0],
    blue = [0.163, 0.373, 0.6],
    violet = [0.5, 0, 0.5],
    green = [0, 0.66, 0.2],
    orange = [1, 0.5, 0],
    black = [0.2, 0.094, 0.0];

  const RGB = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    RGB[i] =
      white[i] * (1 - R) * (1 - B) * (1 - Y) +
      red[i] * R * (1 - B) * (1 - Y) +
      blue[i] * (1 - R) * B * (1 - Y) +
      violet[i] * R * B * (1 - Y) +
      yellow[i] * (1 - R) * (1 - B) * Y +
      orange[i] * R * (1 - B) * Y +
      green[i] * (1 - R) * B * Y +
      black[i] * R * B * Y;
  }

  return {
    r: Math.round(RGB[0] * 255),
    g: Math.round(RGB[1] * 255),
    b: Math.round(RGB[2] * 255),
  };
}

// BRY -> RGB preview string
export function bryToRgbString(b, r, y) {
  const { r: rr, g: gg, b: bb } = bryToRgb(b, r, y);
  return `rgb(${rr}, ${gg}, ${bb})`;
}
