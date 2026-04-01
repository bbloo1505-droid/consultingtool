import type { LayerScreeningResult } from "@/types/screening";

export type OffsetResultGroup =
  | "Fatal Flaws"
  | "Statutory Constraints"
  | "Offset Suitability Tests"
  | "Legal Security / Land Availability"
  | "Delivery Risk / Practical Constraints"
  | "Information Only";

export type Severity = "fatal" | "risk" | "positive" | "info";

export type GroupedLayer = {
  layer: LayerScreeningResult;
  group: OffsetResultGroup;
  severity: Severity;
  whyItMatters: string;
  followUp: string;
};

function isHit(l: LayerScreeningResult) {
  return l.featureCount > 0 && !l.error;
}

export function groupOffsetLayers(layers: LayerScreeningResult[]): GroupedLayer[] {
  return layers.map((l) => {
    const hit = isHit(l);
    const gk = l.glossaryKey ?? "";

    // Defaults
    let group: OffsetResultGroup = "Information Only";
    let severity: Severity = hit ? "risk" : "info";
    let whyItMatters = "Contextual spatial layer for desktop screening.";
    let followUp = "Verify in authoritative mapping and apply professional judgement.";

    // Fatal flaws: already secured offsets (deal-breaker for an offset site).
    if (gk.includes("mses-offset-register") || gk.includes("mses-offset-vegetation")) {
      group = "Fatal Flaws";
      severity = hit ? "fatal" : "info";
      whyItMatters = "Overlap with a legally secured offset area may prevent the site being available or eligible for a new offset obligation.";
      followUp = "Confirm against the latest offset register and legal instrument boundaries; seek legal advice if required.";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    // Legal security signals (not always fatal, but high priority).
    if (
      gk.includes("mses-nature-refuges") ||
      gk.includes("mses-protected-estates") ||
      gk.includes("mses-special-wildlife-reserves") ||
      gk.includes("mses-marine-park") ||
      gk.includes("qld-tenure") ||
      gk.includes("qld-cadastre")
    ) {
      group = "Legal Security / Land Availability";
      severity = hit ? "risk" : "info";
      whyItMatters = "Protected tenure or conservation estate status can constrain legal security options or introduce incompatible management obligations.";
      followUp =
        gk.includes("qld-tenure") || gk.includes("qld-cadastre")
          ? "Confirm lot/plan, tenure, and any title interests via authoritative cadastral/tenure sources and legal due diligence."
          : "Confirm tenure, reserve class, and legal security pathway with DES/DAF and project legal team.";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    // Mining/resources: availability + delivery risk.
    if (gk.includes("qld-mineral-tenement") || gk.includes("mineral-tenement") || gk.includes("mining")) {
      group = "Legal Security / Land Availability";
      severity = hit ? "risk" : "info";
      whyItMatters =
        "Mining and resources tenure can introduce access restrictions, competing rights, rehabilitation obligations, or delivery risks for long-term offset management.";
      followUp = "Confirm current tenure status, conditions, exclusions and overlapping authorities with authoritative tenure registers and specialist advice.";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    // Statutory constraints: core MSES triggers, regulated vegetation, wetlands etc.
    if (l.tier === "hard" || l.tier === "trigger") {
      group = "Statutory Constraints";
      severity = hit ? "risk" : "info";
      whyItMatters = "May indicate statutory constraints, approval triggers, or mapped environmental values relevant to an offset site.";
      followUp = "Spot-check in Queensland Globe; confirm the applicable statutory test and mapping currency.";
    }

    // State planning declared areas (desktop indicator; not a full planning scheme overlay).
    if (gk.includes("qld-sda") || gk.includes("qld-pda") || l.domain === 14) {
      group = "Statutory Constraints";
      severity = hit ? "risk" : "info";
      whyItMatters =
        "State-declared planning areas can introduce additional approval pathways, land use expectations, and delivery constraints relevant to long-term offset management.";
      followUp = "Confirm planning context and applicable requirements in the relevant state planning instruments and local planning scheme mapping.";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    // Suitability indicators (positive): habitat/veg/wetland presence can support suitability.
    if (
      hit &&
      (gk.includes("regveg") ||
        gk.includes("essential-habitat") ||
        gk.includes("hev-wetland") ||
        gk.includes("hes-wetlands") ||
        gk.includes("wildlife"))
    ) {
      group = "Offset Suitability Tests";
      severity = "positive";
      whyItMatters = "Indicates mapped biodiversity values that may support the site’s capacity to deliver the required offset matter (subject to policy tests).";
      followUp = "Undertake ecological verification and align with the impacted matter’s offset policy tests (bioregion/subregion/RE/habitat type).";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    // Delivery risk: hazard/context layers (flood/fire).
    if (l.domain === 11 || l.domain === 8 || gk.includes("flood") || gk.includes("fire")) {
      group = "Delivery Risk / Practical Constraints";
      severity = hit ? "risk" : "info";
      whyItMatters = "Hazards and land condition constraints can affect restoration feasibility, long-term management, and delivery confidence.";
      followUp = "Review hazard mapping at appropriate scale; consider engineering/land management advice for feasibility.";
      return { layer: l, group, severity, whyItMatters, followUp };
    }

    return { layer: l, group, severity, whyItMatters, followUp };
  });
}

