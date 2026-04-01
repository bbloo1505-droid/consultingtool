import type { OffsetMatterType } from "@/types/screening";
import type { GroupedLayer } from "@/lib/offset/groups";

export type SuitabilityRating =
  | "Pass"
  | "Potentially suitable"
  | "Likely conflict"
  | "Manual specialist review required";

export type RuleOutcome = "pass" | "partial" | "fail" | "manual";

export type SuitabilityCheck = {
  id: string;
  label: string;
  outcome: RuleOutcome;
  rationale: string;
};

export type OffsetSuitabilityResult = {
  rating: SuitabilityRating;
  checks: SuitabilityCheck[];
};

function hitCount(grouped: GroupedLayer[], predicate: (g: GroupedLayer) => boolean): number {
  return grouped.filter((g) => predicate(g) && g.layer.featureCount > 0 && !g.layer.error).length;
}

export function evaluateOffsetSuitability(
  grouped: GroupedLayer[],
  matterType: OffsetMatterType,
): OffsetSuitabilityResult {
  const fatal = hitCount(grouped, (g) => g.severity === "fatal");
  const positives = hitCount(grouped, (g) => g.severity === "positive");
  const risks = hitCount(grouped, (g) => g.severity === "risk");

  const hasSecuredOffsets = hitCount(grouped, (g) => g.group === "Fatal Flaws") > 0;

  const checks: SuitabilityCheck[] = [];

  checks.push({
    id: "availability",
    label: "Legal availability (no overlap with known secured offsets)",
    outcome: hasSecuredOffsets ? "fail" : "manual",
    rationale: hasSecuredOffsets
      ? "One or more legally secured offset layers intersect the AOI."
      : "No secured-offset overlap detected in configured layers. Still requires register and legal confirmation.",
  });

  checks.push({
    id: "statutory",
    label: "Statutory constraints understood and manageable",
    outcome: risks > 0 ? "manual" : "manual",
    rationale:
      risks > 0
        ? "Intersecting statutory/legal/delivery-risk layers were detected; confirm triggers and interpretation."
        : "No intersecting constraint layers were detected. Confirm mapping currency and local overlays manually.",
  });

  checks.push({
    id: "matter_presence",
    label: "Evidence of required matter presence/capability (desktop)",
    outcome: positives > 0 ? "partial" : "manual",
    rationale:
      positives > 0
        ? "Suitability indicator layers intersect the AOI. Field verification and policy alignment still required."
        : "No positive suitability indicators detected from configured layers. This does not demonstrate absence on-ground.",
  });

  checks.push({
    id: "policy_alignment",
    label: `Policy alignment checks for ${matterLabel(matterType)}`,
    outcome: "manual",
    rationale:
      "Bioregion/subregion, RE class, wetland type, species habitat capability, and like-for-like rules require matter-specific assessment and often local datasets.",
  });

  // Rating heuristic (deliberately conservative).
  let rating: SuitabilityRating = "Manual specialist review required";
  if (fatal > 0) rating = "Likely conflict";
  else if (positives > 0 && risks === 0) rating = "Potentially suitable";
  else if (positives > 0) rating = "Potentially suitable";
  else rating = "Manual specialist review required";

  return { rating, checks };
}

export function matterLabel(t: OffsetMatterType): string {
  switch (t) {
    case "regional_ecosystem":
      return "regional ecosystem offsets";
    case "wetland":
      return "wetland offsets";
    case "connectivity":
      return "connectivity offsets";
    case "threatened_species_habitat":
      return "threatened species / habitat offsets";
    case "koala":
      return "koala-related offsets";
    case "protected_area_related":
      return "protected area-related offsets";
    case "manual_review_required":
    default:
      return "manual review required matters";
  }
}

