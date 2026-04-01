import type { Feature, Polygon, MultiPolygon } from "geojson";

export type ConstraintTier = "hard" | "trigger" | "watch";
export type DataMode = "spatial" | "register" | "manual";

export type LgaId = "qld" | "brisbane" | "gold_coast" | "sunshine_coast" | "cairns";

export type CatalogLayer = {
  id: string;
  domain: number;
  tier: ConstraintTier;
  dataMode: DataMode;
  name: string;
  serviceBaseUrl: string;
  layerId: number;
  glossaryKey: string;
  attribution: string;
};

export type ScreeningFeature = { attributes: Record<string, unknown> };

export type LayerScreeningResult = {
  catalogId: string;
  name: string;
  domain: number;
  tier: ConstraintTier;
  glossaryKey: string;
  attribution: string;
  featureCount: number;
  exceededTransferLimit: boolean;
  features: ScreeningFeature[];
  error?: string;
};

export type RegisterHint = {
  id: string;
  title: string;
  description: string;
  url: string;
};

export type CadastreHint = {
  centroidLat: number;
  centroidLng: number;
  openMapUrl: string;
  note: string;
};

/** Deeplinks aligned with typical consultant workflow (MNES via PMST, MSES/Biomaps, planning regulation). */
export type ConsultantWorkflowLinks = {
  pmstMapUrl: string;
  biomapsStoryUrl: string;
  planningRegulationPdfUrl: string;
  summary: string;
};

export type ScreenAudit = {
  lga: LgaId;
  layersQueried: number;
  generatedAt: string;
  /** App semver from package.json at build time */
  appVersion?: string;
  /** Fingerprint of layers.json + LGA overlay packs */
  catalogFingerprint?: string;
};

/** Optional project fields for filing / report cover. */
export type ProjectMetadata = {
  clientName: string;
  jobId: string;
  siteName: string;
  analyst: string;
  /** ISO date YYYY-MM-DD for report cover */
  reportDate: string;
};

/** Wrapped storage shape; `screen` is the API payload. */
export type StoredScreeningSession = {
  screen: ScreenResponse;
  project?: ProjectMetadata;
  bufferMeters?: number;
  /** draw | generic upload | specific format from boundary file parser */
  aoiSource?: "draw" | "upload" | "geojson" | "kml" | "kmz" | "shapefile" | "address";
  /**
   * Optional client-captured map snapshot (data URL) for report presentation.
   * Stored client-side only; not part of the API payload.
   */
  mapSnapshotDataUrl?: string;
};

export type ScreenResponse = {
  generatedAt: string;
  layers: LayerScreeningResult[];
  debug?: {
    bboxWgs84: [number, number, number, number];
    swappedLatLng: boolean;
    fromWebMercator: boolean;
  };
  registerHints?: RegisterHint[];
  cadastre?: CadastreHint;
  consultantWorkflow?: ConsultantWorkflowLinks;
  audit?: ScreenAudit;
};
export type AoiInput = Feature<Polygon | MultiPolygon>;
