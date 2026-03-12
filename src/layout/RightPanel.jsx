import React from "react";
import ColorPanel from "../components/ColorPanel";

export default function LeftPanel({
  target,
  current,
  targetBg,
  currentBg,
  targetNote,
  currentNote,
  setTargetWithManual,
  setCurrentWithManual,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ColorPanel
        title="TARGET"
        values={target}
        setValues={setTargetWithManual}
        bg={targetBg}
        note={targetNote}
      />

      <ColorPanel
        title="CURRENT"
        values={current}
        setValues={setCurrentWithManual}
        bg={currentBg}
        note={currentNote}
      />
    </div>
  );
}