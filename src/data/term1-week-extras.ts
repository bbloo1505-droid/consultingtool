import type { WeekLearningExtras } from "@/types/learning";

/** Per-week learning extensions (merged in `getWeekContent`). */
export const TERM1_WEEK_EXTRAS: Record<number, WeekLearningExtras> = {
  1: {
    commonMistakes: [
      "Treating desktop screening as proof of absence of environmental values on the ground.",
      "Writing like a university essay (proving how much you know) instead of a consultant memo (scope, limits, next steps).",
    ],
    elaborationPrompt: `Confuse this with: “I’m a regulator.” Explain why the consultant’s role is not to enforce law, and what a graduate should do instead when a client asks you to “approve” or “guarantee” an outcome. What would a reviewer mark down if you blurred client vs regulator?`,
    applicationChecks: [
      {
        prompt: "In one sentence each, define client, regulator, and consultant; then state who pays you and who can refuse a development.",
        suggestedAnswer:
          "Client: pays for advice. Regulator: administers statutory requirements and can refuse or impose conditions. Consultant: advises the client within scope. You are paid by the client; regulators decide on approvals.",
      },
      {
        prompt: "List four consulting streams from memory and one example deliverable for each.",
        suggestedAnswer:
          "Examples: approvals/planning (referral pathway memo), contaminated land (PSI/DSI), ecology (impact assessment), GIS (spatial constraints map pack).",
      },
      {
        prompt: "Write a cautious limitation sentence you could include after a desktop review paragraph.",
        suggestedAnswer:
          "E.g. “This assessment is preliminary and based on desktop information; field survey and/or legal advice may be required to confirm constraints.”",
      },
    ],
  },
  2: {
    commonMistakes: [
      "Claiming PMST proves species presence or absence on site.",
      "Assuming EPBC and state (MSES) layers are interchangeable—same trigger, same law.",
    ],
    elaborationPrompt: `Confuse “significant impact” with “any ecological change.” Explain why the EPBC test is not colloquial “big”, and what a graduate should do instead of giving a legal conclusion on referral.`,
    applicationChecks: [
      {
        prompt: "What is MNES in plain English, and what does PMST do (and not do)?",
        suggestedAnswer:
          "MNES: matters of national environmental significance under the EPBC Act. PMST: spatial search for listed matters that may occur in an area; not exhaustive field survey and not a legal referral decision.",
      },
      {
        prompt: "Name two limitations you would state when reporting PMST use in a memo appendix.",
        suggestedAnswer:
          "E.g. search boundary/date, database currency, modelled likelihood vs occurrence records, no substitute for field survey where risk warrants.",
      },
      {
        prompt: "In one line, why can both federal (EPBC) and state pathways matter for one project?",
        suggestedAnswer:
          "Different statutes and triggers can apply to the same project; state and Commonwealth layers answer different questions.",
      },
    ],
  },
  3: {
    commonMistakes: [
      "Treating a single PMST point result as proof of population distribution or absence elsewhere.",
      "Ignoring indirect pathways (hydrology, connectivity) because the footprint polygon doesn’t overlap a feature.",
    ],
    elaborationPrompt: `Confuse “database says no species record” with “no species exists.” What would a marker penalise in your limitations paragraph, and what investigation might you recommend?`,
    applicationChecks: [
      {
        prompt: "Define indirect impact and give one environmental example not captured by simple footprint overlap.",
        suggestedAnswer:
          "Impact mediated through pathways (e.g. hydrology, sediment transport). Example: stormwater connectivity affecting downstream wetland condition.",
      },
      {
        prompt: "List four items that belong in a protected-matters desktop memo methods section.",
        suggestedAnswer:
          "Search boundary, date, sources/tools (e.g. PMST), CRS/boundary context, assumptions, and what was not done (e.g. survey).",
      },
      {
        prompt: "Why is ‘survey detection’ relevant to interpreting absence of records?",
        suggestedAnswer:
          "Detection probability depends on effort and method; absence of detection ≠ absence of species.",
      },
    ],
  },
  4: {
    commonMistakes: [
      "Using this app’s environmental layers as a substitute for checking the planning scheme overlay mapping.",
      "Assuming one assessment pathway (e.g. code-only) without checking triggers and scheme categories.",
    ],
    elaborationPrompt: `Confuse “environmental screening” with “the DA is assessable.” What does the Queensland planning system still require you to verify outside this tool, and what language avoids overclaiming?`,
    applicationChecks: [
      {
        prompt: "Name two distinct roles: SARA and local council in a planning sentence each.",
        suggestedAnswer:
          "SARA: state referral/assessment pathways for certain development types. Council: local planning scheme, DA assessment under local rules—verify against current scheme.",
      },
      {
        prompt: "What is one reason a project might need multiple specialist reports?",
        suggestedAnswer:
          "Different triggers and codes (biodiversity, hazard, stormwater, noise, etc.) each require appropriate expertise.",
      },
      {
        prompt: "Write one sentence that states your screening tool is not the planning scheme.",
        suggestedAnswer:
          "E.g. “Results must be cross-checked against the current planning scheme mapping and assessment categories in PD Online.”",
      },
    ],
  },
  5: {
    commonMistakes: [
      "Treating nil intersection as proof of no environmental values—ignoring scale, service limits, and data gaps.",
      "Reporting buffer results without stating buffer distance and why it was applied.",
    ],
    elaborationPrompt: `Confuse “intersects” with “impact is significant” or “approval is required.” How would you phrase each step in a defensible chain?`,
    applicationChecks: [
      {
        prompt: "Why is ‘false negative’ possible in GIS screening, and what QA might you do?",
        suggestedAnswer:
          "Geometry, scale, incomplete attributes, or service caps. QA: Globe spot-check, metadata, alternative boundary, or confirm cadastre title.",
      },
      {
        prompt: "In two bullets, compare 0 m vs 50 m buffer purpose for a constraints map.",
        suggestedAnswer:
          "0 m: footprint overlap. 50 m: proximity/edge sensitivity for discussion—not proof of impact magnitude.",
      },
      {
        prompt: "What is one honest way to describe ‘compare two AOIs’ in a report?",
        suggestedAnswer:
          "E.g. “Scenario comparison of option A vs B for indicative constraint differences—does not imply approval outcome.”",
      },
    ],
  },
  6: {
    commonMistakes: [
      "Removing limitations because the client finds them uncomfortable.",
      "Recommendations that are vague (“monitor”) or not tied to findings.",
    ],
    elaborationPrompt: `Confuse “findings” with “recommendations.” Give an example where a finding is evidence-based and the recommendation is a proportionate next step—and what would be marked down if you merged them. `,
    applicationChecks: [
      {
        prompt: "Write scope, one assumption, and one limitation for a one-page desktop letter.",
        suggestedAnswer:
          "Scope: desktop review of mapped layers for AOI X. Assumption: AOI boundary matches client instruction. Limitation: no field survey; results indicative.",
      },
      {
        prompt: "Replace: ‘We guarantee compliance’ with a defensible alternative.",
        suggestedAnswer:
          "E.g. “Compliance cannot be confirmed from desktop mapping alone; confirm against planning instruments and specialist input as required.”",
      },
      {
        prompt: "List three words/phrases to avoid in consultant writing and one safer alternative each.",
        suggestedAnswer:
          "Examples: ‘prove’ → ‘indicate’; ‘always’ → ‘may’; ‘no risk’ → ‘residual risk cannot be excluded without…’",
      },
    ],
  },
  7: {
    commonMistakes: [
      "Mixing datasets without CRS alignment and then measuring area/length.",
      "Publishing maps without legend, scale, north arrow, or data sources.",
    ],
    elaborationPrompt: `Confuse “vector overlay” with “ecological truth.” What does intersect tell you geometrically vs what ecology or planning must still establish?`,
    applicationChecks: [
      {
        prompt: "Vector vs raster: one example use each for environmental consulting.",
        suggestedAnswer:
          "Vector: parcels, boundaries, constraints polygons. Raster: DEM, aerial imagery, continuous surfaces.",
      },
      {
        prompt: "Name three metadata fields you would cite in a map appendix caption.",
        suggestedAnswer:
          "Source agency, capture date/currency, scale or accuracy statement if available.",
      },
      {
        prompt: "What breaks if two layers are in different CRS without transformation?",
        suggestedAnswer:
          "Features misalign; measurements and overlay results are unreliable.",
      },
    ],
  },
  8: {
    commonMistakes: [
      "Measuring areas in geographic degrees as if they were metres.",
      "Using the wrong MGA zone for the site longitude.",
    ],
    elaborationPrompt: `Confuse WGS84 latitudes/longitudes with “metres on the ground.” When would you reproject, and what would a reviewer mark in a PDF map without CRS stated?`,
    applicationChecks: [
      {
        prompt: "EPSG:4326 vs a projected MGA CRS—in one sentence each, when to use them.",
        suggestedAnswer:
          "4326: common for global exchange/webs. MGA projected CRS: for metric distance/area in a Queensland zone appropriate to the site.",
      },
      {
        prompt: "Name two symptoms of a CRS mix-up error.",
        suggestedAnswer:
          "Layers offset visually; area/length nonsense vs expected site size.",
      },
      {
        prompt: "What is one sentence you should put in methods about CRS?",
        suggestedAnswer:
          "E.g. “All layers were aligned to [CRS] before analysis; measurements were taken in [projected CRS].”",
      },
    ],
  },
  9: {
    commonMistakes: [
      "Beautiful maps with no source citations or disclaimer.",
      "Using intersect counts to imply impact magnitude without context.",
    ],
    elaborationPrompt: `Confuse “intersect returned features” with “legal constraint confirmed.” What extra steps sit between GIS output and a planning/legal statement?`,
    applicationChecks: [
      {
        prompt: "Define buffer, clip, intersect, spatial join in one line each.",
        suggestedAnswer:
          "Buffer: zone within distance. Clip: cut to AOI. Intersect: overlap geometry. Spatial join: attach attributes by spatial relationship.",
      },
      {
        prompt: "Why is reproducibility important for a constraints map pack?",
        suggestedAnswer:
          "Audit trail, peer review, and updating when inputs change.",
      },
      {
        prompt: "Give one sentence that describes intersect results without implying approval outcome.",
        suggestedAnswer:
          "E.g. “The AOI intersects mapped layer X; further assessment against scheme and specialist input is required to determine implications.”",
      },
    ],
  },
  10: {
    commonMistakes: [
      "Treating a desktop CSM as final truth.",
      "Omitting receptors or pathways because they are not visible in GIS polygons.",
    ],
    elaborationPrompt: `Confuse “I drew a polygon” with “I have characterised the pathway.” What pathways does GIS often miss, and how would you phrase that as a limitation?`,
    applicationChecks: [
      {
        prompt: "Write SPR for a fuel leak scenario with source, pathway, receptor.",
        suggestedAnswer:
          "Source: buried tank. Pathway: soil/leaching to groundwater, surface water. Receptor: users, ecology, buildings—depending on context.",
      },
      {
        prompt: "Why label a CSM ‘preliminary’?",
        suggestedAnswer:
          "Evidence is incomplete; hypotheses may change with investigation.",
      },
      {
        prompt: "Name two lines of evidence that would reduce uncertainty in a PSI beyond desktop.",
        suggestedAnswer:
          "E.g. soil sampling, groundwater monitoring wells, historical records, site inspection.",
      },
    ],
  },
  11: {
    commonMistakes: [
      "Treating desktop fate discussion as proof of concentrations or off-site impact.",
      "Applying hydrocarbon intuition to PFAS without acknowledging different behaviour.",
    ],
    elaborationPrompt: `Confuse “hypothesis” with “measured fact.” What language separates a pathway hypothesis from evidence, and what would a marker penalise?`,
    applicationChecks: [
      {
        prompt: "In one sentence each: sorption and plume.",
        suggestedAnswer:
          "Sorption: contaminant attaches to solids, retarding movement. Plume: zone of contaminated groundwater migrating from source.",
      },
      {
        prompt: "When might you recommend groundwater sampling?",
        suggestedAnswer:
          "When a credible pathway exists and uncertainty is material to site decisions or risk.",
      },
      {
        prompt: "What is one hedged sentence for a fate hypothesis?",
        suggestedAnswer:
          "E.g. “If the source is present, migration along the groundwater gradient is plausible pending investigation.”",
      },
    ],
  },
  12: {
    commonMistakes: [
      "Stating approval outcomes from maps alone.",
      "Hiding uncertainty in the executive summary.",
    ],
    elaborationPrompt: `Confuse “the GIS intersected” with “the site is unsafe” or “the site is safe.” What is the minimum structure you need before a binary answer is even meaningful?`,
    applicationChecks: [
      {
        prompt: "Classify: ‘layer intersects AOI’ — fact, assumption, or inference? Why?",
        suggestedAnswer:
          "Usually a recorded fact within stated query methods—if methods and CRS are correct.",
      },
      {
        prompt: "Write one sentence that separates inference from fact in a desktop review.",
        suggestedAnswer:
          "E.g. “While the AOI intersects mapped habitat X, the significance of impacts requires ecology and legal context beyond this desktop review.”",
      },
      {
        prompt: "Define epistemic uncertainty in one line.",
        suggestedAnswer:
          "Uncertainty due to limited knowledge—often reducible with more data.",
      },
    ],
  },
  13: {
    commonMistakes: [
      "Treating the capstone as a map dump without methods, limitations, and recommendations.",
      "Portfolio claims without artefacts to evidence them.",
    ],
    elaborationPrompt: `Confuse “I used the tool” with “I integrated Term 1 learning.” List three weaknesses a red-team reviewer would find in a typical graduate capstone report.`,
    applicationChecks: [
      {
        prompt: "List five sections in a credible desktop screening mini-report.",
        suggestedAnswer:
          "Purpose, scope, methods, results, limitations, recommendations (often plus appendices).",
      },
      {
        prompt: "What is one thing you would do differently with more budget?",
        suggestedAnswer:
          "E.g. field survey, specialist ecology, legal review, more sampling, higher resolution data.",
      },
      {
        prompt: "Name two artefacts from this app you could attach to a portfolio evidence pack.",
        suggestedAnswer:
          "PDF report, CSV/session JSON, exported figures, compare snapshots.",
      },
    ],
  },
};
