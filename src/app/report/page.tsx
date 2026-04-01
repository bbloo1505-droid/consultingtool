"use client";

import type { ReactNode } from "react";
import { useEffect, useState, startTransition, useMemo } from "react";
import type { LayerScreeningResult, ScreenResponse, StoredScreeningSession } from "@/types/screening";
import glossary from "@/data/glossary.json";
import { layersToCsv } from "@/lib/csv-export";
import { buildMethodsParagraph } from "@/lib/methods-blurb";
import { parseStoredScreening, SCREENING_STORAGE_KEY } from "@/lib/screening-storage";
import { BrandedTable, Td, TdX, Th } from "@/components/report/BrandedTable";
import { ReportShell } from "@/components/report/ReportShell";
import { ReportCover } from "@/components/report/ReportCover";
import { MetadataGrid, type MetaItem } from "@/components/report/MetadataGrid";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { MapFigure } from "@/components/report/MapFigure";
import { ReportSection } from "@/components/report/ReportSection";
import { ReportStatusChip } from "@/components/report/ReportStatusChip";
import { auditOffsetCoverage } from "@/lib/offset/coverage";
import { groupOffsetLayers } from "@/lib/offset/groups";
import { evaluateOffsetSuitability, matterLabel } from "@/lib/offset/rules";

type GlossaryEntry = {
  title: string;
  summary: string;
  nextSteps: string;
  references?: { label: string; url: string }[];
};
const GLOSSARY = glossary as Record<string, GlossaryEntry>;

const DOMAIN_LABEL: Record<number, string> = {
  4: "Protected areas / conservation",
  5: "Vegetation / offsets",
  6: "Wildlife habitat",
  7: "Water / wetlands / fisheries",
  8: "Fire history",
  10: "World Heritage / protected estates",
  11: "Flood (historical mapping)",
};

function domainLabel(d: number): string {
  return DOMAIN_LABEL[d] ?? `Domain ${d}`;
}

function tierLabel(t: string): string {
  switch (t) {
    case "hard":
      return "Hard constraint (screening tier)";
    case "trigger":
      return "Trigger (likely assessment attention)";
    case "watch":
      return "Watch / contextual";
    default:
      return t;
  }
}

function formatLga(lga: string): string {
  switch (lga) {
    case "brisbane":
      return "Queensland statewide catalog + SEQ historical flood overlays (FloodCheck)";
    case "gold_coast":
      return "Queensland statewide + SEQ flood overlays (same layers as Brisbane pack; verify GC-specific data separately)";
    case "sunshine_coast":
      return "Queensland statewide + SEQ flood overlays (same layers as Brisbane pack)";
    case "cairns":
      return "Queensland statewide catalog (Cairns pack — no additional layers configured)";
    default:
      return "Queensland statewide catalog";
  }
}

export default function ReportPage() {
  const [data, setData] = useState<ScreenResponse | null>(null);
  const [session, setSession] = useState<StoredScreeningSession | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCREENING_STORAGE_KEY);
      const parsed = parseStoredScreening(raw);
      if (!parsed?.screen) return;
      startTransition(() => {
        setSession(parsed);
        setData(parsed.screen);
      });
    } catch {
      // ignore
    }
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const hits = data.layers.filter((l) => l.featureCount > 0);
    const totalFeatures = data.layers.reduce((s, l) => s + l.featureCount, 0);
    const errors = data.layers.filter((l) => l.error);
    const capped = data.layers.filter((l) => l.exceededTransferLimit);
    return { hits, totalFeatures, errors, capped, hitCount: hits.length };
  }, [data]);

  const methodsText = useMemo(() => {
    if (!data || !session) return "";
    return buildMethodsParagraph(data, {
      bufferMeters: session.bufferMeters ?? 0,
      aoiSource: session.aoiSource ?? "draw",
      project: session.project,
    });
  }, [data, session]);

  if (!data || !stats) return null;

  const generated = new Date(data.generatedAt);
  const hits = stats.hits;
  const noHitLayers = data.layers.filter((l) => l.featureCount === 0 && !l.error);
  const [minLng, minLat, maxLng, maxLat] = data.debug?.bboxWgs84 ?? [0, 0, 0, 0];
  const snapshot = session?.mapSnapshotDataUrl;
  const aoiLabel =
    session?.aoiSource === "address"
      ? "Parcel boundary (address lookup)"
      : session?.aoiSource === "draw"
        ? "Digitised polygon (map draw)"
        : session?.aoiSource
          ? `Boundary file (${session.aoiSource})`
          : "AOI";

  const hardHits = data.layers.filter((l) => l.featureCount > 0 && l.tier === "hard").length;
  const triggerHits = data.layers.filter((l) => l.featureCount > 0 && l.tier === "trigger").length;
  const watchHits = data.layers.filter((l) => l.featureCount > 0 && l.tier === "watch").length;
  const topHitLayers = [...hits]
    .sort((a, b) => (b.tier === a.tier ? b.featureCount - a.featureCount : tierRank(b.tier) - tierRank(a.tier)))
    .slice(0, 5);

  const isOffset = session?.mode === "offset";
  const offsetGrouped = isOffset ? groupOffsetLayers(data.layers) : null;
  const offsetFatal = offsetGrouped
    ? offsetGrouped.filter((g) => g.severity === "fatal" && g.layer.featureCount > 0 && !g.layer.error).length
    : 0;
  const offsetRisks = offsetGrouped
    ? offsetGrouped.filter((g) => g.severity === "risk" && g.layer.featureCount > 0 && !g.layer.error).length
    : 0;
  const offsetMatter = session?.offsetMatterType ?? "manual_review_required";
  const offsetSuitability = offsetGrouped ? evaluateOffsetSuitability(offsetGrouped, offsetMatter) : null;
  const offsetCoverage = isOffset
    ? auditOffsetCoverage(data.layers.map((l) => ({ glossaryKey: l.glossaryKey, domain: l.domain })))
    : null;

  return (
    <ReportShell
      onPrint={() => window.print()}
      onCopyMethods={() => {
        navigator.clipboard.writeText(methodsText).catch(() => {});
      }}
      onDownloadCsv={() => {
        const blob = new Blob([layersToCsv(data.layers)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `screening-layers-${data.generatedAt.slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      }}
    >
      <article className="report-doc mx-auto max-w-[210mm] print:max-w-none">
        <ReportCover
          title={isOffset ? "Offset Site Desktop Review (QLD)" : "QLD Environmental Screening Report"}
          subtitle={
            isOffset
              ? "Preliminary desktop review for a proposed offset site: constraints, suitability indicators, legal-security risks, and delivery considerations."
              : "Preliminary desktop screening summary for Queensland spatial layers intersected against a user-defined AOI."
          }
          createdAtLabel={generated.toLocaleString("en-AU", { dateStyle: "long", timeStyle: "short" })}
        />

        <MetadataGrid items={buildMetadataItems({ data, session, generated, aoiLabel })} />

        <ExecutiveSummary
          blurb={
            <>
              {isOffset ? (
                <>
                  <p>
                    This report is a preliminary desktop review for a proposed <strong>offset site</strong>. It screens
                    configured Queensland layers for statutory constraints, legal-security conflicts, delivery risks and
                    desktop indicators of matter presence/capability, and it highlights where specialist review is still required.
                  </p>
                  <p className="mt-2">
                    The suitability rating is conservative and <strong>does not</strong> replace Queensland offsets policy tests,
                    local planning overlays, tenure searches, or field verification. Commonwealth MNES matters require PMST.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    This report summarises the results of an automated spatial intersection between configured Queensland map
                    layers and the nominated AOI. It is designed to support early-stage constraint triage and scoping of
                    follow-up work (e.g. ecology, planning, approvals pathways).
                  </p>
                  <p className="mt-2">
                    Results should be reviewed by a suitably qualified practitioner and verified against authoritative
                    mapping at an appropriate scale. Where Commonwealth triggers may apply, PMST remains the appropriate
                    screening tool for MNES matters.
                  </p>
                </>
              )}
              {topHitLayers.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-[var(--report-ink)]">Top intersecting layers</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {topHitLayers.map((l) => (
                      <li key={l.catalogId}>
                        <ReportStatusChip tone={l.tier === "hard" ? "danger" : l.tier === "trigger" ? "warn" : "neutral"}>
                          {l.name} · {l.featureCount}
                        </ReportStatusChip>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          }
          cards={
            isOffset
              ? [
                  { label: "Suitability rating", value: offsetSuitability?.rating ?? "—" },
                  { label: "Fatal flaws", value: offsetFatal },
                  { label: "Key constraints", value: offsetRisks },
                ]
              : [
                  { label: "Hit layers", value: stats.hitCount },
                  { label: "Feature records", value: stats.totalFeatures.toLocaleString() },
                  { label: "Run quality", value: stats.errors.length ? "Review" : "OK" },
                ]
          }
          keyFlags={
            (isOffset
              ? ([
                  ...(offsetSuitability?.checks ?? []).slice(0, 3).map((c) => ({
                    title: c.label,
                    body: c.rationale,
                    tone: (c.outcome === "fail" ? "danger" : c.outcome === "partial" ? "warn" : "neutral") as
                      | "danger"
                      | "warn"
                      | "neutral",
                  })),
                  ...(offsetCoverage?.missing?.length
                    ? ([
                        {
                          title: "Coverage gaps (manual checks required)",
                          body: `Missing families: ${offsetCoverage.missing.join(", ")}.`,
                          tone: "warn" as const,
                        },
                      ] as const)
                    : []),
                ] as {
                  title: string;
                  body: ReactNode;
                  tone?: "brand" | "good" | "warn" | "danger" | "neutral";
                }[])
              : buildKeyFlags({ hardHits, triggerHits, watchHits, stats }))
          }
        />

        <MapFigure
          dataUrl={snapshot}
          caption="Orientation figure showing the AOI used for the screening run."
          meta={
            <span>
              AOI: {aoiLabel} · Buffer: {session?.bufferMeters ?? 0} m
            </span>
          }
        />

        <ReportSection
          title="Screening summary"
          subtitle="Grouped outcomes aligned to the PMST-style report rhythm."
        >
          <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            <SummaryRow label="Summary" value={`${stats.hitCount} hit layer(s), ${stats.totalFeatures.toLocaleString()} feature record(s)`} tone="brand" />
            <SummaryRow label="Details" value={`${hardHits} hard · ${triggerHits} trigger · ${watchHits} watch`} tone="neutral" />
            <SummaryRow label="MNES (Commonwealth)" value="Not spatially queried in this tool (use PMST)" tone="warn" />
            <SummaryRow label="Other EPBC matters" value="Not spatially queried in this tool (use PMST)" tone="neutral" />
            <SummaryRow label="Extra information" value={`${data.registerHints?.length ?? 0} workflow / register link(s)`} tone="neutral" />
            <SummaryRow label="Caveat" value="Preliminary desktop screening output — verify and apply professional judgement" tone="danger" />
          </div>
        </ReportSection>

        {isOffset && offsetGrouped && offsetSuitability ? (
          <>
            <ReportSection
              title="Offset suitability summary"
              subtitle="Desktop rule checks and assumptions used to frame suitability for the offset site."
            >
              <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 text-sm print:rounded-none print:border-black print:p-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--report-muted)]">Impacted matter type (assumed)</p>
                    <p className="mt-1 font-semibold text-[var(--report-ink)]">{matterLabel(offsetMatter)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[var(--report-muted)]">Overall rating</p>
                    <p className="mt-1 text-base font-semibold text-[var(--report-ink)]">{offsetSuitability.rating}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                  {offsetSuitability.checks.map((c) => (
                    <div key={c.id} className="rounded-[14px] border border-[var(--report-border)] bg-[var(--report-bg)] p-4 print:bg-transparent">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--report-ink)]">{c.label}</p>
                        <ReportStatusChip tone={c.outcome === "fail" ? "danger" : c.outcome === "partial" ? "warn" : c.outcome === "pass" ? "good" : "neutral"}>
                          {c.outcome.toUpperCase()}
                        </ReportStatusChip>
                      </div>
                      <p className="mt-2 text-sm text-[var(--report-muted)]">{c.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ReportSection>

            <ReportSection
              title="Coverage audit"
              subtitle="Enabled constraint families vs missing families that still require manual checks."
            >
              <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
                  <p className="text-sm font-semibold text-[var(--report-ink)]">Enabled families</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--report-ink)]">
                    {(offsetCoverage?.enabled ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--report-success)]" />
                        <span className="min-w-0">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
                  <p className="text-sm font-semibold text-[var(--report-ink)]">Missing / manual checks</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--report-ink)]">
                    {(offsetCoverage?.missing ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--report-warning)]" />
                        <span className="min-w-0">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-[var(--report-muted)]">
                    This tool does not fully automate council overlays or authoritative tenure/encumbrance checks.
                  </p>
                </div>
              </div>
            </ReportSection>

            <ReportSection
              title="Constraint register"
              subtitle="A structured register of constraints, severity, and recommended follow-up for an offset site."
            >
              <BrandedTable
                columns={
                  <>
                    <Th>Family</Th>
                    <Th>Layer</Th>
                    <Th>Result</Th>
                    <Th>Severity</Th>
                    <Th>Why it matters</Th>
                    <Th>Follow-up</Th>
                  </>
                }
              >
                {offsetGrouped.map((g) => {
                  const hit = g.layer.featureCount > 0 && !g.layer.error;
                  const severity =
                    g.severity === "fatal"
                      ? "Fatal"
                      : g.severity === "positive"
                        ? "Positive"
                        : g.severity === "risk"
                          ? "Review"
                          : "Info";
                  return (
                    <tr key={g.layer.catalogId} className="align-top">
                      <Td>{g.group}</Td>
                      <Td>{g.layer.name}</Td>
                      <TdX className="tabular-nums">{g.layer.error ? `Error` : hit ? `${g.layer.featureCount}` : "0"}</TdX>
                      <Td>
                        <ReportStatusChip tone={g.severity === "fatal" ? "danger" : g.severity === "risk" ? "warn" : g.severity === "positive" ? "good" : "neutral"}>
                          {severity}
                        </ReportStatusChip>
                      </Td>
                      <Td>{g.whyItMatters}</Td>
                      <Td>{g.followUp}</Td>
                    </tr>
                  );
                })}
              </BrandedTable>
            </ReportSection>
          </>
        ) : null}

        <ReportSection title="Details" subtitle="Scope and intended use (what this report is and is not).">
          <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 text-sm leading-relaxed text-[var(--report-ink)] print:rounded-none print:border-black print:p-0">
            <p>
              This report is an <strong>indicative, non-statutory</strong> screening output. It does not constitute an environmental impact
              assessment, an EPBC Act referral recommendation, a clearing approval, an offset calculation, or planning scheme advice.
            </p>
            <p className="mt-3">
              Results are derived from configured map services and reflect the data currency, scale, and completeness available at the time of
              query. Intersections may indicate mapped data coincident with the AOI but do not establish an impact or approval requirement.
            </p>
          </div>
        </ReportSection>

        <ReportSection title="Methodology" subtitle="AOI preparation and layer query method.">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-strong print:text-black">
          <li>
            The AOI was{" "}
            {session?.aoiSource === "draw" || !session?.aoiSource
              ? "digitised in the web map"
              : session.aoiSource === "address"
                ? "loaded from a Queensland address search (geocoded point intersected with DCDB cadastral parcels)"
                : session.aoiSource === "geojson" || session.aoiSource === "upload"
                  ? "supplied as uploaded GeoJSON"
                  : session.aoiSource === "kml" || session.aoiSource === "kmz"
                    ? "supplied from uploaded KML/KMZ"
                    : session.aoiSource === "shapefile"
                      ? "supplied from an uploaded shapefile (.zip)"
                      : "loaded from a file upload"}{" "}
            and normalised to WGS84 where
            required (including correction if coordinates appeared as lat/lng order swap or Web Mercator metres).
            {(session?.bufferMeters ?? 0) > 0
              ? ` A geodesic buffer of ${session?.bufferMeters} m was applied to the AOI before querying.`
              : " No buffer was applied before querying."}
          </li>
          <li>
            For each configured map layer, the application server issued an Esri REST{" "}
            <code className="rounded bg-bg-soft px-1 font-mono text-xs print:bg-neutral-100">query</code>{" "}
            with spatial relationship <em>intersects</em> against the AOI polygon.
          </li>
          <li>
            Returned features are capped per layer (sample size) for display; attribute tables may be incomplete if the
            server enforces a transfer limit.
          </li>
          <li>Layer metadata and attribution are as published by the data custodian at the time of query.</li>
        </ol>
        {methodsText ? (
          <div className="mt-4 rounded-[14px] border border-border bg-bg-soft p-3 text-sm leading-relaxed print:border-black print:bg-transparent print:text-black">
            <p className="font-semibold text-text-strong print:text-black">Methods paragraph (copy-ready)</p>
            <p className="mt-2 whitespace-pre-wrap">{methodsText}</p>
          </div>
        ) : null}
        {data.debug ? (
          <div className="mt-4 rounded-[14px] border border-border bg-bg-soft p-3 font-mono text-[0.7rem] leading-relaxed print:border-black print:bg-transparent print:text-black">
            <p>
              Bounding box (WGS84, min/max): {minLng.toFixed(6)}, {minLat.toFixed(6)} to {maxLng.toFixed(6)},{" "}
              {maxLat.toFixed(6)}
            </p>
            <p>
              Normalisation flags: lat/lng swap heuristic applied = {String(data.debug.swappedLatLng)}; Web Mercator
              conversion applied = {String(data.debug.fromWebMercator)}
            </p>
          </div>
        ) : null}
        </ReportSection>

        <ReportSection title="Study area reference" subtitle="Orientation metadata stored for this run.">
        <div className="space-y-2 text-sm text-text-strong print:text-black">
          {data.cadastre ? (
            <>
              <p>{data.cadastre.note}</p>
              <p>
                <strong>Approximate centroid (WGS84 / EPSG:4326):</strong> latitude {data.cadastre.centroidLat.toFixed(6)},
                longitude {data.cadastre.centroidLng.toFixed(6)} (decimal degrees).
              </p>
              <p className="break-all text-xs text-text-muted print:text-black">
                Orientation map (third party): {data.cadastre.openMapUrl}
              </p>
            </>
          ) : (
            <p>No centroid metadata was stored for this run.</p>
          )}
        </div>
        </ReportSection>

      {/* Results table - all layers */}
        <ReportSection
          title="State / Queensland screening layers"
          subtitle="Spatial intersection results for configured Queensland layers."
        >
        <div className="mt-2">
          <BrandedTable
            columns={
              <>
                <Th>Layer</Th>
                <Th>Theme</Th>
                <Th>Tier</Th>
                <Th>Count</Th>
                <Th>Status</Th>
              </>
            }
          >
            {data.layers.map((layer) => (
              <ResultTableRow key={layer.catalogId} layer={layer} />
            ))}
          </BrandedTable>
        </div>

        {hits.length > 0 ? (
          <>
            <h3 className="mt-8 text-base font-semibold text-text-strong print:text-black">
              Narrative summary of layers with intersections
            </h3>
            <p className="mt-2 text-sm text-text-strong print:text-black">
              The following layers returned one or more intersecting features. Interpret alongside field survey,
              planning scheme mapping, and statutory tests.
            </p>
            <ol className="mt-4 list-decimal space-y-6 pl-5 text-sm">
              {hits.map((layer) => (
                <HitDetail key={layer.catalogId} layer={layer} />
              ))}
            </ol>
          </>
        ) : null}

        {noHitLayers.length > 0 && hits.length === 0 ? (
          <p className="mt-4 text-sm italic text-text-muted print:text-black">
            No layers returned a positive intersection for this AOI under the current configuration.
          </p>
        ) : null}

        {noHitLayers.length > 0 && hits.length > 0 ? (
          <>
            <h3 className="mt-8 text-base font-semibold text-text-strong print:text-black">
              Layers with no intersection (nil return)
            </h3>
            <p className="mt-2 text-sm text-text-strong print:text-black">
              The following configured layers returned zero intersecting features for the AOI (nil spatial overlap in the
              source data at the query scale):
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-text-strong print:text-black">
              {noHitLayers.map((l) => (
                <li key={l.catalogId}>{l.name}</li>
              ))}
            </ul>
          </>
        ) : null}
        </ReportSection>

      {/* Further assessment */}
        <ReportSection
          title="Matters of National Environmental Significance (MNES)"
          subtitle="Commonwealth matters are not spatially queried in this tool. Use PMST and statutory workflows."
        >
        <div className="space-y-3 text-sm leading-relaxed text-text-strong print:text-black">
          <p>
            Where development may affect matters of national environmental significance, proponents typically use the
            Commonwealth Protected Matters Search Tool (PMST) and seek advice under the <em>Environment Protection and
            Biodiversity Conservation Act 1999</em> framework. For Queensland biodiversity and MSES products, Biomaps,
            Queensland Globe, and agency databases may be used in addition to this screening.
          </p>
          <p className="rounded-[14px] border border-warning/35 bg-warning/10 p-3 print:border-black print:bg-neutral-100 print:text-black">
            <strong>Spot-check in Queensland Globe:</strong> for any layer outcome that could change a project decision,
            confirm intersections visually in Globe (or the source MapServer) at an appropriate scale and with your
            authoritative site boundary — automated intersection alone is not a substitute for visual verification.
          </p>
        </div>

        {data.consultantWorkflow ? (
          <div className="mt-4 rounded-[14px] border border-border bg-bg-soft p-4 text-sm print:border-black print:bg-transparent">
            <p className="font-semibold text-text-strong print:text-black">Workflow links (centroid-assisted)</p>
            <p className="mt-2 text-text-muted print:text-black">{data.consultantWorkflow.summary}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 break-all text-xs">
              <li>
                <strong>PMST (map):</strong> {data.consultantWorkflow.pmstMapUrl}
              </li>
              <li>
                <strong>Biomaps:</strong> {data.consultantWorkflow.biomapsStoryUrl}
              </li>
              <li>
                <strong>Planning Regulation (PDF):</strong> {data.consultantWorkflow.planningRegulationPdfUrl}
              </li>
            </ul>
          </div>
        ) : null}

        </ReportSection>

        <ReportSection
          title="Other matters protected by the EPBC Act"
          subtitle="This tool does not spatially query EPBC “other matters”. Use PMST and agency guidance."
        >
          <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 text-sm text-[var(--report-muted)] print:rounded-none print:border-black print:p-0">
            <p>
              If actions may affect the environment on Commonwealth land or Commonwealth areas, additional approval pathways may apply.
              Use PMST outputs and project-specific advice for Commonwealth matters.
            </p>
          </div>
        </ReportSection>

        <ReportSection title="Extra information" subtitle="Non-spatial workflow links and registers to support due diligence.">
          {data.registerHints && data.registerHints.length > 0 ? (
            <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-[var(--report-ink)] print:text-black">
              {data.registerHints.map((h) => (
                <li key={h.id}>
                  <span className="font-semibold">{h.title}</span> - {h.description}{" "}
                  <span className="break-all text-xs text-[var(--report-muted)]">({h.url})</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[var(--report-muted)]">No extra information was returned for this run.</p>
          )}
        </ReportSection>

        <ReportSection title="Caveat / limitations" subtitle="Interpretation guidance for a preliminary desktop screening output.">
          <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 text-sm leading-relaxed text-[var(--report-ink)] print:rounded-none print:border-black print:p-0">
            <ul className="list-inside list-disc space-y-2 text-[var(--report-ink)]">
              <li>
                This report is a preliminary desktop screening output and does not replace field verification, survey, or statutory assessment.
              </li>
              <li>
                The AOI is not a surveyed cadastral or legal boundary unless sourced from authoritative cadastral/survey data.
              </li>
              <li>
                Results depend on the currency, scale, positional accuracy, and completeness of third-party datasets and services at the time of query.
              </li>
              <li>
                Some layers represent potential presence/likelihood indicators rather than confirmed on-ground occurrence.
              </li>
              <li>
                Automated intersection outputs should be reviewed by a suitably qualified professional before being relied on for project decisions.
              </li>
            </ul>
          </div>
        </ReportSection>

        <ReportSection title="Acknowledgements / data sources" subtitle="How this report is compiled.">
          <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 text-sm leading-relaxed text-[var(--report-muted)] print:rounded-none print:border-black print:p-0">
            <p>
              Results are compiled from configured Queensland map services and supporting workflow references used by the Bloom Foundry Environmental Screening platform.
              Layer attribution is recorded per layer in the results section. Report generated at{" "}
              <span className="font-mono text-xs text-[var(--report-ink)]">{data.generatedAt}</span>.
            </p>
          </div>
        </ReportSection>

        <footer className="mt-8 border-t border-[var(--report-border)] pt-4 text-center text-[0.7rem] text-[var(--report-muted)] print:border-black">
          Bloom Foundry · QLD Environmental Screening
          {data.audit?.appVersion ? ` · v${data.audit.appVersion}` : ""}
          {data.audit?.catalogFingerprint ? ` · ${data.audit.catalogFingerprint}` : ""} · Generated {generated.toLocaleString("en-AU")}
        </footer>
      </article>
    </ReportShell>
  );
}

function tierRank(tier: string): number {
  switch (tier) {
    case "hard":
      return 3;
    case "trigger":
      return 2;
    case "watch":
      return 1;
    default:
      return 0;
  }
}

function buildMetadataItems({
  data,
  session,
  generated,
  aoiLabel,
}: {
  data: ScreenResponse;
  session: StoredScreeningSession | null;
  generated: Date;
  aoiLabel: string;
}): MetaItem[] {
  const p = session?.project;
  return [
    { label: "Client", value: p?.clientName ?? "" },
    { label: "Project / site", value: p?.siteName ?? "" },
    { label: "Job / file ID", value: p?.jobId ?? "" },
    { label: "Analyst", value: p?.analyst ?? "" },
    { label: "Report date", value: p?.reportDate ?? "" },
    { label: "AOI description", value: aoiLabel },
    { label: "Buffer distance", value: `${session?.bufferMeters ?? 0} m` },
    { label: "Study area pack", value: data.audit?.lga ? formatLga(data.audit.lga) : "" },
    { label: "Layers queried", value: data.audit?.layersQueried ?? "" },
    { label: "Screening timestamp", value: generated.toLocaleString("en-AU", { dateStyle: "long", timeStyle: "short" }) },
  ];
}

function buildKeyFlags({
  hardHits,
  triggerHits,
  watchHits,
  stats,
}: {
  hardHits: number;
  triggerHits: number;
  watchHits: number;
  stats: { errors: LayerScreeningResult[]; capped: LayerScreeningResult[] };
}): { title: string; body: ReactNode; tone?: "brand" | "good" | "warn" | "danger" | "neutral" }[] {
  const flags: { title: string; body: ReactNode; tone?: "brand" | "good" | "warn" | "danger" | "neutral" }[] = [];

  if (hardHits > 0) {
    flags.push({
      title: "Hard constraints intersected",
      body: `${hardHits} hard-tier layer(s) returned intersecting features. Treat as high-priority for verification and interpretation.`,
      tone: "danger",
    });
  }
  if (triggerHits > 0) {
    flags.push({
      title: "Assessment attention triggers",
      body: `${triggerHits} trigger-tier layer(s) intersected. Review in Queensland Globe and align with statutory tests.`,
      tone: "warn",
    });
  }
  if (watchHits > 0 && (hardHits + triggerHits) === 0) {
    flags.push({
      title: "Contextual overlays only",
      body: `${watchHits} watch-tier layer(s) intersected. These are typically contextual; confirm relevance to project scope.`,
      tone: "neutral",
    });
  }
  if (stats.errors.length > 0) {
    flags.push({
      title: "Layer query errors",
      body: `${stats.errors.length} layer(s) returned an error and should not be relied upon until a successful re-run.`,
      tone: "warn",
    });
  }
  if (stats.capped.length > 0) {
    flags.push({
      title: "Transfer limit / partial results",
      body: `${stats.capped.length} layer(s) may have truncated feature lists at the server maximum. Narrow AOI or obtain a direct extract if needed.`,
      tone: "warn",
    });
  }
  return flags;
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "brand" | "warn" | "danger";
}) {
  return (
    <div className="rounded-[14px] border border-[var(--report-border)] bg-[var(--report-surface)] p-4 print:border-black print:bg-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--report-muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--report-ink)]">{value}</p>
        </div>
        <ReportStatusChip tone={tone === "brand" ? "brand" : tone === "warn" ? "warn" : tone === "danger" ? "danger" : "neutral"}>
          {tone === "brand" ? "Summary" : tone === "warn" ? "Advisory" : tone === "danger" ? "Caveat" : "Info"}
        </ReportStatusChip>
      </div>
    </div>
  );
}

function ResultTableRow({ layer }: { layer: LayerScreeningResult }) {
  let status = "OK";
  if (layer.error) status = "Query error";
  else if (layer.exceededTransferLimit) status = "Capped / partial";

  return (
    <tr className="align-top print:break-inside-avoid">
      <Td>{layer.name}</Td>
      <Td>{domainLabel(layer.domain)}</Td>
      <Td>{layer.tier}</Td>
      <Td>
        <span className="tabular-nums">{layer.featureCount}</span>
      </Td>
      <Td>{status}</Td>
    </tr>
  );
}

function HitDetail({ layer }: { layer: LayerScreeningResult }) {
  const g = GLOSSARY[layer.glossaryKey];
  return (
    <li className="text-text-strong print:text-black">
      <p className="font-semibold">{layer.name}</p>
      <p className="text-xs text-text-muted print:text-black">
        {domainLabel(layer.domain)} | {tierLabel(layer.tier)} | Features intersecting: {layer.featureCount}
      </p>
      {layer.exceededTransferLimit ? (
        <p className="mt-1 text-xs font-medium text-text-strong print:text-black">
          Server transfer limit may apply; feature list may be incomplete.
        </p>
      ) : null}
      {layer.error ? <p className="mt-1 text-xs text-text-strong print:text-black">Error: {layer.error}</p> : null}
      {g ? (
        <div className="mt-2 text-text-strong print:text-black">
          <p className="text-sm font-semibold">{g.title}</p>
          <p className="mt-1">{g.summary}</p>
          <p className="mt-1 text-text-muted print:text-black">
            <strong>Recommended next steps:</strong> {g.nextSteps}
          </p>
          {g.references && g.references.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-xs">
              {g.references.map((r) => (
                <li key={r.url} className="break-all">
                  {r.label}: {r.url}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-text-muted print:text-black">Source: {layer.attribution}</p>
      <details className="mt-2 print:hidden">
        <summary className="cursor-pointer text-xs text-text-muted">Sample attributes (first records)</summary>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-bg-soft p-2 font-mono text-[0.65rem] text-text-strong">
          {JSON.stringify(layer.features.slice(0, 5), null, 2)}
        </pre>
      </details>
      <pre className="mt-2 hidden max-h-48 overflow-hidden rounded border border-border bg-bg-soft p-2 font-mono text-[0.6rem] print:block print:break-inside-avoid print:border-black print:text-black">
        {JSON.stringify(layer.features.slice(0, 3), null, 2)}
      </pre>
    </li>
  );
}
