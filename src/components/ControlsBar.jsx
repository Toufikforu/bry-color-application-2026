// PATH: src/components/ControlsBar.jsx
import React from "react";

export default function ControlsBar({
  activeBox,
  setActiveBox,
  activeTab,
  setActiveTab,
  imgUrl,
  onUpload,
  uploadKey,
  pickEnabled,
  onPickColor,
  pickSource,
  setPickSource,
  onReset,
}) {
  const uploadInputId = `upload-input-${uploadKey || 0}`;

  const icon = "fs-6 align-middle"; // consistent icon sizing

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {/* Set Target / Current */}
          <div className="btn-group" role="group" aria-label="Active box">
            <button
              type="button"
              onClick={() => setActiveBox("target")}
              className={`btn btn-sm ${activeBox === "target" ? "btn-dark" : "btn-outline-secondary"}`}
            >
              <i className={`bi bi-bullseye me-2 ${icon}`} />
              Target
            </button>

            <button
              type="button"
              onClick={() => setActiveBox("current")}
              className={`btn btn-sm ${activeBox === "current" ? "btn-dark" : "btn-outline-secondary"}`}
            >
              <i className={`bi bi-compass me-2 ${icon}`} />
              Current
            </button>
          </div>

          {/* Upload (mobile-safe icon button) */}
          <input
            key={uploadKey || 0}
            id={uploadInputId}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="d-none"
          />

          <label htmlFor={uploadInputId} className="btn btn-sm btn-outline-secondary">
            <i className={`bi bi-plus-lg me-2 ${icon}`} />
            Upload Image
          </label>

          {/* Pick source */}
          <div className="d-flex align-items-center gap-2 ms-0 ms-md-2">
            <span className="text-muted fw-semibold small">Pick From:</span>
            <div className="btn-group" role="group" aria-label="Pick source">
              <button
                type="button"
                onClick={() => setPickSource("image")}
                className={`btn btn-sm ${pickSource === "image" ? "btn-dark" : "btn-outline-secondary"}`}
              >
                <i className={`bi bi-image me-2 ${icon}`} />
                Image
              </button>
              <button
                type="button"
                onClick={() => setPickSource("plate")}
                className={`btn btn-sm ${pickSource === "plate" ? "btn-dark" : "btn-outline-secondary"}`}
              >
                <i className={`bi bi-palette me-2 ${icon}`} />
                Plate
              </button>
            </div>
          </div>

          {/* Pick mode toggle */}
          <button
            type="button"
            onClick={onPickColor}
            className={`btn btn-sm ${pickEnabled ? "btn-success" : "btn-outline-success"} ms-0 ms-md-2`}
            title="Toggle Pick Mode"
          >
            <i className={`bi bi-eyedropper me-2 ${icon}`} />
            Picker {pickEnabled ? "ON" : "OFF"}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="btn btn-sm btn-outline-danger ms-auto"
            title="Reset everything"
          >
            <i className={`bi bi-arrow-counterclockwise me-2 ${icon}`} />
            Reset
          </button>
        </div>

        {/* Info rows */}
        <div className="mt-3 small text-muted">
          <div className="d-flex flex-wrap gap-3">
            <div>
              Active Box: <span className="text-dark fw-semibold text-uppercase">{activeBox}</span>
            </div>
            <div>
              Pick Source:{" "}
              <span className="text-dark fw-semibold">
                {pickSource === "image" ? "Uploaded Image" : "Built-in ColorPlate"}
              </span>
            </div>
            <div>
              Sampling: <span className="text-dark fw-semibold">1×1 true pixel</span>
            </div>
          </div>

          {!imgUrl && pickSource === "image" ? (
            <div className="mt-2">
              <i className={`bi bi-info-circle me-2 ${icon}`} />
              Upload an image to pick from it.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}