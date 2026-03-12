// PATH: src/components/ImageToolsRow.jsx
import React from "react";

export default function ImageToolsRow({ uploadKey, onUpload }) {
  return (
    <div className="d-flex flex-column gap-3 mb-3">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <label className="small fw-semibold mb-0">Upload Image</label>

        <input
          name="image-upload"
          key={uploadKey || 0}
          className="form-control form-control-sm"
          style={{ maxWidth: 220 }}
          type="file"
          accept="image/*"
          onChange={onUpload}
        />
      </div>
    </div>
  );
}
