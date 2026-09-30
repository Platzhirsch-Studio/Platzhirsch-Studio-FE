import { NextResponse } from "next/server";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";

// Image/file proxy for the new "Produkte New" backend (NEW_API_SERVER) —
// mirrors src/app/api/image/route.js (same pattern for the old SERVER), as
// its own catch-all route rather than a next.config.js rewrite.
//
// A plain rewrites() entry pointing straight at NEW_API_SERVER hangs ~20s
// then 500s on every real file — reproducible even for files the backend
// serves instantly and correctly when fetched directly, so the bug is in
// Next's own external-rewrite proxying, not the backend. A rewrite that
// forwarded into this route via a query string (`?path=/:path*`) also didn't
// interpolate the catch-all segment correctly. A real catch-all route here —
// no rewrite involved at all — sidesteps both issues; params.path already
// gives the exact file path, and fetch() from within a route handler is
// confirmed to work instantly and correctly against this backend.
export async function GET(req, { params }) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const externalUrl = `${NEW_API_SERVER}/${path.join("/")}`;
    const response = await fetch(externalUrl);

    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: response.status });
    }

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Content-Length": response.headers.get("content-length") || "",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("cmx image proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
