"use client";

import { useRef, useState } from "react";

export default function Dropzone({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`nm-inset flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center transition ${
        dragging ? "outline-2 outline-offset-[-8px] outline-nm-accent" : ""
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <span className="nm-raised flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          className="h-7 w-7 text-nm-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 7.5 12 3m0 0L7.5 7.5M12 3v13.5"
          />
        </svg>
      </span>
      <div>
        <p className="text-base font-semibold text-nm-text">
          Drop your photo here or click to browse
        </p>
        <p className="mt-1.5 text-sm text-nm-muted">
          JPG, PNG or WEBP — a clear front-facing photo works best
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
