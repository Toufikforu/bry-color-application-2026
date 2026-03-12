import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ---------- RGB -> RYB (0..255) ----------
function rgbToRyb255(r255, g255, b255) {
  let r = r255 / 255;
  let g = g255 / 255;
  let b = b255 / 255;

  const w = Math.min(r, g, b);
  r -= w;
  g -= w;
  b -= w;

  const mg = Math.max(r, g, b);

  let y = Math.min(r, g);
  r -= y;
  g -= y;

  if (b > 0 && g > 0) {
    b = b + g;
    g = 0;
  }
  y = y + g;

  const my = Math.max(r, y, b);
  if (my > 0) {
    const n = mg / my;
    r *= n;
    y *= n;
    b *= n;
  }

  r += w;
  y += w;
  b += w;

  return [Math.round(r * 255), Math.round(y * 255), Math.round(b * 255)]; // [R,Y,B]
}

// RYB -> BRY % (your order: Blue, Red, Yellow)
function ryb255ToBry100(ryb) {
  const r = Math.round((ryb[0] / 255) * 100);
  const y = Math.round((ryb[1] / 255) * 100);
  const b = Math.round((ryb[2] / 255) * 100);
  return { b, r, y };
}

// Perceived brightness (0..255)
function brightness(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// sample NxN with glare/shadow protection (fallback to raw average)
function sampleAverageFiltered(ctx, x, y, radius) {
  const { width, height } = ctx.canvas;
  const x0 = clamp(Math.floor(x - radius), 0, width - 1);
  const y0 = clamp(Math.floor(y - radius), 0, height - 1);
  const x1 = clamp(Math.floor(x + radius), 0, width - 1);
  const y1 = clamp(Math.floor(y + radius), 0, height - 1);

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;

  if (w <= 0 || h <= 0) return { r: 0, g: 0, b: 0 };

  const data = ctx.getImageData(x0, y0, w, h).data;

  const SHADOW_MAX = 35;
  const GLARE_MIN = 235;

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;
  let rawRSum = 0,
    rawGSum = 0,
    rawBSum = 0,
    rawCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rawRSum += r;
    rawGSum += g;
    rawBSum += b;
    rawCount++;

    const br = brightness(r, g, b);
    if (br <= SHADOW_MAX) continue;
    if (br >= GLARE_MIN) continue;

    rSum += r;
    gSum += g;
    bSum += b;
    count++;
  }

  if (rawCount === 0) return { r: 0, g: 0, b: 0 };

  // if too many filtered out, fallback to raw
  if (count < Math.max(5, Math.floor(rawCount * 0.35))) {
    return {
      r: Math.round(rawRSum / rawCount),
      g: Math.round(rawGSum / rawCount),
      b: Math.round(rawBSum / rawCount),
    };
  }

  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

function Slider({ label, value, onChange, channelClass }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 60, textAlign: "right" }}>{value}%</div>
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value || 0), 0, 100))}
            style={{ width: 70 }}
          />
        </div>
      </div>

      <input
        className={`range ${channelClass}`}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ColorPanel({ title, values, setValues, bg }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #ddd",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
      <div
        style={{
          height: 55,
          borderRadius: 8,
          border: "1px solid #bbb",
          background: bg,
        }}
      />

      <Slider
        label="B"
        channelClass="b"
        value={values.b}
        onChange={(v) => setValues((p) => ({ ...p, b: v }))}
      />
      <Slider
        label="R"
        channelClass="r"
        value={values.r}
        onChange={(v) => setValues((p) => ({ ...p, r: v }))}
      />
      <Slider
        label="Y"
        channelClass="y"
        value={values.y}
        onChange={(v) => setValues((p) => ({ ...p, y: v }))}
      />
    </div>
  );
}

export default function App() {
  const pinCanvasRef = useRef(null);
  const canvasRef = useRef(null); // hidden original-resolution canvas
  const imgRef = useRef(null); // displayed image

  const [sampleRadius, setSampleRadius] = useState(4); // 9x9 default
  const [imgUrl, setImgUrl] = useState(null);

  const [activeBox, setActiveBox] = useState("target"); // target | current
  const [pickEnabled, setPickEnabled] = useState(false);

  const [hover, setHover] = useState({
    show: false,
    x: 0,
    y: 0,
    imgX: 0,
    imgY: 0,
  });

  // BRY values (numbers)
  const [target, setTarget] = useState({ b: 0, r: 0, y: 0 });
  const [current, setCurrent] = useState({ b: 0, r: 0, y: 0 });

  // Exact RGB preview (Android-accurate preview)
  const [targetRGB, setTargetRGB] = useState({ r: 255, g: 255, b: 255 });
  const [currentRGB, setCurrentRGB] = useState({ r: 255, g: 255, b: 255 });

  const needed = useMemo(
    () => ({
      b: Math.round(target.b - current.b),
      r: Math.round(target.r - current.r),
      y: Math.round(target.y - current.y),
    }),
    [target, current]
  );

  // ✅ Preview uses exact picked RGB (matches Android)
  const targetBg = useMemo(
    () => `rgb(${targetRGB.r}, ${targetRGB.g}, ${targetRGB.b})`,
    [targetRGB]
  );
  const currentBg = useMemo(
    () => `rgb(${currentRGB.r}, ${currentRGB.g}, ${currentRGB.b})`,
    [currentRGB]
  );

  // Needed preview: we cannot be 100% "real dye mix" without your dye model,
  // but we can at least show a consistent visual by clamping BRY diff into 0..100 and converting to a simple RGB visualization.
  // (If you want, we can change this to show "difference bars only" instead of a color.)
  const neededBg = useMemo(() => {
    const bb = clamp(needed.b, 0, 100);
    const rr = clamp(needed.r, 0, 100);
    const yy = clamp(needed.y, 0, 100);
    // simple visualization: map BRY to RGB-ish (not a physical dye mix)
    const R = Math.round((rr / 100) * 255);
    const G = Math.round((yy / 100) * 255);
    const B = Math.round((bb / 100) * 255);
    return `rgb(${R}, ${G}, ${B})`;
  }, [needed]);

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

  // Draw the Android-style pin zoom preview in the small circle
  useEffect(() => {
    if (!hover.show) return;
    if (!imgUrl) return;

    const pinCanvas = pinCanvasRef.current;
    const srcCanvas = canvasRef.current;
    if (!pinCanvas || !srcCanvas) return;

    const ctx = pinCanvas.getContext("2d");
    const size = 80;
    const zoom = 7;

    pinCanvas.width = size;
    pinCanvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();

    const sx = hover.imgX - size / (2 * zoom);
    const sy = hover.imgY - size / (2 * zoom);
    const sw = size / zoom;
    const sh = size / zoom;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, size, size);

    ctx.restore();

    // ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // center dot (true sample point)
    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [hover, imgUrl]);

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    // reset pick mode and hover when uploading new image
    setPickEnabled(false);
    setHover((h) => ({ ...h, show: false }));
  }

  // ✅ Toggle ON/OFF
  function onPickModeToggle() {
    if (!imgUrl) return alert("Upload an image first.");
    setPickEnabled((p) => !p);
    setHover((h) => ({ ...h, show: false }));
  }

  function mapClientToImageXY(e) {
    const srcCanvas = canvasRef.current;
    const imgEl = imgRef.current;
    if (!srcCanvas || !imgEl) return null;

    const rect = imgEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const imgX = (clickX / rect.width) * srcCanvas.width;
    const imgY = (clickY / rect.height) * srcCanvas.height;

    return { clickX, clickY, imgX, imgY };
  }

  function onImageMouseMove(e) {
    if (!imgUrl) return;
    if (!pickEnabled) return;

    const mapped = mapClientToImageXY(e);
    if (!mapped) return;

    setHover({
      show: true,
      x: mapped.clickX,
      y: mapped.clickY,
      imgX: mapped.imgX,
      imgY: mapped.imgY,
    });
  }

  function onImageMouseLeave() {
    setHover((p) => ({ ...p, show: false }));
  }

  function onImageClick(e) {
    if (!imgUrl) return;
    if (!pickEnabled) return;

    const mapped = mapClientToImageXY(e);
    if (!mapped) return;

    const srcCanvas = canvasRef.current;
    const ctx = srcCanvas.getContext("2d", { willReadFrequently: true });

    // Exact RGB from image (with filtering)
    const rgb = sampleAverageFiltered(ctx, mapped.imgX, mapped.imgY, sampleRadius);

    // Convert to BRY numbers
    const ryb = rgbToRyb255(rgb.r, rgb.g, rgb.b);
    const bry = ryb255ToBry100(ryb);

    if (activeBox === "target") {
      setTarget(bry);
      setTargetRGB(rgb); // ✅ exact preview
    } else {
      setCurrent(bry);
      setCurrentRGB(rgb); // ✅ exact preview
    }
  }

  return (
    <div style={{ padding: 18, fontFamily: "Arial", background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>DYEBOLD V-10 (BRY)</h2>
          <div style={{ fontWeight: 700 }}>{pickEnabled ? "Pick Mode: ON" : "Pick Mode: OFF"}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
          <ColorPanel title="TARGET" values={target} setValues={setTarget} bg={targetBg} />
          <ColorPanel title="CURRENT" values={current} setValues={setCurrent} bg={currentBg} />

          <div style={{ background: "#111827", color: "#fff", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 900, letterSpacing: 1 }}>FINAL ANALYSIS</div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>RESULTING COLOR DIFFERENCE</div>

            <div
              style={{
                height: 65,
                borderRadius: 10,
                background: neededBg,
                border: "1px solid rgba(255,255,255,0.2)",
                marginTop: 10,
              }}
            />

            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <div>Blue Difference</div>
                <div style={{ fontWeight: 800 }}>{needed.b}%</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <div>Red Difference</div>
                <div style={{ fontWeight: 800, color: "#ff4d4d" }}>{needed.r}%</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <div>Yellow Difference</div>
                <div style={{ fontWeight: 800, color: "#ffd24d" }}>{needed.y}%</div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                * Average sampling with glare/shadow protection. Negative means Current has more than Target.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14, marginTop: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #ddd" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => setActiveBox("target")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: activeBox === "target" ? "#e5e7eb" : "#fff",
                  fontWeight: 800,
                }}
              >
                Set Target
              </button>

              <button
                onClick={() => setActiveBox("current")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: activeBox === "current" ? "#10b981" : "#fff",
                  color: activeBox === "current" ? "#fff" : "#111",
                  fontWeight: 800,
                }}
              >
                Set Current
              </button>

              <input type="file" accept="image/*" onChange={onUpload} />

              <button
                onClick={onPickModeToggle}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: pickEnabled ? "#10b981" : "#a855f7",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                {pickEnabled ? "Pick Mode: ON" : "Pick Mode: OFF"}
              </button>

              <select
                value={sampleRadius}
                onChange={(e) => setSampleRadius(Number(e.target.value))}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontWeight: 700 }}
              >
                <option value={0}>1×1 (One Pixel)</option>
                <option value={2}>5×5 Average</option>
                <option value={4}>9×9 Average (Recommended)</option>
                <option value={7}>15×15 Average</option>
              </select>
            </div>

            <div style={{ marginTop: 12, color: "#444", fontWeight: 700 }}>
              Active Box: <span style={{ textTransform: "uppercase" }}>{activeBox}</span>
            </div>
            <div style={{ marginTop: 6, color: "#666" }}>
              Toggle <b>Pick Mode</b>, then click the image. The pin circle shows the exact sample point.
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #ddd" }}>
            {!imgUrl ? (
              <div
                style={{
                  height: 420,
                  borderRadius: 14,
                  border: "2px dashed #bbb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#777",
                }}
              >
                Upload an image to preview here.
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <img
                  ref={imgRef}
                  alt="uploaded"
                  onClick={onImageClick}
                  onMouseMove={onImageMouseMove}
                  onMouseLeave={onImageMouseLeave}
                  style={{
                    width: "100%",
                    height: 420,
                    objectFit: "contain",
                    borderRadius: 14,
                    border: "1px solid #bbb",
                    cursor: pickEnabled ? "crosshair" : "default",
                    display: "block",
                  }}
                />

                {/* Android-style hover pin with zoomed circular preview */}
                {hover.show && pickEnabled && (
                  <div className="pickerPin" style={{ left: hover.x, top: hover.y }}>
                    <div className="pickerPinTop">
                      <canvas ref={pinCanvasRef} style={{ width: 80, height: 80, borderRadius: "50%" }} />
                      <div
                        className="pickerCrosshair"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
                      />
                    </div>
                    <div className="pickerDot" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas used for true pixel sampling */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
