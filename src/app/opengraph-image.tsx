import { ImageResponse } from "next/og";
export const alt = "Metr — AI search and sizing for fashion stores.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#151514",
        color: "#f2f1ec",
        width: "100%",
        height: "100%",
        padding: 70,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#d4a853",
        }}
      >
        <span>metr</span>
        <span>Early access</span>
      </div>
      <div
        style={{
          fontSize: 88,
          letterSpacing: -3,
          lineHeight: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>AI search and sizing</span>
        <span>for fashion stores.</span>
      </div>
      <div style={{ fontSize: 28 }}>
        Help customers find what to buy and in which size.
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
        {Array.from({ length: 61 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 1,
              marginRight: 16.6,
              height: i % 10 === 0 ? 40 : i % 5 === 0 ? 24 : 12,
              background: i === 30 ? "#d4a853" : "#6e6d66",
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
