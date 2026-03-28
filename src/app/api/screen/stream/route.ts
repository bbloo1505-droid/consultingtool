import { NextRequest } from "next/server";
import { parseLga } from "@/lib/lga";
import { featureToEsriPolygon } from "@/lib/esri-geometry";
import {
  buildScreenResponseFromAoi,
  getCatalogLength,
  querySingleCatalogLayer,
} from "@/lib/screening-run";
import type { AoiInput, LayerScreeningResult } from "@/types/screening";

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

  let esri;
  let normalizeMeta;
  try {
    const out = featureToEsriPolygon(aoi);
    esri = out.esri;
    normalizeMeta = out.meta;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 400 });
  }

  const totalLayers = getCatalogLength(lga);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const layers: LayerScreeningResult[] = [];
      try {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "start",
              totalLayers,
              generatedAt: new Date().toISOString(),
            }) + "\n",
          ),
        );
        for (let i = 0; i < totalLayers; i++) {
          const layer = await querySingleCatalogLayer(lga, esri, i);
          layers.push(layer);
          controller.enqueue(encoder.encode(JSON.stringify({ type: "layer", index: i, layer }) + "\n"));
        }
        const screen = await buildScreenResponseFromAoi(aoi, lga, layers, normalizeMeta, esri);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "complete", screen }) + "\n"));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
