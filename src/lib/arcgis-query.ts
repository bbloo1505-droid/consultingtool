import type { EsriPolygon } from "./esri-geometry";

const USER_AGENT =
  "Mozilla/5.0 (compatible; EnvScreening/1.0; desktop environmental screening)";

export type ArcgisQueryResult = {
  features?: { attributes: Record<string, unknown> }[];
  exceededTransferLimit?: boolean;
  error?: { message?: string };
};

export async function queryMapServerLayer(opts: {
  baseUrl: string;
  layerId: number;
  esriPolygon: EsriPolygon;
}): Promise<ArcgisQueryResult> {
  const url = `${opts.baseUrl}/${opts.layerId}/query`;
  const params = new URLSearchParams();
  params.set("f", "json");
  params.set("where", "1=1");
  params.set("geometry", JSON.stringify({ rings: opts.esriPolygon.rings }));
  params.set("geometryType", "esriGeometryPolygon");
  params.set("spatialRel", "esriSpatialRelIntersects");
  params.set("inSR", String(opts.esriPolygon.spatialReference.wkid));
  params.set("outSR", "4326");
  params.set("outFields", "*");
  params.set("returnGeometry", "false");
  params.set("resultRecordCount", "500");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ArcGIS HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text) as ArcgisQueryResult;
  if (data.error?.message) {
    throw new Error(data.error.message);
  }
  return data;
}