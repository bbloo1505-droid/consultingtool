import type { Feature, Polygon, MultiPolygon } from "geojson";

export type EsriPolygon = {
  rings: number[][][];
  spatialReference: { wkid: number };
};

export type GeometryNormalizeMeta = {
  swappedLatLng: boolean;
  fromWebMercator: boolean;
};

const WEB_MERCATOR_THRESHOLD = 1000;

function mercatorToLngLat(x: number, y: number): [number, number] {
  const lon = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.sinh((y * Math.PI) / 20037508.34)) * 180) / Math.PI;
  return [lon, lat];
}

function looksLikeSwappedLngLat(lng: number, lat: number): boolean {
  return lng >= -45 && lng <= 10 && lat >= 100 && lat <= 160;
}

function normalizeRing(ring: number[][]): { ring: number[][]; swapped: boolean; mercator: boolean } {
  const [x0, y0] = ring[0];
  if (Math.abs(x0) > WEB_MERCATOR_THRESHOLD || Math.abs(y0) > WEB_MERCATOR_THRESHOLD) {
    return {
      ring: ring.map(([x, y]) => mercatorToLngLat(x, y)),
      swapped: false,
      mercator: true,
    };
  }

  let swapped = false;
  const out = ring.map(([lng, lat]) => {
    if (looksLikeSwappedLngLat(lng, lat)) {
      swapped = true;
      return [lat, lng];
    }
    return [lng, lat];
  });
  return { ring: out, swapped, mercator: false };
}

function normalizeRings(rings: number[][][]): { rings: number[][][]; meta: GeometryNormalizeMeta } {
  let swappedLatLng = false;
  let fromWebMercator = false;
  const out: number[][][] = [];
  for (const ring of rings) {
    const { ring: nr, swapped, mercator } = normalizeRing(ring);
    if (swapped) swappedLatLng = true;
    if (mercator) fromWebMercator = true;
    out.push(nr);
  }
  return { rings: out, meta: { swappedLatLng, fromWebMercator } };
}

export function bboxWgs84FromRings(rings: number[][][]): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function featureToEsriPolygon(
  feature: Feature<Polygon | MultiPolygon>,
): { esri: EsriPolygon; meta: GeometryNormalizeMeta } {
  const g = feature.geometry;
  if (!g) throw new Error("AOI has no geometry");
  if (g.type === "Polygon") {
    const { rings, meta } = normalizeRings(g.coordinates as number[][][]);
    return {
      esri: { rings, spatialReference: { wkid: 4326 } },
      meta,
    };
  }
  if (g.type === "MultiPolygon") {
    if (g.coordinates.length === 0) throw new Error("Empty MultiPolygon");
    const { rings, meta } = normalizeRings(g.coordinates[0] as number[][][]);
    return {
      esri: { rings, spatialReference: { wkid: 4326 } },
      meta,
    };
  }
  throw new Error("AOI must be Polygon or MultiPolygon");
}
