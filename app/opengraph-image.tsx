import { ImageResponse } from "next/og";

export const alt = "Hoza — We build digital things fast.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        color: "#F5F2FA",
        background: "#08050D",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: "linear-gradient(rgba(200,183,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(200,183,255,.12) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div style={{ position: "absolute", right: "-120px", top: "-160px", width: "620px", height: "620px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,255,.75), rgba(40,16,68,.1) 60%, transparent 72%)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, letterSpacing: "-0.05em" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", border: "9px solid #8B5CFF" }} />
        HOZA
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.88, fontWeight: 800, letterSpacing: "-0.075em" }}>
        <div>WE BUILD</div>
        <div>DIGITAL THINGS.</div>
        <div style={{ color: "#8B5CFF" }}>FAST.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, letterSpacing: ".08em", color: "#C8B7FF" }}>
        <span>FAST FORWARD</span>
        <span>INDONESIA / SINGAPORE / WORLDWIDE</span>
      </div>
    </div>,
    size,
  );
}
