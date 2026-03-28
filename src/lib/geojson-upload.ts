import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

function isPolyFeature(f: Feature): f is Feature<Polygon | MultiPolygon> {
  return f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon";
}

/** Returns first polygon or multipolygon feature from GeoJSON text. */
export function parsePolygonFromGeoJsonText(text: string): Feature<Polygon | MultiPolygon> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid GeoJSON.");
  }
  if ((parsed as Feature).type === "Feature" && isPolyFeature(parsed as Feature)) {
    return parsed as Feature<Polygon | MultiPolygon>;
  }
  if ((parsed as FeatureCollection).type === "FeatureCollection") {
    const fc = parsed as FeatureCollection;
    const hit = fc.features.find((f) => isPolyFeature(f));
    if (!hit) throw new Error("No Polygon or MultiPolygon feature found in FeatureCollection.");
    return hit as Feature<Polygon | MultiPolygon>;
  }
  throw new Error("Expected a GeoJSON Feature (Polygon/MultiPolygon) or FeatureCollection containing one.");
}
