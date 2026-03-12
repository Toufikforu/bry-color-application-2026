// PATH: src/components/MagnifierPin.jsx

import React from "react";

export default function MagnifierPin({ hover, pinCanvasRef }) {
  return (
    <div className="pickerPin" style={{ left: hover.x, top: hover.y }}>
      <div className="pickerPinTop">
        <canvas
          ref={pinCanvasRef}
          style={{ width: 84, height: 84, borderRadius: "50%" }}
        />

        {/* ✅ Red dot inside magnifier (center) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(255,0,0,0.9)",
            border: "2px solid rgba(255,255,255,0.9)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      </div>

      {/* ✅ Dark PLUS at the actual picking point (under the pin) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -14, // same position as old dot
          transform: "translateX(-50%)",
          width: 22,
          height: 22,
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        {/* vertical */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: 3,
            height: "100%",
            background: "rgba(0,0,0,0.65)", // dark gray like your photo
            borderRadius: 2,
          }}
        />
        {/* horizontal */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            transform: "translateY(-50%)",
            height: 3,
            width: "100%",
            background: "rgba(0,0,0,0.65)",
            borderRadius: 2,
          }}
        />
      </div>

      {/* ✅ Keep the old bottom dot (as you requested) */}
      <div className="pickerDot" />
    </div>
  );
}
