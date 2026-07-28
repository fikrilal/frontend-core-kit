import { ImageResponse } from "next/og";

import { siteDescription, siteName } from "@/app/site-metadata";

export const alt = `${siteName} — ${siteDescription}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#111111",
        color: "#fafafa",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "1px solid #333333",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          padding: "72px 88px",
          width: 960,
        }}
      >
        <span style={{ color: "#f08a4b", fontSize: 28, letterSpacing: 2 }}>
          LOCAL-FIRST DESKTOP UTILITY
        </span>
        <strong style={{ fontSize: 112, letterSpacing: -5 }}>{siteName}</strong>
        <span style={{ color: "#b4b4b4", fontSize: 42 }}>
          AI coding-tool usage, visible from your tray.
        </span>
      </div>
    </div>,
    size,
  );
}
