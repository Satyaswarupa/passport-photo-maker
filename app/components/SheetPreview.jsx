"use client";

import { useEffect } from "react";
import { renderSheet } from "../lib/render";

export default function SheetPreview({
  canvasRef,
  bitmap,
  paper,
  photo,
  dpi,
  transform,
  bgColor,
  copies,
  showCutLines,
  onLayout,
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const { layout, placed } = renderSheet({
      canvas,
      bitmap,
      paper,
      photo,
      dpi,
      transform,
      bgColor,
      copies,
      showCutLines,
    });
    onLayout?.({ ...layout, placed });
  }, [canvasRef, bitmap, paper, photo, dpi, transform, bgColor, copies, showCutLines, onLayout]);

  return (
    <div className="nm-inset rounded-2xl p-4">
      <div className="nm-checker overflow-hidden rounded-lg">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>
    </div>
  );
}
