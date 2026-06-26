import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          borderRadius: 40,
          border: "4px solid #e879a8",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: -2,
            color: "#f06aad",
            lineHeight: 1,
          }}
        >
          GTA
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          6
        </div>
      </div>
    ),
    { ...size },
  );
}
