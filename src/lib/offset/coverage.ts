import type { CatalogLayer } from "@/types/screening";

export type OffsetCoverageFamily =
  | "Commonwealth / EPBC (PMST workflow)"
  | "Queensland MSES / biodiversity"
  | "Regulated vegetation / RE / habitat"
  | "Wetlands / waterways / fish habitat"
  | "Protected areas / reserves / tenure proxies"
  | "Legally secured offsets / registers"
  | "State planning declared areas (automated indicators)"
  | "Local planning overlays (manual)"
  | "Hazards / delivery risks"
  | "Cadastre / tenure (automated indicators)"
  | "Encumbrances / easements / covenants (manual)"
  | "Mining / resources tenure (automated indicators)";

export type CoverageAudit = {
  enabled: OffsetCoverageFamily[];
  missing: OffsetCoverageFamily[];
  notes: Record<OffsetCoverageFamily, string>;
};

type CatalogLike = Pick<CatalogLayer, "glossaryKey" | "domain">;

function hasLayer(catalog: CatalogLike[], predicate: (l: CatalogLike) => boolean): boolean {
  return catalog.some(predicate);
}

export function auditOffsetCoverage(catalog: CatalogLike[]): CoverageAudit {
  const notes: Record<OffsetCoverageFamily, string> = {
    "Commonwealth / EPBC (PMST workflow)":
      "PMST is not queried by this tool. Use PMST for MNES/EPBC matters and treat map-centre links as indicative.",
    "Queensland MSES / biodiversity":
      "Core MSES families (protected areas, wetlands, wildlife habitat) are included via the configured DES services.",
    "Regulated vegetation / RE / habitat":
      "Regulated vegetation and essential habitat layers are included where configured. RE class matching may still require specialist interpretation and field validation.",
    "Wetlands / waterways / fish habitat":
      "HEV waters, wetlands, fish habitat areas and related triggers are included where configured.",
    "Protected areas / reserves / tenure proxies":
      "Protected estates and nature refuges provide partial tenure/security signals, but do not replace authoritative tenure, easements, or property searches.",
    "Legally secured offsets / registers":
      "Legally secured offset layers are included (offset register / vegetation offsets). Always confirm with the latest register and legal instruments.",
    "State planning declared areas (automated indicators)":
      "State-declared planning areas (e.g. SDAs/PDAs) are included as desktop indicators. They do not replace local planning scheme overlays or Council mapping.",
    "Local planning overlays (manual)":
      "Council-specific overlays (MLES/local biodiversity overlays/precincts/flood overlays) are not comprehensively automated and require manual checks in the relevant planning scheme mapping.",
    "Hazards / delivery risks":
      "Some hazard/context layers are included (e.g. historical flood overlays for SEQ packs, fire scar). Site-specific hazard assessment still requires engineering judgement and local datasets.",
    "Cadastre / tenure (automated indicators)":
      "Cadastre/tenure layers provide useful desktop indicators for availability and management constraints, but do not replace authoritative title/tenure searches or legal due diligence.",
    "Encumbrances / easements / covenants (manual)":
      "Easements/covenants/encumbrances are not automated in this app. Use authoritative title searches, council records, and legal due diligence.",
    "Mining / resources tenure (automated indicators)":
      "Mining/resources tenure mapping provides a desktop indicator of potential conflicts, but must be confirmed against current tenure status, conditions, and exclusions.",
  };

  const families: { id: OffsetCoverageFamily; enabled: boolean }[] = [
    {
      id: "Commonwealth / EPBC (PMST workflow)",
      enabled: true, // workflow links always present in response
    },
    {
      id: "Queensland MSES / biodiversity",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.startsWith("mses-")),
    },
    {
      id: "Regulated vegetation / RE / habitat",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("regveg") || l.glossaryKey.includes("essential-habitat")),
    },
    {
      id: "Wetlands / waterways / fish habitat",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("wetland") || l.glossaryKey.includes("fish-habitat") || l.domain === 7),
    },
    {
      id: "Protected areas / reserves / tenure proxies",
      enabled: hasLayer(catalog, (l) => l.domain === 4 || l.glossaryKey.includes("protected") || l.glossaryKey.includes("refuge")),
    },
    {
      id: "Legally secured offsets / registers",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("offset-register") || l.glossaryKey.includes("offset-vegetation")),
    },
    {
      id: "State planning declared areas (automated indicators)",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("qld-sda") || l.glossaryKey.includes("qld-pda") || l.domain === 14),
    },
    {
      id: "Local planning overlays (manual)",
      enabled: false,
    },
    {
      id: "Hazards / delivery risks",
      enabled: hasLayer(catalog, (l) => l.domain === 8 || l.domain === 11 || l.glossaryKey.includes("fire") || l.glossaryKey.includes("flood")),
    },
    {
      id: "Cadastre / tenure (automated indicators)",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("cadastre") || l.glossaryKey.includes("tenure") || l.domain === 12),
    },
    {
      id: "Mining / resources tenure (automated indicators)",
      enabled: hasLayer(catalog, (l) => l.glossaryKey.includes("mineral-tenement") || l.glossaryKey.includes("mining") || l.domain === 13),
    },
    {
      id: "Encumbrances / easements / covenants (manual)",
      enabled: false,
    },
  ];

  const enabled = families.filter((f) => f.enabled).map((f) => f.id);
  const missing = families.filter((f) => !f.enabled).map((f) => f.id);
  return { enabled, missing, notes };
}

