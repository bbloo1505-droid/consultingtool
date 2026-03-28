import { buffer as turfBuffer } from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";

/**
 * Expands a polygon AOI by `meters` in WGS84 using geodesic buffer.
 * Returns a new Feature; original is unchanged.
 */
export function bufferAoiMeters(
  feature: Feature<Polygon | MultiPolygon>,
  meters: number,
): Feature<Polygon | MultiPolygon> {
  if (meters <= 0) return feature;
  const out = turfBuffer(feature as Feature<Polygon | MultiPolygon>, meters, {
    units: "meters",
  });
  if (!out?.geometry) {
    throw new Error("Buffer produced no geometry.");
  }
  const g = out.geometry;
  if (g.type !== "Polygon" && g.type !== "MultiPolygon") {
    throw new Error("Buffer produced an unexpected geometry type");
  }
  return {
    type: "Feature",
    geometry: g,
    properties: { ...(feature.properties ?? {}), bufferedMeters: meters },
  };
}
