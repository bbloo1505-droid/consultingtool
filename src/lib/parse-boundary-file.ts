import { kml } from "@tmcw/togeojson";
import JSZip from "jszip";
import shp from "shpjs";
import type { Feature, GeoJSON, MultiPolygon, Polygon } from "geojson";
import { extractFirstPolygonFeature } from "@/lib/extract-polygon-feature";
import { parsePolygonFromGeoJsonText } from "@/lib/geojson-upload";

export type BoundaryUploadKind = "geojson" | "kml" | "kmz" | "shapefile";

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function parseKmlText(xml: string): Feature<Polygon | MultiPolygon> {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error("Invalid KML/XML.");
  const gj = kml(doc) as GeoJSON;
  return extractFirstPolygonFeature(gj);
}

/** Parses uploaded site boundary: GeoJSON, KML, KMZ (zipped KML), or Shapefile ZIP. */
export async function parseBoundaryFile(
  file: File,
): Promise<{ feature: Feature<Polygon | MultiPolygon>; kind: BoundaryUploadKind }> {
  const e = ext(file.name);

  if (e === "json" || e === "geojson") {
    const text = await file.text();
    return { feature: parsePolygonFromGeoJsonText(text), kind: "geojson" };
  }

  if (e === "kml") {
    const text = await file.text();
    return { feature: parseKmlText(text), kind: "kml" };
  }

  if (e === "kmz") {
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    const kmlName = names.find((n) => n.toLowerCase().endsWith(".kml") && !zip.files[n].dir);
    if (!kmlName) throw new Error("KMZ archive has no .kml file.");
    const text = await zip.files[kmlName].async("string");
    return { feature: parseKmlText(text), kind: "kmz" };
  }

  if (e === "zip") {
    const buf = await file.arrayBuffer();
    const gj = (await shp(buf)) as GeoJSON;
    return { feature: extractFirstPolygonFeature(gj), kind: "shapefile" };
  }

  throw new Error("Unsupported file type. Use .geojson, .json, .kml, .kmz, or .zip (shapefile).");
}
