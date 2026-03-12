// PATH: src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import ColorPanel from "./components/ColorPanel";
import FinalAnalysisPanel from "./components/FinalAnalysisPanel";
import ImagePickerStage from "./components/ImagePickerStage";
import ColorPlateStage from "./components/ColorPlateStage";
import useMagnifierCanvas from "./hooks/useMagnifierCanvas";

import { COLOR_PLATE } from "./utils/colorPlate";
import { clamp, bryToRgb, bryToRgbString } from "./utils/colorMath";
import { invertRgbToBry } from "./utils/invertBry";
import { sampleAverageFiltered } from "./utils/sampling";

/* =========================
   Helpers
========================= */
function clamp255(n) {
  return clamp(Math.round(n), 0, 255);
}

export default function App() {
  /* =========================
     Constants
  ========================= */
  const SAMPLE_RADIUS = 0; // locked to true 1×1 pixel

  /* =========================
     UI State
  ========================= */
  const [uploadKey, setUploadKey] = useState(0);

  // Locks (sliders + picker overwrite prevention)
  const [lockTarget, setLockTarget] = useState(false);
  const [lockCurrent, setLockCurrent] = useState(false);

  // Zoom (Image tab)
  const [imgZoom, setImgZoom] = useState(1);

  // Mobile collapse toggles
  // - Result panel = Needed/Plate/Image (mobile-first column)
  // - Controls panel = Target/Current sliders (second column)
  const [resultCollapsedMobile, setResultCollapsedMobile] = useState(false);
  const [controlsCollapsedMobile, setControlsCollapsedMobile] = useState(false);

  /* =========================
     Tabs + Picker Mode
  ========================= */
  const [leftTab, setLeftTab] = useState("target"); // target | current
  const [rightTab, setRightTab] = useState("plate"); // needed | plate | image

  const [activeBox, setActiveBox] = useState("target"); // target | current
  const [pickEnabled, setPickEnabled] = useState(false);
  const [pickSource, setPickSource] = useState("image"); // image | plate

  /* =========================
     Meta: where last set from
  ========================= */
  const [targetPickedFrom, setTargetPickedFrom] = useState(null);
  const [currentPickedFrom, setCurrentPickedFrom] = useState(null);

  /* =========================
     Refs
  ========================= */
  const pinCanvasRef = useRef(null);

  // Image refs
  const canvasRef = useRef(null); // hidden original-resolution canvas
  const imgRef = useRef(null); // displayed image element

  // Plate refs
  const plateCanvasRef = useRef(null); // hidden plate canvas for magnifier
  const plateWrapRef = useRef(null); // wrapper for coordinate mapping

  /* =========================
     Source Data
  ========================= */
  const [imgUrl, setImgUrl] = useState(null);

  /* =========================
     BRY Values
  ========================= */
  const [target, setTarget] = useState({ b: 0, r: 0, y: 0 });
  const [current, setCurrent] = useState({ b: 0, r: 0, y: 0 });

  // Base states (true picked RGB from image) for smooth preview while sliders move
  const [targetBaseRGB, setTargetBaseRGB] = useState(null);
  const [currentBaseRGB, setCurrentBaseRGB] = useState(null);
  const [targetBaseBRY, setTargetBaseBRY] = useState(null);
  const [currentBaseBRY, setCurrentBaseBRY] = useState(null);

  /* =========================
     Hover State (Magnifier)
  ========================= */
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

  const [hoverPlate, setHoverPlate] = useState({
    show: false,
    x: 0,
    y: 0,
    imgX: 0,
    imgY: 0,
  });

  /* =========================
     Effects: keep activeBox aligned
  ========================= */
  useEffect(() => {
    setActiveBox(leftTab === "target" ? "target" : "current");
  }, [leftTab]);

  /* =========================
     Effects: auto-open collapse on tab change (mobile)
  ========================= */
  useEffect(() => {
    setControlsCollapsedMobile(false);
  }, [leftTab]);

  useEffect(() => {
    setResultCollapsedMobile(false);
  }, [rightTab]);

  /* =========================
     Zoom Functions
  ========================= */
  const zoomIn = () =>
    setImgZoom((z) => Math.min(6, Number((z + 0.25).toFixed(2))));
  const zoomOut = () =>
    setImgZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
  const zoomReset = () => setImgZoom(1);

  /* =========================
     Load uploaded image into hidden canvas (original resolution)
  ========================= */
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

  /* =========================
     Build ColorPlate into hidden canvas (for magnifier)
  ========================= */
  useEffect(() => {
    const c = plateCanvasRef.current;
    if (!c) return;

    const COLS = 5;
    const ROW_KEYS = Object.keys(COLOR_PLATE);
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

  /* =========================
     Clear base states if sliders return to 0
  ========================= */
  useEffect(() => {
    const isZero = target.b === 0 && target.r === 0 && target.y === 0;
    if (isZero) {
      setTargetBaseRGB(null);
      setTargetBaseBRY(null);
    }
  }, [target.b, target.r, target.y]);

  useEffect(() => {
    const isZero = current.b === 0 && current.r === 0 && current.y === 0;
    if (isZero) {
      setCurrentBaseRGB(null);
      setCurrentBaseBRY(null);
    }
  }, [current.b, current.r, current.y]);

  /* =========================
     Magnifier hook
  ========================= */
  const activeHover = pickSource === "image" ? hover : hoverPlate;
  const activeSrcCanvasRef =
    pickSource === "image" ? canvasRef : plateCanvasRef;

  useMagnifierCanvas({
    hover: activeHover,
    imgUrl: pickSource === "image" ? imgUrl : "__plate__",
    pinCanvasRef,
    canvasRef: activeSrcCanvasRef,
  });

  /* =========================
     Safe setters (Lock-aware)
  ========================= */
  const setTargetSafe = (valuesUpdater) => {
    if (lockTarget) return;
    setTarget((prev) =>
      typeof valuesUpdater === "function" ? valuesUpdater(prev) : valuesUpdater,
    );
  };

  const setCurrentSafe = (valuesUpdater) => {
    if (lockCurrent) return;
    setCurrent((prev) =>
      typeof valuesUpdater === "function" ? valuesUpdater(prev) : valuesUpdater,
    );
  };

  /* =========================
     Preview Logic (baseRGB + delta(simNow - simBase))
  ========================= */
  function computePreviewRGB(baseRGB, baseBRY, nowBRY) {
    if (!baseRGB || !baseBRY) return null;

    const simBase = bryToRgb(baseBRY.b, baseBRY.r, baseBRY.y);
    const simNow = bryToRgb(nowBRY.b, nowBRY.r, nowBRY.y);

    return {
      r: clamp255(baseRGB.r + (simNow.r - simBase.r)),
      g: clamp255(baseRGB.g + (simNow.g - simBase.g)),
      b: clamp255(baseRGB.b + (simNow.b - simBase.b)),
    };
  }

  const targetPreviewRGB = useMemo(
    () => computePreviewRGB(targetBaseRGB, targetBaseBRY, target),
    [targetBaseRGB, targetBaseBRY, target],
  );

  const currentPreviewRGB = useMemo(
    () => computePreviewRGB(currentBaseRGB, currentBaseBRY, current),
    [currentBaseRGB, currentBaseBRY, current],
  );

  const targetBg = useMemo(() => {
    if (targetPreviewRGB)
      return `rgb(${targetPreviewRGB.r}, ${targetPreviewRGB.g}, ${targetPreviewRGB.b})`;
    return bryToRgbString(target.b, target.r, target.y);
  }, [target, targetPreviewRGB]);

  const currentBg = useMemo(() => {
    if (currentPreviewRGB)
      return `rgb(${currentPreviewRGB.r}, ${currentPreviewRGB.g}, ${currentPreviewRGB.b})`;
    return bryToRgbString(current.b, current.r, current.y);
  }, [current, currentPreviewRGB]);

  /* =========================
   Target and current preview Box
  =========================== */
  const targetNote =
    targetPickedFrom === "image" && targetBaseRGB
      ? "Preview: True picked RGB (with smooth slider adjustment)"
      : "Preview: Simulated from BRY";

  const currentNote =
    currentPickedFrom === "image" && currentBaseRGB
      ? "Preview: True picked RGB (with smooth slider adjustment)"
      : "Preview: Simulated from BRY";

  /* =========================
     App actions
  ========================= */
  function resetApp() {
    setTarget({ b: 0, r: 0, y: 0 });
    setCurrent({ b: 0, r: 0, y: 0 });

    setUploadKey((k) => k + 1);

    setTargetBaseRGB(null);
    setCurrentBaseRGB(null);
    setTargetBaseBRY(null);
    setCurrentBaseBRY(null);

    setTargetPickedFrom(null);
    setCurrentPickedFrom(null);

    setPickEnabled(false);
    setPickSource("image");
    setImgZoom(1);

    setHover({
      show: false,
      x: 0,
      y: 0,
      imgX: 0,
      imgY: 0,
      simBg: null,
      bry: null,
      rgb: null,
    });
    setHoverPlate({ show: false, x: 0, y: 0, imgX: 0, imgY: 0 });

    setImgUrl(null);

    setLeftTab("target");
    setRightTab("plate");
  }

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    setTargetBaseRGB(null);
    setCurrentBaseRGB(null);
    setTargetBaseBRY(null);
    setCurrentBaseBRY(null);

    setTargetPickedFrom(null);
    setCurrentPickedFrom(null);

    setImgZoom(1);
  }

  function openRightTab(tab) {
    setRightTab(tab);

    if (tab === "image") setPickSource("image");
    if (tab === "plate") setPickSource("plate");

    if (tab === "needed") {
      setPickEnabled(false);
      setHover((h) => ({ ...h, show: false }));
      setHoverPlate((h) => ({ ...h, show: false }));
    }
  }

  function togglePickMode() {
    // Only block if IMAGE tab is active
    if (rightTab === "image" && !imgUrl) {
      alert("Upload an image first.");
      return;
    }

    setPickEnabled((p) => !p);

    // clear hover pins
    setHover((h) => ({ ...h, show: false }));
    setHoverPlate((h) => ({ ...h, show: false }));
  }

  /* =========================
     Coordinate helpers
  ========================= */
  function transferChannel(channel) {
    if (leftTab === "target") {
      setCurrent((p) => ({ ...p, [channel]: target[channel] }));
    } else {
      setTarget((p) => ({ ...p, [channel]: current[channel] }));
    }
  }

  function getClientXY(e) {
    if (e?.touches?.length)
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    if (e?.changedTouches?.length)
      return {
        clientX: e.changedTouches[0].clientX,
        clientY: e.changedTouches[0].clientY,
      };
    return { clientX: e.clientX, clientY: e.clientY };
  }

  function mapClientToImageXY(e) {
    const srcCanvas = canvasRef.current;
    const imgEl = imgRef.current;
    if (!srcCanvas || !imgEl) return null;

    const rect = imgEl.getBoundingClientRect();
    const { clientX, clientY } = getClientXY(e);

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height)
      return null;

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

    if (
      clickX < offX ||
      clickX > offX + drawW ||
      clickY < offY ||
      clickY > offY + drawH
    )
      return null;

    const normX = (clickX - offX) / drawW;
    const normY = (clickY - offY) / drawH;

    const snapX = Math.round(normX * imgW);
    const snapY = Math.round(normY * imgH);

    const snappedClientX = offX + (snapX / imgW) * drawW;
    const snappedClientY = offY + (snapY / imgH) * drawH;

    return { imgX: snapX, imgY: snapY, x: snappedClientX, y: snappedClientY };
  }

  function mapClientToPlateXY(e) {
    const srcCanvas = plateCanvasRef.current;
    const wrap = plateWrapRef.current;
    if (!srcCanvas || !wrap) return null;

    const rect = wrap.getBoundingClientRect();
    const { clientX, clientY } = getClientXY(e);

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const imgX = Math.round((clickX / rect.width) * srcCanvas.width);
    const imgY = Math.round((clickY / rect.height) * srcCanvas.height);

    return { clickX, clickY, imgX, imgY };
  }

  /* =========================
     Handlers: Image hover/click
  ========================= */
  function onImageMouseMove(e) {
    if (!pickEnabled || !imgUrl) return;

    const mapped = mapClientToImageXY(e);
    if (!mapped) {
      setHover((p) => ({ ...p, show: false }));
      return;
    }

    const ctx = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    const rgb = sampleAverageFiltered(
      ctx,
      mapped.imgX,
      mapped.imgY,
      SAMPLE_RADIUS,
    );

    setHover({
      show: true,
      x: mapped.x,
      y: mapped.y,
      imgX: mapped.imgX,
      imgY: mapped.imgY,
      simBg: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      bry: null,
      rgb,
    });
  }

  function onImageMouseLeave() {
    setHover((p) => ({ ...p, show: false }));
  }

  function onImageClick() {
    if (!pickEnabled || !imgUrl) return;
    if (!hover.show || !hover.rgb) return;

    const bry = invertRgbToBry(hover.rgb);

    if (activeBox === "target") {
      if (lockTarget) {
        alert("Target is locked. Unlock it to pick a new color.");
        return;
      }
      setTarget(bry);
      setTargetBaseRGB(hover.rgb);
      setTargetBaseBRY(bry);
      setTargetPickedFrom("image");
    } else {
      if (lockCurrent) {
        alert("Current is locked. Unlock it to pick a new color.");
        return;
      }
      setCurrent(bry);
      setCurrentBaseRGB(hover.rgb);
      setCurrentBaseBRY(bry);
      setCurrentPickedFrom("image");
    }
  }

  /* =========================
     Handlers: Plate hover/click
  ========================= */
  function onPlateMouseMove(e) {
    if (!pickEnabled) return;
    const mapped = mapClientToPlateXY(e);
    if (!mapped) return;
    const { clickX, clickY, imgX, imgY } = mapped;
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
      if (lockTarget) {
        alert("Target is locked. Unlock it to pick a new color.");
        return;
      }
      setTarget(bry);
      setTargetBaseBRY(bry);
      setTargetPickedFrom("plate");
    } else {
      if (lockCurrent) {
        alert("Current is locked. Unlock it to pick a new color.");
        return;
      }
      setCurrent(bry);
      setCurrentBaseBRY(bry);
      setCurrentPickedFrom("plate");
    }
  }

  /* =========================
     Manual slider updates
  ========================= */
  function setTargetWithManual(valuesUpdater) {
    setTargetSafe(valuesUpdater);
  }
  function setCurrentWithManual(valuesUpdater) {
    setCurrentSafe(valuesUpdater);
  }

  /* =========================
     Transfer actions
  ========================= */
  function transferTargetToCurrent() {
    setCurrent(target);
    setCurrentBaseRGB(null);
    setCurrentBaseBRY(null);
    setCurrentPickedFrom("manual");
  }

  function transferCurrentToTarget() {
    setTarget(current);
    setTargetBaseRGB(null);
    setTargetBaseBRY(null);
    setTargetPickedFrom("manual");
  }

  /* =========================
     UI helpers
  ========================= */
  const tabClass = (active) =>
    `btn btn-sm ${active ? "btn-dark" : "btn-outline-dark"}`;

  /* =========================
     Render
  ========================= */
  return (
    <div
      className="container-fluid py-3"
      style={{ background: "#f3f4f6", minHeight: "100vh" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        {/* =========================
           TOP TABS (your mobile-friendly order)
        ========================= */}
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

        {/* =========================
   MOBILE COLOR PREVIEW
   Shows picked colors quickly on phone
========================= */}
        {rightTab !== "needed" && (
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
        )}

        {/* =========================
           MAIN ROW
           - Column 1 (mobile-first): RESULT PANEL (Needed / Plate / Image)
           - Column 2: CONTROLS PANEL (Target / Current sliders)
        ========================= */}
        <div className="row g-3">
          {/* =========================
             RESULT PANEL (mobile first)
          ========================= */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                {/* Header row */}
                <div className="d-flex align-items-center justify-content-between">
                  <div className="h5 mb-0">
                    {rightTab === "needed"
                      ? "Needed"
                      : rightTab === "plate"
                        ? "Plate"
                        : "Image"}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Show zoom controls only on Image tab */}
                    {rightTab === "image" && (
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="small text-muted fw-semibold">
                          Zoom:{" "}
                          <span className="text-dark">
                            {Math.round(imgZoom * 100)}%
                          </span>
                        </div>

                        <div
                          className="btn-group"
                          role="group"
                          aria-label="Zoom controls"
                        >
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={zoomOut}
                            title="Zoom out"
                          >
                            <i className="bi bi-zoom-out fs-6 align-middle" />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={zoomReset}
                            title="Reset zoom"
                          >
                            <i className="bi bi-aspect-ratio fs-6 align-middle" />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={zoomIn}
                            title="Zoom in"
                          >
                            <i className="bi bi-zoom-in fs-6 align-middle" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mobile only +/- collapse */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-lg-none"
                      onClick={() => setResultCollapsedMobile((v) => !v)}
                      title={
                        resultCollapsedMobile ? "Show panel" : "Hide panel"
                      }
                    >
                      <i
                        className={`bi ${resultCollapsedMobile ? "bi-plus" : "bi-dash"} fs-5`}
                      />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Info"
                    >
                      <i className="bi bi-info-circle fs-6 align-middle" />
                    </button>
                  </div>
                </div>

                {/* Hide/show only on mobile */}
                <div
                  className={resultCollapsedMobile ? "d-none d-lg-block" : ""}
                >
                  <hr className="my-3" />

                  {rightTab === "needed" ? (
                    <FinalAnalysisPanel
                      target={target}
                      current={current}
                      targetBg={targetBg}
                      currentBg={currentBg}
                    />
                  ) : rightTab === "plate" ? (
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
                    <div className="w-100">
                      {/* =========================
     IMAGE TOOLS ROW
     - Upload first
     - Zoom controls second
  ========================= */}
                      <div className="d-flex flex-column gap-3 mb-3">
                        {/* Upload */}
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <label className="small fw-semibold mb-0">
                            Upload Image
                          </label>

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

                      {/* Image Preview */}
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

          {/* =========================
             CONTROLS PANEL (sliders)
          ========================= */}
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
                        controlsCollapsedMobile
                          ? "Show sliders"
                          : "Hide sliders"
                      }
                    >
                      <i
                        className={`bi ${controlsCollapsedMobile ? "bi-plus" : "bi-dash"} fs-5`}
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

                    {/* TRANSFER */}
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
                <div
                  className={controlsCollapsedMobile ? "d-none d-lg-block" : ""}
                >
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
        </div>

        {/* =========================
           Hidden canvases
        ========================= */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={plateCanvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
