import { ImageResponse } from "next/og";
import { site } from "./lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card. Rendered at build time, so it uses plain inline styles
 * rather than the app's CSS — Satori supports only a flexbox subset.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#e6e9ef",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "12px 26px",
            borderRadius: 999,
            background: "#dfe3ea",
            color: "#6d7488",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          Free · No sign-up · Runs in your browser
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 76,
            fontWeight: 800,
            color: "#2b3140",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Passport photo maker
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            color: "#4a6cf7",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          with AI background removal
        </div>

        <div style={{ display: "flex", marginTop: 34, fontSize: 30, color: "#6d7488" }}>
          8 photos · 35 × 45 mm · print-ready 4R sheet with cutting guides
        </div>
      </div>
    ),
    size
  );
}
