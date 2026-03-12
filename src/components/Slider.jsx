// PATH: src/components/Slider.jsx
import React from "react";
import { clamp } from "../utils/colorMath";

export default function Slider({
  label,
  value,
  onChange,
  onTransfer,
  channelClass,
  disabled = false,
}) {
  return (
    <div style={{ marginTop: 12, opacity: disabled ? 0.55 : 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT SIDE (Label + Transfer Button) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 700 }}>{label}</div>

          {onTransfer && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={disabled}
              onClick={onTransfer}
              title="Transfer this value"
              style={{ padding: "2px 6px", lineHeight: 1 }}
            >
              <i className="bi bi-arrow-left-right" />
            </button>
          )}
        </div>

        {/* VALUE INPUT */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 60, textAlign: "right" }}>{value}%</div>

          <input
            name={`channel-${label}`}
            type="number"
            min={0}
            max={100}
            value={value}
            disabled={disabled}
            onChange={(e) =>
              onChange(clamp(Number(e.target.value || 0), 0, 100))
            }
            style={{ width: 70 }}
          />
        </div>
      </div>

      {/* RANGE */}
      <input
        name={`channel-${label}`}
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
