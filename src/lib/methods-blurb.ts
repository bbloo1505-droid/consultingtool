import type { ProjectMetadata, ScreenResponse } from "@/types/screening";

function packDescription(lga: string | undefined): string {
  switch (lga) {
    case "brisbane":
      return "Queensland statewide catalog plus Brisbane / SEQ historical flood overlays (FloodCheck).";
    case "gold_coast":
    case "sunshine_coast":
      return "Queensland statewide catalog plus the same SEQ historical flood overlay layers as the Brisbane pack (verify local council flood products separately).";
    case "cairns":
      return "Queensland statewide catalog (Cairns regional pack has no extra layers configured in this tool).";
    default:
      return "Queensland statewide catalog.";
  }
}

export type MethodsAoiSource = "draw" | "upload" | "geojson" | "kml" | "kmz" | "shapefile" | "address";

export function buildMethodsParagraph(
  data: ScreenResponse,
  opts: {
    bufferMeters: number;
    aoiSource: MethodsAoiSource;
    project?: ProjectMetadata;
  },
): string {
  const pack = packDescription(data.audit?.lga);
  const aoi =
    opts.aoiSource === "draw"
      ? "The area of interest was digitised as a polygon in the web map"
      : opts.aoiSource === "address"
        ? "The area of interest was derived as the Queensland cadastral parcel polygon returned for the searched address (OpenStreetMap geocode to a point, then DCDB parcel intersect via Queensland Government spatial services—not a substitute for surveyed title boundaries)"
        : opts.aoiSource === "geojson" || opts.aoiSource === "upload"
          ? "The area of interest was supplied as a GeoJSON polygon uploaded by the user"
          : opts.aoiSource === "kml" || opts.aoiSource === "kmz"
            ? "The area of interest was supplied from a KML or KMZ file uploaded by the user"
            : "The area of interest was supplied from a shapefile (.zip) uploaded by the user";
  const buf =
    opts.bufferMeters > 0
      ? ` A buffer of ${opts.bufferMeters} m was applied to that polygon before querying (geodesic buffer, WGS84).`
      : "";
  const proj = opts.project?.siteName
    ? ` Site reference: ${opts.project.siteName}${opts.project.jobId ? `; job / file: ${opts.project.jobId}` : ""}.`
    : "";
  return (
    `${aoi} and normalised to WGS84 where required.${buf} For each configured map layer, the server issued an Esri REST query with spatial relationship intersects against the AOI polygon. Layer pack: ${pack}${proj} Layers queried: ${data.audit?.layersQueried ?? data.layers.length}. Screening time (ISO): ${data.generatedAt}.`
  );
}
