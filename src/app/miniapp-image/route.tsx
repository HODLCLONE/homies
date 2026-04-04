import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(139,228,255,0.22), transparent 26%), radial-gradient(circle at top right, rgba(158,140,255,0.18), transparent 24%), linear-gradient(145deg, #061018 0%, #08121d 45%, #03070d 100%)",
          color: "#edf6ff",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 72,
            fontSize: 28,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#c1f0ff",
          }}
        >
          STMBL
        </div>
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(193,240,255,0.16)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 28px 120px rgba(0,0,0,0.35)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              fontSize: 184,
              fontWeight: 700,
              letterSpacing: -8,
              lineHeight: 1,
            }}
          >
            ST
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
    },
  );
}
