import { NextRequest } from "next/server";
import { parseLga } from "@/lib/lga";
import { runScreeningPipeline } from "@/lib/screening-run";
import type { AoiInput } from "@/types/screening";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const aoi = (body as { aoi?: AoiInput }).aoi;
  if (!aoi || aoi.type !== "Feature") {
    return Response.json({ error: "Expected { aoi: GeoJSON Feature }" }, { status: 400 });
  }

  const lga = parseLga((body as { lga?: string }).lga);

  try {
    const payload = await runScreeningPipeline(aoi, lga);
    return Response.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 400 });
  }
}
