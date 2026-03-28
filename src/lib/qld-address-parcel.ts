import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

const USER_AGENT = "env-screening/0.1 (QLD environmental screening; https://nominatim.org/usage-policy)";

const CADASTRE_QUERY_URL =
  "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/PlanningCadastre/LandParcelPropertyFramework/MapServer/4/query";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: { state?: string; region?: string };
};

function isQueenslandHit(r: NominatimResult): boolean {
  const s = r.address?.state ?? r.address?.region ?? "";
  return s === "Queensland" || s === "QLD";
}

function isPolyFeature(f: Feature): f is Feature<Polygon | MultiPolygon> {
  return f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon";
}

/** Prefer smallest lot_area when several parcels intersect the point (e.g. complex sites). */
function pickParcelFeature(fc: FeatureCollection): Feature<Polygon | MultiPolygon> {
  const polys = fc.features.filter(isPolyFeature);
  if (polys.length === 0) {
    throw new Error("Cadastre returned no parcel polygon.");
  }
  if (polys.length === 1) return polys[0];
  return [...polys].sort((a, b) => {
    const aa = Number(a.properties?.lot_area);
    const bb = Number(b.properties?.lot_area);
    const na = Number.isFinite(aa) ? aa : Number.POSITIVE_INFINITY;
    const nb = Number.isFinite(bb) ? bb : Number.POSITIVE_INFINITY;
    return na - nb;
  })[0];
}

export type AddressParcelResult = {
  feature: Feature<Polygon | MultiPolygon>;
  geocodeDisplayName: string;
  parcelSummary: string;
  lotPlan?: string;
};

export async function resolveQueenslandAddressToParcel(address: string): Promise<AddressParcelResult> {
  const q = address.trim();
  if (q.length < 4) {
    throw new Error("Enter a fuller address (at least a few characters).");
  }
  if (q.length > 400) {
    throw new Error("Address is too long.");
  }

  const nomParams = new URLSearchParams({
    q,
    format: "json",
    limit: "8",
    countrycodes: "au",
    addressdetails: "1",
  });

  const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?${nomParams.toString()}`, {
    cache: "no-store",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!nomRes.ok) {
    throw new Error(`Geocoding service returned ${nomRes.status}. Try again later.`);
  }

  const nomJson = (await nomRes.json()) as NominatimResult[];
  if (!Array.isArray(nomJson) || nomJson.length === 0) {
    throw new Error(
      "No matching address found. Try street number, street, suburb, and QLD (e.g. “12 Queen St, Brisbane QLD”).",
    );
  }

  const qldHit = nomJson.find(isQueenslandHit) ?? null;
  if (!qldHit) {
    throw new Error(
      "No Queensland match in the top results. This tool loads QLD cadastral parcels only—refine the address or use draw/upload.",
    );
  }

  const lon = parseFloat(qldHit.lon);
  const lat = parseFloat(qldHit.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error("Geocoder returned invalid coordinates.");
  }

  const params = new URLSearchParams();
  params.set("f", "geojson");
  params.set("geometryType", "esriGeometryPoint");
  params.set("geometry", JSON.stringify({ x: lon, y: lat }));
  params.set("inSR", "4326");
  params.set("spatialRel", "esriSpatialRelIntersects");
  params.set("outFields", "*");
  params.set("returnGeometry", "true");
  params.set("outSR", "4326");

  const cadRes = await fetch(CADASTRE_QUERY_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: params.toString(),
  });

  const cadText = await cadRes.text();
  if (!cadRes.ok) {
    throw new Error(`Cadastre service error (${cadRes.status}). Try again later.`);
  }

  let cadJson: unknown;
  try {
    cadJson = JSON.parse(cadText);
  } catch {
    throw new Error("Cadastre service returned invalid JSON.");
  }

  if (
    !cadJson ||
    typeof cadJson !== "object" ||
    (cadJson as FeatureCollection).type !== "FeatureCollection" ||
    !Array.isArray((cadJson as FeatureCollection).features)
  ) {
    throw new Error("Unexpected cadastre response shape.");
  }

  const fc = cadJson as FeatureCollection;
  if (fc.features.length === 0) {
    throw new Error(
      "No QLD cadastral parcel contains that point. The geocoder pin may sit on a road or outside lot boundaries—try draw or file upload, or adjust the address.",
    );
  }

  const picked = pickParcelFeature(fc);
  const props = picked.properties as Record<string, unknown> | null | undefined;
  const lot = props?.lot != null ? String(props.lot) : "";
  const plan = props?.plan != null ? String(props.plan) : "";
  const locality = props?.locality != null ? String(props.locality) : "";
  const lotPlan = lot && plan ? `Lot ${lot} on ${plan}` : lot || plan || undefined;
  const parcelSummary = [lotPlan, locality].filter(Boolean).join(", ") || "Queensland cadastral parcel";

  const feature: Feature<Polygon | MultiPolygon> = {
    type: "Feature",
    geometry: picked.geometry,
    properties: {
      source: "qld_dcdb_address",
      geocodeDisplayName: qldHit.display_name,
      ...(lotPlan ? { lotPlan } : {}),
    },
  };

  return {
    feature,
    geocodeDisplayName: qldHit.display_name,
    parcelSummary,
    lotPlan,
  };
}
