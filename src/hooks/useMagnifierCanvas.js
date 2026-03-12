// PATH: src/hooks/useMagnifierCanvas.js

import { useEffect } from "react";
import { clamp } from "../utils/colorMath";

export default function useMagnifierCanvas({ hover, imgUrl, pinCanvasRef, canvasRef }) {
  useEffect(() => {
    if (!hover.show) return;
    if (!imgUrl) return;

    const pinCanvas = pinCanvasRef.current;
    const srcCanvas = canvasRef.current;
    if (!pinCanvas || !srcCanvas) return;

    const ctx = pinCanvas.getContext("2d");

    // Crisp: size divisible by zoom to avoid fractional sampling blur
    const size = 84;
    const zoom = 7;
    const dpr = window.devicePixelRatio || 1;

    // hiDPI canvas
    pinCanvas.width = Math.round(size * dpr);
    pinCanvas.height = Math.round(size * dpr);
    pinCanvas.style.width = `${size}px`;
    pinCanvas.style.height = `${size}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Snap to true pixel
    const iw = srcCanvas.width;
    const ih = srcCanvas.height;
    const ix = clamp(Math.round(hover.imgX), 0, iw - 1);
    const iy = clamp(Math.round(hover.imgY), 0, ih - 1);

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();

    const sw = Math.floor(size / zoom);
    const sh = Math.floor(size / zoom);
    const sx = clamp(ix - Math.floor(sw / 2), 0, iw - sw);
    const sy = clamp(iy - Math.floor(sh / 2), 0, ih - sh);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, size, size);

    // True 1-pixel center overlay
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    const p = srcCtx.getImageData(ix, iy, 1, 1).data;
    ctx.fillStyle = `rgb(${p[0]}, ${p[1]}, ${p[2]})`;
    ctx.fillRect(size / 2 - 1, size / 2 - 1, 2, 2);

    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [hover, imgUrl, pinCanvasRef, canvasRef]);
}
