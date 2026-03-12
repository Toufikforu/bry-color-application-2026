// PATH: src/App.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import ColorPanel from "./components/ColorPanel";
import ControlsBar from "./components/ControlsBar";
import FinalAnalysisPanel from "./components/FinalAnalysisPanel";
import ImagePickerStage from "./components/ImagePickerStage";
import ColorPlateStage, { COLOR_PLATE } from "./components/ColorPlateStage";
import useMagnifierCanvas from "./hooks/useMagnifierCanvas";

import { rgbToRyb255, ryb255ToBry100, bryToRgbString } from "./utils/colorMath";
import { sampleAverageFiltered } from "./utils/sampling";

export default function App() {
  const SAMPLE_RADIUS = 0; // ✅ locked to true 1×1 pixel

  const [uploadKey, setUploadKey] = useState(0);

  // Track where each box was last set from
  const [targetPickedFrom, setTargetPickedFrom] = useState(null); // "image" | "plate" | null
  const [currentPickedFrom, setCurrentPickedFrom] = useState(null);

  // Shared pin magnifier canvas
  const pinCanvasRef = useRef(null);

  // MAIN image refs
  const canvasRef = useRef(null); // hidden original-resolution canvas
  const imgRef = useRef(null); // displayed image

  // PLATE refs
  const plateCanvasRef = useRef(null); // hidden canvas for plate sampling/magnifier
  const plateWrapRef = useRef(null); // DOM wrapper for coordinate mapping

  const [imgUrl, setImgUrl] = useState(null);
  const [activeBox, setActiveBox] = useState("target"); // target | current
  const [pickEnabled, setPickEnabled] = useState(false);

  // Pick source switch
  const [pickSource, setPickSource] = useState("image"); // "image" | "plate"

  // Hover states
  const [hover, setHover] = useState({
    show: false,
    x: 0,
    y: 0,
    imgX: 0,
    imgY: 0,
    simBg: null,
    bry: null,
    rgb: null,
  });

  const [hoverPlate, setHoverPlate] = useState({ show: false, x: 0, y: 0, imgX: 0, imgY: 0 });

  // BRY values (these ALWAYS drive the preview swatches)
  const [target, setTarget] = useState({ b: 0, r: 0, y: 0 });
  const [current, setCurrent] = useState({ b: 0, r: 0, y: 0 });

  // ✅ True sampled RGB references ONLY for brightness direction decisions in FinalAnalysisPanel
  const [targetRGB, setTargetRGB] = useState(null);
  const [currentRGB, setCurrentRGB] = useState(null);

  // ✅ OPTION 1: Swatches always render SIMULATED BRY (no RGB→SIM flip, no jumping)
  const targetBg = useMemo(() => bryToRgbString(target.b, target.r, target.y), [target]);
  const currentBg = useMemo(() => bryToRgbString(current.b, current.r, current.y), [current]);

  // Notes: clarify that brightness uses sampled RGB if picked from image
  const targetNote =
    targetPickedFrom === "image" && targetRGB
      ? "Picked from image (brightness uses sampled RGB)"
      : "Preview: Simulated from BRY";

  const currentNote =
    currentPickedFrom === "image" && currentRGB
      ? "Picked from image (brightness uses sampled RGB)"
      : "Preview: Simulated from BRY";

  // Load uploaded image into hidden canvas at ORIGINAL resolution
  useEffect(() => {
    if (!imgUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      if (imgRef.current) imgRef.current.src = imgUrl;
    };
    img.src = imgUrl;
  }, [imgUrl]);

  // Build the ColorPlate into its own hidden canvas (for magnifier)
  // ✅ Draw from BRY->RGB so magnifier matches simulated model
  useEffect(() => {
    const c = plateCanvasRef.current;
    if (!c) return;

    const COLS = 5;
    const ROW_KEYS = Object.keys(COLOR_PLATE); // Br,K,B,P,R,O,Y,G
    const cellW = 240;
    const cellH = 140;

    c.width = COLS * cellW;
    c.height = ROW_KEYS.length * cellH;

    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, c.width, c.height);

    ROW_KEYS.forEach((key, r) => {
      COLOR_PLATE[key].forEach((bry, col) => {
        ctx.fillStyle = bryToRgbString(bry.b, bry.r, bry.y);
        ctx.fillRect(col * cellW, r * cellH, cellW, cellH);
      });
    });
  }, []);

  // Magnifier: show for whichever pick source is active
  const activeHover = pickSource === "image" ? hover : hoverPlate;
  const activeSrcCanvasRef = pickSource === "image" ? canvasRef : plateCanvasRef;

  useMagnifierCanvas({
    hover: activeHover,
    imgUrl: pickSource === "image" ? imgUrl : "__plate__",
    pinCanvasRef,
    canvasRef: activeSrcCanvasRef,
  });

  function resetApp() {
    setTarget({ b: 0, r: 0, y: 0 });
    setCurrent({ b: 0, r: 0, y: 0 });

    setUploadKey((k) => k + 1);

    setTargetRGB(null);
    setCurrentRGB(null);

    setTargetPickedFrom(null);
    setCurrentPickedFrom(null);

    setPickEnabled(false);
    setActiveBox("target");
    setPickSource("image");

    setHover({ show: false, x: 0, y: 0, imgX: 0, imgY: 0, simBg: null, bry: null, rgb: null });
    setHoverPlate({ show: false, x: 0, y: 0, imgX: 0, imgY: 0 });

    setImgUrl(null);
  }

  // IMPORTANT: avoid duplicate prop warning by passing only this handler
  function handleSetPickSource(next) {
    setPickSource(next);
    if (next === "plate") {
      setPickEnabled(false);
      setHover((h) => ({ ...h, show: false }));
      setHoverPlate((h) => ({ ...h, show: false }));
    }
  }

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    // new upload clears image-picked context
    setTargetRGB(null);
    setCurrentRGB(null);
    setTargetPickedFrom(null);
    setCurrentPickedFrom(null);
  }

  function onPickColor() {
    if (pickSource === "image" && !imgUrl) return alert("Upload an image first.");
    setPickEnabled((p) => !p);
    setHover((h) => ({ ...h, show: false }));
    setHoverPlate((h) => ({ ...h, show: false }));
  }

  // Map mouse to image canvas coords (handles objectFit contain + letterbox)
  function mapClientToImageXY(e) {
    const srcCanvas = canvasRef.current;
    const imgEl = imgRef.current;
    if (!srcCanvas || !imgEl) return null;

    const rect = imgEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) return null;

    const imgW = srcCanvas.width;
    const imgH = srcCanvas.height;

    const rectAR = rect.width / rect.height;
    const imgAR = imgW / imgH;

    let drawW, drawH, offX, offY;

    if (rectAR > imgAR) {
      drawH = rect.height;
      drawW = drawH * imgAR;
      offX = (rect.width - drawW) / 2;
      offY = 0;
    } else {
      drawW = rect.width;
      drawH = drawW / imgAR;
      offX = 0;
      offY = (rect.height - drawH) / 2;
    }

    if (clickX < offX || clickX > offX + drawW || clickY < offY || clickY > offY + drawH) return null;

    const normX = (clickX - offX) / drawW;
    const normY = (clickY - offY) / drawH;

    const snapX = Math.round(normX * imgW);
    const snapY = Math.round(normY * imgH);

    const snappedClientX = offX + (snapX / imgW) * drawW;
    const snappedClientY = offY + (snapY / imgH) * drawH;

    return { imgX: snapX, imgY: snapY, x: snappedClientX, y: snappedClientY };
  }

  // Map mouse to plate canvas coords (hover/pin)
  function mapClientToPlateXY(e) {
    const srcCanvas = plateCanvasRef.current;
    const rect = plateWrapRef.current.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imgX = (clickX / rect.width) * srcCanvas.width;
    const imgY = (clickY / rect.height) * srcCanvas.height;

    return { clickX, clickY, imgX, imgY };
  }

  // IMAGE handlers
  function onImageMouseMove(e) {
    if (!pickEnabled || !imgUrl) return;

    const mapped = mapClientToImageXY(e);
    if (!mapped) {
      setHover((p) => ({ ...p, show: false }));
      return;
    }

    const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
    const rgb = sampleAverageFiltered(ctx, mapped.imgX, mapped.imgY, SAMPLE_RADIUS);

    const ryb = rgbToRyb255(rgb.r, rgb.g, rgb.b);
    const bry = ryb255ToBry100(ryb);

    const simBg = bryToRgbString(bry.b, bry.r, bry.y);

    setHover({
      show: true,
      x: mapped.x,
      y: mapped.y,
      imgX: mapped.imgX,
      imgY: mapped.imgY,
      simBg,
      bry,
      rgb,
    });
  }

  function onImageMouseLeave() {
    setHover((p) => ({ ...p, show: false }));
  }

  function onImageClick() {
    if (!pickEnabled || !imgUrl) return;
    if (!hover.show || !hover.bry) return;

    if (activeBox === "target") {
      // ✅ BRY drives preview
      setTarget(hover.bry);

      // ✅ RGB saved ONLY for brightness direction decisions
      setTargetRGB(hover.rgb || null);

      setTargetPickedFrom("image");
    } else {
      setCurrent(hover.bry);
      setCurrentRGB(hover.rgb || null);
      setCurrentPickedFrom("image");
    }
  }

  // PLATE handlers
  function onPlateMouseMove(e) {
    if (!pickEnabled) return;
    const { clickX, clickY, imgX, imgY } = mapClientToPlateXY(e);
    setHoverPlate({ show: true, x: clickX, y: clickY, imgX, imgY });
  }

  function onPlateMouseLeave() {
    setHoverPlate((p) => ({ ...p, show: false }));
  }

  function onPlateClick(e) {
    if (!pickEnabled) return;

    const tile = e.target.closest("[data-row]");
    if (!tile) return;

    const rowKey = tile.dataset.row;
    const colIndex = Number(tile.dataset.col);

    const bry = COLOR_PLATE[rowKey]?.[colIndex];
    if (!bry) return;

    if (activeBox === "target") {
      setTarget(bry);
      setTargetRGB(null);
      setTargetPickedFrom("plate");
    } else {
      setCurrent(bry);
      setCurrentRGB(null);
      setCurrentPickedFrom("plate");
    }
  }

  // Manual slider edits (preview already BRY, so no special logic needed)
  function setTargetWithManual(valuesUpdater) {
    setTarget((prev) => (typeof valuesUpdater === "function" ? valuesUpdater(prev) : valuesUpdater));
  }

  function setCurrentWithManual(valuesUpdater) {
    setCurrent((prev) => (typeof valuesUpdater === "function" ? valuesUpdater(prev) : valuesUpdater));
  }

  return (
    <div style={{ padding: 18, fontFamily: "Arial", background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>DYEBOLD V-10 (BRY)</h2>
          <div style={{ fontWeight: 700 }}>{pickEnabled ? "Pick Mode: ON" : "Pick Mode: OFF"}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
          <ColorPanel title="TARGET" values={target} setValues={setTargetWithManual} bg={targetBg} note={targetNote} />
          <ColorPanel title="CURRENT" values={current} setValues={setCurrentWithManual} bg={currentBg} note={currentNote} />

          <FinalAnalysisPanel target={target} current={current} targetRGB={targetRGB} currentRGB={currentRGB} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14, marginTop: 14 }}>
          <ControlsBar
            uploadKey={uploadKey}
            setPickSource={handleSetPickSource}
            activeBox={activeBox}
            setActiveBox={setActiveBox}
            imgUrl={imgUrl}
            onUpload={onUpload}
            pickEnabled={pickEnabled}
            onPickColor={onPickColor}
            pickSource={pickSource}
            onReset={resetApp}
          />

          {pickSource === "image" ? (
            <ImagePickerStage
              imgUrl={imgUrl}
              imgRef={imgRef}
              hover={hover}
              pickEnabled={pickEnabled}
              onImageClick={onImageClick}
              onImageMouseMove={onImageMouseMove}
              onImageMouseLeave={onImageMouseLeave}
              pinCanvasRef={pinCanvasRef}
            />
          ) : (
            <ColorPlateStage
              plateWrapRef={plateWrapRef}
              hover={hoverPlate}
              pickEnabled={pickEnabled}
              onMouseMove={onPlateMouseMove}
              onMouseLeave={onPlateMouseLeave}
              onClick={onPlateClick}
              pinCanvasRef={pinCanvasRef}
            />
          )}
        </div>

        {/* Hidden canvases */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={plateCanvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
