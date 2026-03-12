// PATH: src/components/TopTabs.jsx
import React from "react";

export default function TopTabs({
  leftTab,
  rightTab,
  pickEnabled,
  setLeftTab,
  openRightTab,
  togglePickMode,
  tabClass,
}) {
  return (
    <div className="card shadow-sm mb-3">
      <div
        className="card-body"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          justifyItems: "center",
        }}
      >
        <button
          className={tabClass(rightTab === "plate")}
          style={{ width: "100%" }}
          onClick={() => openRightTab("plate")}
          type="button"
        >
          <i className="bi bi-palette me-2 fs-6 align-middle" />
          Palette
        </button>

        <button
          className={tabClass(rightTab === "image")}
          style={{ width: "100%" }}
          onClick={() => openRightTab("image")}
          type="button"
        >
          <i className="bi bi-image me-2 fs-6 align-middle" />
          Image
        </button>

        <button
          className={tabClass(rightTab === "needed")}
          style={{ width: "100%" }}
          onClick={() => openRightTab("needed")}
          type="button"
        >
          <i className="bi bi-calculator me-2 fs-6 align-middle" />
          Solution
        </button>

        <button
          className={tabClass(leftTab === "target")}
          style={{ width: "100%" }}
          onClick={() => setLeftTab("target")}
          type="button"
        >
          <i className="bi bi-bullseye me-2 fs-6 align-middle" />
          Target
        </button>

        <button
          className={tabClass(leftTab === "current")}
          style={{ width: "100%" }}
          onClick={() => setLeftTab("current")}
          type="button"
        >
          <i className="bi bi-compass me-2 fs-6 align-middle" />
          Current
        </button>

        <button
          className={`btn btn-sm ${pickEnabled ? "btn-dark" : "btn-outline-dark"}`}
          style={{ width: "100%" }}
          onClick={togglePickMode}
          type="button"
        >
          <i className="bi bi-eyedropper me-2 fs-6 align-middle" />
          Picker
        </button>
      </div>
    </div>
  );
}
