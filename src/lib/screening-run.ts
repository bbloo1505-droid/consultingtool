import { getCatalogForLga } from "@/lib/catalog";
import { getCatalogFingerprint } from "@/lib/catalog-version";
import appPackage from "../../package.json";
import { bboxWgs84FromRings, featureToEsriPolygon } from "@/lib/esri-geometry";
import { centroidFromRingsWgs84 } from "@/lib/centroid";
import { queryMapServerLayer } from "@/lib/arcgis-query";
import { REGISTER_HINTS } from "@/lib/register-hints";
import {
  BIOMAPS_STORY_URL,
  CADASTRE_NOTE,
  CONSULTANT_WORKFLOW_SUMMARY,
  QLD_PLANNING_REGULATION_PDF,
  openStreetMapSiteUrl,
  pmstMapUrlAt,
} from "@/lib/cadastre-links";
import type { AoiInput, LayerScreeningResult, LgaId, ScreenResponse } from "@/types/screening";

export async function queryLayerResults(
  lga: LgaId,
  esri: import("@/lib/esri-geometry").EsriPolygon,
): Promise<LayerScreeningResult[]> {
  const catalog = getCatalogForLga(lga);
  const layerPromises = catalog.map(async (layer): Promise<LayerScreeningResult> => {
    try {
      const data = await queryMapServerLayer({
        baseUrl: layer.serviceBaseUrl,
        layerId: layer.layerId,
        esriPolygon: esri,
      });
      const features = data.features ?? [];
      return {
        catalogId: layer.id,
        name: layer.name,
        domain: layer.domain,
        tier: layer.tier,
        glossaryKey: layer.glossaryKey,
        attribution: layer.attribution,
        featureCount: features.length,
        exceededTransferLimit: Boolean(data.exceededTransferLimit),
        features: features.map((f) => ({ attributes: f.attributes })),
      };
    } catch (e) {
      return {
        catalogId: layer.id,
        name: layer.name,
        domain: layer.domain,
        tier: layer.tier,
        glossaryKey: layer.glossaryKey,
        attribution: layer.attribution,
        featureCount: 0,
        exceededTransferLimit: false,
        features: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  return Promise.all(layerPromises);
}

export async function querySingleCatalogLayer(
  lga: LgaId,
  esri: import("@/lib/esri-geometry").EsriPolygon,
  catalogIndex: number,
): Promise<LayerScreeningResult> {
  const catalog = getCatalogForLga(lga);
  const layer = catalog[catalogIndex];
  if (!layer) {
    throw new Error("Invalid layer index.");
  }
  try {
    const data = await queryMapServerLayer({
      baseUrl: layer.serviceBaseUrl,
      layerId: layer.layerId,
      esriPolygon: esri,
    });
    const features = data.features ?? [];
    return {
      catalogId: layer.id,
      name: layer.name,
      domain: layer.domain,
      tier: layer.tier,
      glossaryKey: layer.glossaryKey,
      attribution: layer.attribution,
      featureCount: features.length,
      exceededTransferLimit: Boolean(data.exceededTransferLimit),
      features: features.map((f) => ({ attributes: f.attributes })),
    };
  } catch (e) {
    return {
      catalogId: layer.id,
      name: layer.name,
      domain: layer.domain,
      tier: layer.tier,
      glossaryKey: layer.glossaryKey,
      attribution: layer.attribution,
      featureCount: 0,
      exceededTransferLimit: false,
      features: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function getCatalogLength(lga: LgaId): number {
  return getCatalogForLga(lga).length;
}

export async function buildScreenResponseFromAoi(
  aoi: AoiInput,
  lga: LgaId,
  layers: LayerScreeningResult[],
  normalizeMeta: { swappedLatLng: boolean; fromWebMercator: boolean },
  esri: import("@/lib/esri-geometry").EsriPolygon,
): Promise<ScreenResponse> {
  const bboxWgs84 = bboxWgs84FromRings(esri.rings);
  const [centroidLng, centroidLat] = centroidFromRingsWgs84(esri.rings);
  const generatedAt = new Date().toISOString();
  const catalog = getCatalogForLga(lga);

  return {
    generatedAt,
    layers,
    debug: {
      bboxWgs84,
      swappedLatLng: normalizeMeta.swappedLatLng,
      fromWebMercator: normalizeMeta.fromWebMercator,
    },
    registerHints: REGISTER_HINTS,
    cadastre: {
      centroidLat,
      centroidLng,
      openMapUrl: openStreetMapSiteUrl(centroidLat, centroidLng),
      note: CADASTRE_NOTE,
    },
    consultantWorkflow: {
      pmstMapUrl: pmstMapUrlAt(centroidLat, centroidLng, 14),
      biomapsStoryUrl: BIOMAPS_STORY_URL,
      planningRegulationPdfUrl: QLD_PLANNING_REGULATION_PDF,
      summary: CONSULTANT_WORKFLOW_SUMMARY,
    },
    audit: {
      lga,
      layersQueried: catalog.length,
      generatedAt,
      appVersion: appPackage.version,
      catalogFingerprint: getCatalogFingerprint(),
    },
  };
}

export async function runScreeningPipeline(aoi: AoiInput, lga: LgaId): Promise<ScreenResponse> {
  const out = featureToEsriPolygon(aoi);
  const layers = await queryLayerResults(lga, out.esri);
  return buildScreenResponseFromAoi(aoi, lga, layers, out.meta, out.esri);
}
