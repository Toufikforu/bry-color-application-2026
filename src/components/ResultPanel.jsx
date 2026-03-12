// PATH: src/components/ResultPanel.jsx
import React from "react";
import ImageToolsRow from "./ImageToolsRow";
import FinalAnalysisPanel from "./FinalAnalysisPanel";
import ImagePickerStage from "./ImagePickerStage";
import ColorPlateStage from "./ColorPlateStage";

export default function ResultPanel({
  rightTab,
  imgZoom,
  zoomIn,
  zoomOut,
  zoomReset,

  resultCollapsedMobile,
  setResultCollapsedMobile,

  target,
  current,
  targetBg,
  currentBg,

  plateWrapRef,
  hoverPlate,
  pickEnabled,
  onPlateMouseMove,
  onPlateMouseLeave,
  onPlateClick,

  pinCanvasRef,

  uploadKey,
  onUpload,

  imgUrl,
  imgRef,
  hover,

  onImageClick,
  onImageMouseMove,
  onImageMouseLeave,
}) {
  return (
    <div className="col-12 col-lg-6">
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between">
            <div className="h5 mb-0">
              {rightTab === "needed"
                ? "Needed"
                : rightTab === "plate"
                  ? "Plate"
                  : "Image"}
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Zoom (Image tab only) */}
              {rightTab === "image" && (
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="small text-muted fw-semibold">
                    Zoom:{" "}
                    <span className="text-dark">
                      {Math.round(imgZoom * 100)}%
                    </span>
                  </div>

                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={zoomOut}
                      title="Zoom out"
                    >
                      <i className="bi bi-zoom-out" />
                    </button>

                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={zoomReset}
                      title="Reset zoom"
                    >
                      <i className="bi bi-aspect-ratio" />
                    </button>

                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={zoomIn}
                      title="Zoom in"
                    >
                      <i className="bi bi-zoom-in" />
                    </button>
                  </div>
                </div>
              )}

              {/* Collapse button (mobile) */}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-lg-none"
                onClick={() => setResultCollapsedMobile((v) => !v)}
              >
                <i
                  className={`bi ${
                    resultCollapsedMobile ? "bi-plus" : "bi-dash"
                  }`}
                />
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="bi bi-info-circle" />
              </button>
            </div>
          </div>

          {/* Collapse area */}
          <div className={resultCollapsedMobile ? "d-none d-lg-block" : ""}>
            <hr className="my-3" />

            {/* =========================
               SOLUTION TAB
            ========================= */}
            {rightTab === "needed" ? (
              <FinalAnalysisPanel
                target={target}
                current={current}
                targetBg={targetBg}
                currentBg={currentBg}
              />
            ) : rightTab === "plate" ? (
              /* =========================
                 PALETTE TAB
              ========================= */
              <div className="w-100">
                <ColorPlateStage
                  plateWrapRef={plateWrapRef}
                  hover={hoverPlate}
                  pickEnabled={pickEnabled}
                  onMouseMove={onPlateMouseMove}
                  onMouseLeave={onPlateMouseLeave}
                  onClick={onPlateClick}
                  pinCanvasRef={pinCanvasRef}
                />
              </div>
            ) : (
              /* =========================
                 IMAGE TAB
              ========================= */
              <div className="w-100">
                {/* Upload */}
                <ImageToolsRow uploadKey={uploadKey} onUpload={onUpload} />

                {/* Image picker */}
                <ImagePickerStage
                  key={`image-stage-${rightTab}-${imgUrl || "empty"}`}
                  imgUrl={imgUrl}
                  imgRef={imgRef}
                  hover={hover}
                  pickEnabled={pickEnabled}
                  onImageClick={onImageClick}
                  onImageMouseMove={onImageMouseMove}
                  onImageMouseLeave={onImageMouseLeave}
                  pinCanvasRef={pinCanvasRef}
                  zoom={imgZoom}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
