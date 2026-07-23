"use client";

import { useEffect, useMemo, useRef } from "react";
import { drawPhoto } from "../lib/render";

const FRAME_W = 260;

/**
 * Live crop preview. Drag to reposition, use the slider or wheel to zoom.
 * The dashed overlay marks where the head and eye line should sit for an
 * accepted passport photo.
 */
export default function PhotoAdjuster({ bitmap, photo, bgColor, transform, onChange, showGuides }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const frame = useMemo(
    () => ({ w: FRAME_W, h: Math.round((FRAME_W * photo.h) / photo.w) }),
    [photo]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = frame.w * dpr;
    canvas.height = frame.h * dpr;
    canvas.style.width = `${frame.w}px`;
    canvas.style.height = `${frame.h}px`;
    const ctx = canvas.getContext("2d");
    drawPhoto(ctx, bitmap, canvas.width, canvas.height, transform, bgColor);
  }, [bitmap, frame, transform, bgColor]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  };

  const onPointerMove = (e) => {
    const start = dragRef.current;
    if (!start) return;
    onChange({
      ...transform,
      tx: start.tx + (e.clientX - start.x) / frame.w,
      ty: start.ty + (e.clientY - start.y) / frame.h,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const setZoom = (zoom) => onChange({ ...transform, zoom: Math.min(4, Math.max(1, zoom)) });

  return (
    // Column is pinned to the frame width so the zoom row lines up flush with
    // the photo edges instead of spanning the whole panel.
    <div className="mx-auto flex flex-col items-center gap-4" style={{ width: frame.w }}>
      <div
        className="nm-raised relative cursor-grab touch-none select-none overflow-hidden rounded-xl active:cursor-grabbing"
        style={{ width: frame.w, height: frame.h }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={(e) => setZoom(transform.zoom - e.deltaY * 0.001)}
      >
        <canvas ref={canvasRef} className="block" />
        {showGuides && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Head should span roughly 62–75% of the photo height */}
            <rect
              x="27" y="10" width="46" height="72"
              fill="none" stroke="rgba(255,60,60,0.85)" strokeWidth="0.6" strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
            {/* Eye line */}
            <line
              x1="0" y1="38" x2="100" y2="38"
              stroke="rgba(255,60,60,0.7)" strokeWidth="0.5" strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="50" y1="0" x2="50" y2="100"
              stroke="rgba(255,255,255,0.55)" strokeWidth="0.5" strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      <div className="flex w-full items-center gap-3">
        <span className="text-xs font-medium text-nm-muted">Zoom</span>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          aria-label="Zoom"
          value={transform.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="nm-range flex-1"
        />
        <button
          type="button"
          onClick={() => onChange({ zoom: 1, tx: 0, ty: 0 })}
          className="nm-btn rounded-lg px-3 py-1.5 text-xs font-semibold"
        >
          Reset
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-nm-muted">
        Drag the photo to position the face. Keep the head inside the red box with the eyes near the
        line.
      </p>
    </div>
  );
}
