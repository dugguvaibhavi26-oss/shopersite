import { ImageResponse } from "next/og";

/**
 * The social preview image (1200×630) used by marketing pages: /og?title=…&kicker=…
 * Black and white, brand mark, the page's own title. Cached at the edge.
 */
export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Free online store builder for Indian sellers").slice(0, 110);
  const kicker = (searchParams.get("kicker") || "Shopersite").slice(0, 40);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0a0a0a", color: "#fff", padding: "72px 80px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff", color: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800 }}>S</div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>Shopersite</div>
          <div style={{ marginLeft: "auto", fontSize: 22, color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "8px 20px" }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", fontSize: title.length > 60 ? 62 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", gap: 28, fontSize: 26, color: "rgba(255,255,255,0.7)" }}>
          <span>Free plan available</span>
          <span>No credit card needed</span>
          <span>shopersite.in</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } }
  );
}
