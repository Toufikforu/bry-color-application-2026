// PATH: src/components/ImagePickerStage.jsx

import React, { useEffect, useRef, useState } from "react";
import MagnifierPin from "./MagnifierPin";

export default function ImagePickerStage({
  imgUrl,
  imgRef,
  hover,
  pickEnabled,
  onImageClick,
  onImageMouseMove,
  onImageMouseLeave,
  pinCanvasRef,
  zoom = 1,
}) {
  const VIEW_H = 420;

  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [startDist, setStartDist] = useState(null);

  /* ================================
     Reset mobile zoom when image changes
  ================================= */
  useEffect(() => {
    setScale(1);
    setStartDist(null);
  }, [imgUrl]);

  /* ================================
     NEW: instantly stop picker hover
     when picker is turned OFF
  ================================= */
  useEffect(() => {
    if (!pickEnabled) {
      setStartDist(null);
      onImageMouseLeave?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickEnabled]);

  const distance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      setStartDist(distance(e.touches[0], e.touches[1]));
      return;
    }

    if (pickEnabled && e.touches.length === 1) {
      onImageMouseMove?.(e);
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && startDist) {
      const newDist = distance(e.touches[0], e.touches[1]);
      const ratio = newDist / startDist;
      const next = Math.max(1, Math.min(6, scale * ratio));
      setScale(next);
      setStartDist(newDist);
      return;
    }

    if (!pickEnabled) return;

    if (e.touches.length === 1) {
      onImageMouseMove?.(e);
    }
  };

  const onTouchEnd = () => {
    setStartDist(null);

    if (pickEnabled) {
      onImageMouseLeave?.();
    }
  };

  /* ================================
     Pointer Events
  ================================= */
  const onPointerDown = (e) => {
    if (!pickEnabled) return;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    onImageMouseMove?.(e);
  };

  const onPointerMove = (e) => {
    if (!pickEnabled) return;
    onImageMouseMove?.(e);
  };

  const onPointerUp = (e) => {
    if (!pickEnabled) return;

    onImageClick?.(e);
    onImageMouseLeave?.();
  };

  /* ================================
     Final Zoom
  ================================= */
  const finalZoom = zoom * scale;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        border: "1px solid #ddd",
      }}
    >
      {!imgUrl ? (
        <div
          style={{
            height: VIEW_H,
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
        <div
          ref={wrapRef}
          style={{
            position: "relative",
            height: VIEW_H,
            borderRadius: 14,
            border: "1px solid #bbb",
            overflow: "auto",
            background: "#fff",
            touchAction: pickEnabled ? "none" : "pan-x pan-y",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              width: `${Math.round(finalZoom * 100)}%`,
              height: Math.round(VIEW_H * finalZoom),
              position: "relative",
            }}
          >
            <img
              ref={imgRef}
              src={imgUrl}
              alt="uploaded"
              onClick={onImageClick}
              onMouseMove={onImageMouseMove}
              onMouseLeave={onImageMouseLeave}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: 14,
                cursor: pickEnabled ? "default" : "grab",
                display: "block",
              }}
            />
          </div>

          {hover.show && pickEnabled && (
            <MagnifierPin hover={hover} pinCanvasRef={pinCanvasRef} />
          )}
        </div>
      )}
    </div>
  );
}
