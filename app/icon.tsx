import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          borderRadius: 8,
          border: "1.5px solid #e879a8",
          color: "#f06aad",
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: -0.5,
        }}
      >
        VI
      </div>
    ),
    { ...size },
  );
}
