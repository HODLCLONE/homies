import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "STMBL — Farcaster discovery";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at top left, rgba(139,228,255,0.2), transparent 28%), radial-gradient(circle at top right, rgba(158,140,255,0.18), transparent 25%), linear-gradient(145deg, #061018 0%, #08121d 45%, #03070d 100%)",
          color: "#edf6ff",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#c1f0ff",
          }}
        >
          <span>STMBL</span>
          <span>HODLHQ</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 0.95, maxWidth: 920 }}>
            Find your next corner of Farcaster.
          </div>
          <div style={{ fontSize: 34, color: "rgba(237,246,255,0.76)", maxWidth: 860, lineHeight: 1.3 }}>
            A fast way to find people, casts, and niche pockets worth opening when the feed gets noisy.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 24,
            color: "rgba(193,240,255,0.86)",
          }}
        >
          <span>people</span>
          <span>•</span>
          <span>casts</span>
          <span>•</span>
          <span>deep cuts</span>
        </div>
      </div>
    ),
    size,
  );
}
