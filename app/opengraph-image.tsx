import { ImageResponse } from "next/og";

// Prerender this image to a static file at build time (required for output: export).
export const dynamic = "force-static";

export const alt = "Chauncey Tse — AI Automation for Local Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4eee2",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#5c5446",
            letterSpacing: 2,
          }}
        >
          <span style={{ color: "#221d16", fontWeight: 700 }}>Chauncey Tse</span>
          <span>WEST LOS ANGELES</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 84, height: 6, background: "#bd5a36", marginBottom: 32 }} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0 18px",
              fontSize: 70,
              lineHeight: 1.1,
              fontWeight: 700,
              color: "#221d16",
              maxWidth: 1000,
            }}
          >
            <span>Your team is doing work that</span>
            <span style={{ color: "#bd5a36", fontStyle: "italic" }}>
              AI should be doing.
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#5c5446", marginTop: 30, maxWidth: 860 }}>
            I automate the busywork for local practices and firms — intake, scheduling,
            follow-ups, and reporting.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#5c5446" }}>
          Fixed prices · Book a free intro call
        </div>
      </div>
    ),
    { ...size },
  );
}
