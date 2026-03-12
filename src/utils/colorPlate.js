// PATH: src/utils/colorPlate.js

const LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));
const scale = (base, k) => ({
  b: clamp100(base.b * k),
  r: clamp100(base.r * k),
  y: clamp100(base.y * k),
});

const BASES = {
  Br: { b: 30, r: 55, y: 55 },
  K: { b: 60, r: 60, y: 60 },
  B: { b: 100, r: 0, y: 0 },
  P: { b: 60, r: 85, y: 0 },
  R: { b: 0, r: 100, y: 0 },
  O: { b: 0, r: 70, y: 100 },
  Y: { b: 0, r: 0, y: 100 },
  G: { b: 100, r: 0, y: 100 },
};

export const COLOR_PLATE = Object.fromEntries(
  Object.entries(BASES).map(([key, base]) => [
    key,
    LEVELS.map((k) => scale(base, k)),
  ]),
);
