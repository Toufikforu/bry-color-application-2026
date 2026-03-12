// PATH: src/components/MobilePreviewBar.jsx
import React from "react";

export default function MobilePreviewBar({ rightTab, targetBg, currentBg }) {
  // Hide on "needed" tab
  // if (rightTab === "needed") return null;

  return (
    <div className="d-lg-none mb-3">
      <div className="row g-2">
        <div className="col-6">
          <div className="card shadow-sm">
            <div className="card-body text-center p-2">
              <div className="small fw-semibold mb-1">Target</div>
              <div
                style={{
                  height: 40,
                  borderRadius: 8,
                  background: targetBg,
                  border: "1px solid rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-6">
          <div className="card shadow-sm">
            <div className="card-body text-center p-2">
              <div className="small fw-semibold mb-1">Current</div>
              <div
                style={{
                  height: 40,
                  borderRadius: 8,
                  background: currentBg,
                  border: "1px solid rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
