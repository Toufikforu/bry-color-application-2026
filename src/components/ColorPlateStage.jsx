// PATH: src/components/ColorPlateStage.jsx

import React from "react";
import MagnifierPin from "./MagnifierPin";
import { bryToRgbString } from "../utils/colorMath";
import { COLOR_PLATE } from "../utils/colorPlate";

const ROWS = [
  { key: "Br", label: "Br" },
  { key: "K", label: "K" },
  { key: "B", label: "B" },
  { key: "P", label: "P" },
  { key: "R", label: "R" },
  { key: "O", label: "O" },
  { key: "Y", label: "Y" },
  { key: "G", label: "G" },
];

// Build BRY plate (authoritative) so tile color === preview color after picking.
// Levels 1..5

export default function ColorPlateStage({
  plateWrapRef,
  hover,
  pickEnabled,
  onMouseMove,
  onMouseLeave,
  onClick,
  pinCanvasRef,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #ddd",
      }}
    >
      <div
        ref={plateWrapRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        style={{
          position: "relative",
          height: 420,
          borderRadius: 14,
          border: "1px solid #bbb",
          overflow: "hidden",
          cursor: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: `repeat(${ROWS.length}, 1fr)`,
            width: "100%",
            height: "100%",
          }}
        >
          {ROWS.flatMap((row) =>
            COLOR_PLATE[row.key].map((bry, idx) => {
              const label = `${row.label}-${idx + 1}`;
              const bg = bryToRgbString(bry.b, bry.r, bry.y);

              return (
                <div
                  key={label}
                  data-row={row.key}
                  data-col={idx}
                  style={{
                    background: bg,
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 10,
                    fontWeight: 800,
                    fontSize: 16,
                    color: "rgba(0,0,0,0.55)",
                    textShadow: "0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  {label}
                </div>
              );
            }),
          )}
        </div>

        {/* Same pin overlay */}
        {hover.show && pickEnabled && (
          <MagnifierPin hover={hover} pinCanvasRef={pinCanvasRef} />
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
        Click any square to set{" "}
        <b>{pickEnabled ? "Target/Current" : "— turn Pick Mode ON"}</b>.
      </div>
    </div>
  );
}
