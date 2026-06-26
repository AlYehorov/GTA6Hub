import { NextResponse } from "next/server";

const TILE_ORIGIN = "https://map.stateofleonida.net";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const tilePath = path.join("/");
  const upstream = `${TILE_ORIGIN}/tiles/${tilePath}`;

  try {
    const response = await fetch(upstream, {
      headers: { Referer: `${TILE_ORIGIN}/` },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const bytes = await response.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
