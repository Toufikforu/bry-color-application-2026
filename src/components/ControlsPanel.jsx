// PATH: src/components/ControlsPanel.jsx
import React from "react";
import ColorPanel from "./ColorPanel";

export default function ControlsPanel({
  leftTab,

  controlsCollapsedMobile,
  setControlsCollapsedMobile,

  lockTarget,
  lockCurrent,
  setLockTarget,
  setLockCurrent,

  resetApp,
  transferTargetToCurrent,
  transferCurrentToTarget,

  target,
  current,
  setTargetWithManual,
  setCurrentWithManual,
  targetBg,
  currentBg,
  targetNote,
  currentNote,

  transferChannel,
}) {
  return (
    <div className="col-12 col-lg-6">
      <div className="card shadow-sm">
        <div className="card-body">
          {/* Header row */}
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="h5 mb-0">
                {leftTab === "target" ? "Target" : "Current"}
              </div>
              <span className="badge text-bg-light border fw-semibold">
                Adjustment
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Mobile only +/- collapse */}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-lg-none"
                onClick={() => setControlsCollapsedMobile((v) => !v)}
                title={
                  controlsCollapsedMobile ? "Show sliders" : "Hide sliders"
                }
              >
                <i
                  className={`bi ${
                    controlsCollapsedMobile ? "bi-plus" : "bi-dash"
                  } fs-5`}
                />
              </button>

              {/* LOCK */}
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => {
                  if (leftTab === "target") setLockTarget((v) => !v);
                  else setLockCurrent((v) => !v);
                }}
                title="Lock"
              >
                <i
                  className={`bi ${
                    leftTab === "target"
                      ? lockTarget
                        ? "bi-lock-fill"
                        : "bi-unlock"
                      : lockCurrent
                        ? "bi-lock-fill"
                        : "bi-unlock"
                  }`}
                />
              </button>

              {/* RESET */}
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={resetApp}
                title="Reset"
              >
                <i className="bi bi-arrow-counterclockwise fs-6 align-middle" />
              </button>

              {/* TRANSFER ALL */}
              <button
                className="btn btn-sm btn-outline-dark"
                type="button"
                onClick={
                  leftTab === "target"
                    ? transferTargetToCurrent
                    : transferCurrentToTarget
                }
                title={
                  leftTab === "target"
                    ? "Transfer Values to Current"
                    : "Transfer Values to Target"
                }
              >
                <i className="bi bi-arrow-left-right fs-6 align-middle" />
              </button>
            </div>
          </div>

          {/* Hide/show only on mobile */}
          <div className={controlsCollapsedMobile ? "d-none d-lg-block" : ""}>
            <hr className="my-3" />

            {leftTab === "target" ? (
              <ColorPanel
                title={null}
                values={target}
                setValues={setTargetWithManual}
                bg={targetBg}
                note={targetNote}
                disabled={lockTarget}
                onTransferChannel={transferChannel}
              />
            ) : (
              <ColorPanel
                title={null}
                values={current}
                setValues={setCurrentWithManual}
                bg={currentBg}
                note={currentNote}
                disabled={lockCurrent}
                onTransferChannel={transferChannel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
