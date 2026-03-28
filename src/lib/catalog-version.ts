import base from "@/data/layers.json";
import lgaOverlays from "@/data/lga-overlays.json";
import type { CatalogLayer } from "@/types/screening";

/** Stable string for audit trail when layers.json / overlays change. */
export function getCatalogFingerprint(): string {
  const packs = lgaOverlays as Record<string, CatalogLayer[]>;
  const br = packs.brisbane?.length ?? 0;
  const cairns = packs.cairns?.length ?? 0;
  return `base:${(base as CatalogLayer[]).length};brisbane:${br};cairns:${cairns}`;
}
