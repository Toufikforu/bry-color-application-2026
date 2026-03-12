// PATH: src/components/Slider.jsx
import React from "react";
import { clamp } from "../utils/colorMath";

export default function Slider({ label, value, onChange, channelClass, disabled = false }) {
  return (
    <div style={{ marginTop: 12, opacity: disabled ? 0.55 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 60, textAlign: "right" }}>{value}%</div>
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(clamp(Number(e.target.value || 0), 0, 100))}
            style={{ width: 70 }}
          />
        </div>
      </div>

      <input
        className={`range ${channelClass}`}
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}