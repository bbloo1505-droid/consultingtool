import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  GeometryCollection,
  MultiPolygon,
  Polygon,
} from "geojson";

function isPolyFeature(f: Feature): f is Feature<Polygon | MultiPolygon> {
  return f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon";
}

/** Picks the first polygon or multipolygon feature from any GeoJSON root. */
export function extractFirstPolygonFeature(gj: GeoJSON): Feature<Polygon | MultiPolygon> {
  if (!gj || typeof gj !== "object") {
    throw new Error("Invalid GeoJSON.");
  }
  if (gj.type === "Feature" && isPolyFeature(gj)) {
    return gj;
  }
  if (gj.type === "FeatureCollection") {
    const fc = gj as FeatureCollection;
    const hit = fc.features.find((f) => isPolyFeature(f));
    if (!hit) throw new Error("No Polygon or MultiPolygon found in FeatureCollection.");
    return hit as Feature<Polygon | MultiPolygon>;
  }
  if (gj.type === "GeometryCollection") {
    const gc = gj as GeometryCollection;
    for (const geom of gc.geometries) {
      if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
        return { type: "Feature", properties: {}, geometry: geom };
      }
    }
    throw new Error("GeometryCollection has no polygon geometry.");
  }
  throw new Error("Unsupported GeoJSON type for AOI; need a polygon or feature collection with one.");
}
