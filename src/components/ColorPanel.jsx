// PATH: src/components/ColorPanel.jsx
import React from "react";
import Slider from "./Slider";

export default function ColorPanel({
  title,
  values,
  setValues,
  bg,
  note,
  disabled = false,
}) {
  return (
    <div>
      {title ? (
        <div className="fw-bold text-muted small mb-2">{title}</div>
      ) : null}

      <div
        className="rounded border mb-2 d-none d-lg-block"
        style={{ height: 56, background: bg }}
      />

      {note ? (
        <div className="text-muted small mb-3">{note}</div>
      ) : (
        <div className="mb-2" />
      )}

      <div className="d-flex flex-column gap-3">
        <Slider
          label="B"
          channelClass="b"
          value={values.b}
          disabled={disabled}
          onChange={(v) => setValues((p) => ({ ...p, b: v }))}
        />
        <Slider
          label="R"
          channelClass="r"
          value={values.r}
          disabled={disabled}
          onChange={(v) => setValues((p) => ({ ...p, r: v }))}
        />
        <Slider
          label="Y"
          channelClass="y"
          value={values.y}
          disabled={disabled}
          onChange={(v) => setValues((p) => ({ ...p, y: v }))}
        />
      </div>

      {disabled ? (
        <div className="mt-3 alert alert-light border py-2 mb-0 small">
          <i className="bi bi-lock me-2" />
          Locked
        </div>
      ) : null}
    </div>
  );
}
