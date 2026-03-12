// PATH: src/components/FinalAnalysisPanel.jsx

import React, { useMemo } from "react";
import { bryToRgbString } from "../utils/colorMath";

function clamp0(n) {
  return Math.max(0, n);
}

function fmtTriplet(bry) {
  return `(${bry.b},${bry.r},${bry.y})`;
}

function parseRgbString(s) {
  const m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(
    String(s || ""),
  );
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixRgb(rgbA, rgbB, t) {
  if (!rgbA || !rgbB) return null;
  const rr = Math.round(lerp(rgbA.r, rgbB.r, t));
  const gg = Math.round(lerp(rgbA.g, rgbB.g, t));
  const bb = Math.round(lerp(rgbA.b, rgbB.b, t));
  return `rgb(${rr}, ${gg}, ${bb})`;
}

export default function FinalAnalysisPanel({
  target,
  current,
  targetBg,
  currentBg,
}) {
  // ✅ controls how “small current changes” fade instead of jump
  const DISPLAY_FADE_RANGE = 8; // 0..8 total current amount fades from TargetBg -> NeededBg

  const computed = useMemo(() => {
    const signed = {
      b: Math.round(target.b - current.b),
      r: Math.round(target.r - current.r),
      y: Math.round(target.y - current.y),
    };

    // Needed color shows ONLY positive channels
    const neededForColor = {
      b: clamp0(signed.b),
      r: clamp0(signed.r),
      y: clamp0(signed.y),
    };

    const hasAnyNeededColor =
      neededForColor.b > 0 || neededForColor.r > 0 || neededForColor.y > 0;

    const currentTotal =
      Math.max(0, current.b) + Math.max(0, current.r) + Math.max(0, current.y);

    return { signed, neededForColor, hasAnyNeededColor, currentTotal };
  }, [target, current]);

  // Base computed Needed (pure delta color)
  const neededBgRaw = useMemo(() => {
    if (!computed.hasAnyNeededColor) return "#ffffff";
    return bryToRgbString(
      computed.neededForColor.b,
      computed.neededForColor.r,
      computed.neededForColor.y,
    );
  }, [computed]);

  // ✅ KEY FIX: Smooth blend so changing Current from 0 to small value doesn’t “jump”
  const neededBg = useMemo(() => {
    if (computed.currentTotal === 0) return targetBg;

    if (
      computed.currentTotal > 0 &&
      computed.currentTotal < DISPLAY_FADE_RANGE
    ) {
      const t = computed.currentTotal / DISPLAY_FADE_RANGE; // 0..1
      const a = parseRgbString(targetBg);
      const b = parseRgbString(neededBgRaw);
      const mixed = mixRgb(a, b, t);
      return mixed || neededBgRaw;
    }

    return neededBgRaw;
  }, [computed.currentTotal, targetBg, neededBgRaw]);

  // White frame styles
  const frameStyle = {
    background: "#ffffff",
    borderRadius: 10,
    padding: 3,
    border: "1px solid rgba(0,0,0,0.08)",
  };

  const swatchBorder = "1px solid rgba(0,0,0,0.18)";

  // ✅ Mobile-safe 5-col grid (prevents overflow)
  // minmax(0,1fr) allows columns to shrink; operators are smaller than 40px now.
  const fiveColGrid = {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 22px minmax(0,1fr) 22px minmax(0,1fr)",
    alignItems: "center",
    columnGap: 8,
    rowGap: 8,
    width: "100%",
    maxWidth: "100%",
  };

  return (
    <div
      style={{
        background: "#111827",
        color: "#fff",
        borderRadius: 14,
        padding: 16,
        maxWidth: "100%",
        overflowX: "hidden", // ✅ hard stop for mobile horizontal scroll
      }}
    >
      <div
        style={{
          fontWeight: 900,
          letterSpacing: 0.4,
          fontSize: 18,
          textAlign: "center",
          maxWidth: "100%",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {/* Needed (T-C): {fmtTriplet(computed.signed)} */}
      </div>

      <div style={{ marginTop: 12, ...frameStyle }}>
        <div
          style={{
            height: 72,
            borderRadius: 8,
            background: neededBg,
            border: swatchBorder,
          }}
        />
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.18)",
          marginTop: 14,
        }}
      />

      {/* Labels row */}
      <div style={{ ...fiveColGrid, marginTop: 14, opacity: 0.9 }}>
        <div style={{ textAlign: "center", fontWeight: 700, minWidth: 0 }}>
          Target
        </div>
        <div style={{ textAlign: "center", fontWeight: 900 }}>-</div>
        <div style={{ textAlign: "center", fontWeight: 700, minWidth: 0 }}>
          Current
        </div>
        <div style={{ textAlign: "center", fontWeight: 900 }}>=</div>
        <div style={{ textAlign: "center", fontWeight: 700, minWidth: 0 }}>
          Needed
        </div>
      </div>

      {/* Swatches row */}
      <div style={{ marginTop: 10, ...frameStyle }}>
        <div style={{ ...fiveColGrid, alignItems: "start" }}>
          <Swatch
            bg={targetBg}
            caption={fmtTriplet(target)}
            border={swatchBorder}
          />
          <div />
          <Swatch
            bg={currentBg}
            caption={fmtTriplet(current)}
            border={swatchBorder}
          />
          <div />
          <Swatch
            bg={neededBg}
            caption={fmtTriplet(computed.signed)}
            border={swatchBorder}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Row label="Blue" value={computed.signed.b} color="#ffffff" />
        <Row label="Red" value={computed.signed.r} color="#ff4d4d" />
        <Row label="Yellow" value={computed.signed.y} color="#ffd24d" />
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
        Needed color box shows only positive channels (negative values are not
        displayed in the color).
      </div>
    </div>
  );
}

function Swatch({ bg, caption, border }) {
  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <div style={{ height: 56, borderRadius: 8, background: bg, border }} />
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#111827",
          opacity: 0.9,
          maxWidth: "100%",
          overflowWrap: "anywhere", // ✅ prevent minus values from pushing layout
          wordBreak: "break-word",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        gap: 12,
      }}
    >
      <div style={{ opacity: 0.95, minWidth: 0 }}>{label}</div>
      <div style={{ fontWeight: 800, color, whiteSpace: "nowrap" }}>
        {value}%
      </div>
    </div>
  );
}
