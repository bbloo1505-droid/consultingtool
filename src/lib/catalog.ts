import base from "@/data/layers.json";
import lgaOverlays from "@/data/lga-overlays.json";
import type { CatalogLayer } from "@/types/screening";

const BASE = base as CatalogLayer[];

export function getCatalogForLga(lga: string): CatalogLayer[] {
  const packs = lgaOverlays as Record<string, CatalogLayer[]>;
  let extra: CatalogLayer[] = [];
  if (lga === "qld_offset") {
    extra = packs.qld_offset ?? [];
  } else
  if (lga === "brisbane" || lga === "gold_coast" || lga === "sunshine_coast") {
    extra = packs.brisbane ?? [];
  } else if (lga === "cairns") {
    extra = packs.cairns ?? [];
  }
  return [...BASE, ...extra];
}
