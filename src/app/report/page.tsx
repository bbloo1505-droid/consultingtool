"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import Link from "next/link";
import type { LayerScreeningResult, ScreenResponse, StoredScreeningSession } from "@/types/screening";
import glossary from "@/data/glossary.json";
import { layersToCsv } from "@/lib/csv-export";
import { buildMethodsParagraph } from "@/lib/methods-blurb";
import { parseStoredScreening, SCREENING_STORAGE_KEY } from "@/lib/screening-storage";

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

  if (!data || !stats) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-bloom-brown/90 dark:text-bloom-cream/80">No screening data found. Run a screening from the home page first.</p>
        <Link className="mt-4 inline-block text-bloom-brown underline dark:text-bloom-gold-light" href="/">
          Back to map
        </Link>
      </div>
    );
  }

  const generated = new Date(data.generatedAt);
  const hits = stats.hits;
  const noHitLayers = data.layers.filter((l) => l.featureCount === 0 && !l.error);
  const [minLng, minLat, maxLng, maxLat] = data.debug?.bboxWgs84 ?? [0, 0, 0, 0];

  return (
    <article
      className="report-doc mx-auto max-w-[210mm] px-4 py-8 text-bloom-ink dark:text-bloom-cream print:max-w-none print:bg-white print:px-8 print:py-6 print:text-black print:text-[11pt] print:leading-snug"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/">
            Back to map
          </Link>
          <Link className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/insights">
            Charts
          </Link>
          <Link className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/compare">
            Compare
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-bloom-brown/20 bg-white px-3 py-1.5 text-sm font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream dark:hover:bg-bloom-brown/30"
            onClick={() => {
              const blob = new Blob([layersToCsv(data.layers)], { type: "text/csv;charset=utf-8" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `screening-layers-${data.generatedAt.slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download CSV
          </button>
          <button
            type="button"
            className="rounded-lg border border-bloom-brown/20 bg-white px-3 py-1.5 text-sm font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream dark:hover:bg-bloom-brown/30"
            onClick={() => {
              navigator.clipboard.writeText(methodsText).catch(() => {});
            }}
          >
            Copy methods text
          </button>
          <button
            type="button"
            className="rounded-lg border border-bloom-brown/20 bg-white px-3 py-1.5 text-sm font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream dark:hover:bg-bloom-brown/30"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Cover-style header */}
      <header className="mt-6 border-b-2 border-bloom-ink/80 pb-6 print:mt-0 print:border-black print:pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-bloom-brown dark:text-bloom-gold-light print:text-black">
          Bloom Foundry | QLD Environmental Screening
        </p>
        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight text-bloom-ink dark:text-bloom-cream print:text-xl print:text-black">
          Indicative spatial screening report
        </h1>
        <p className="mt-2 max-w-prose text-sm text-bloom-brown/90 dark:text-bloom-cream/80 print:text-black">
          Matters of State Environmental Significance (MSES) and related Queensland spatial layers intersected against
          a user-defined area of interest. This document is for internal triage only unless issued under a qualified
          environmental assessment.
        </p>

        <dl className="mt-6 grid gap-3 border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-sm dark:border-bloom-gold/25 dark:bg-bloom-ink/40 print:border print:border-black print:bg-transparent">
          {session?.project?.clientName ? (
            <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Client</dt>
              <dd>{session.project.clientName}</dd>
            </div>
          ) : null}
          {session?.project?.siteName ? (
            <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Site</dt>
              <dd>{session.project.siteName}</dd>
            </div>
          ) : null}
          {session?.project?.jobId ? (
            <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Job / file ID</dt>
              <dd>{session.project.jobId}</dd>
            </div>
          ) : null}
          {session?.project?.analyst ? (
            <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Analyst</dt>
              <dd>{session.project.analyst}</dd>
            </div>
          ) : null}
          {session?.project?.reportDate ? (
            <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Cover date</dt>
              <dd>{session.project.reportDate}</dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
            <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Report date</dt>
            <dd>{generated.toLocaleString("en-AU", { dateStyle: "long", timeStyle: "short" })}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
            <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Reference time (ISO)</dt>
            <dd className="font-mono text-xs">{data.generatedAt}</dd>
          </div>
          {data.audit ? (
            <>
              <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
                <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Layer pack</dt>
                <dd>{formatLga(data.audit.lga)}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
                <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Layers queried</dt>
                <dd>{data.audit.layersQueried}</dd>
              </div>
              {data.audit.appVersion ? (
                <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
                  <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">App version</dt>
                  <dd className="font-mono text-xs">{data.audit.appVersion}</dd>
                </div>
              ) : null}
              {data.audit.catalogFingerprint ? (
                <div className="grid grid-cols-[8rem_1fr] gap-2 print:grid-cols-[7.5rem_1fr]">
                  <dt className="font-semibold text-bloom-brown dark:text-bloom-gold-light print:text-black">Catalog fingerprint</dt>
                  <dd className="font-mono text-xs">{data.audit.catalogFingerprint}</dd>
                </div>
              ) : null}
            </>
          ) : null}
        </dl>
      </header>

      {/* Executive summary */}
      <section className="report-section mt-8 print:break-inside-avoid">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          Executive summary
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          <p>
            A desktop spatial screening was performed by intersecting publicly available Queensland (and selected
            related) map layers with a user-defined polygon representing the area of interest (AOI)—drawn on the map or
            uploaded as GeoJSON, optionally buffered before querying. The objective is to flag{" "}
            <strong>potential</strong> overlap with mapped Matters of State Environmental Significance (MSES) and allied
            constraints to inform whether detailed ecology, planning, or approvals pathways may warrant consideration.
          </p>
          <p>
            <strong>Key outcome:</strong> {stats.hitCount} layer{stats.hitCount === 1 ? "" : "s"} returned at least one
            intersecting feature ({stats.totalFeatures.toLocaleString()} feature record
            {stats.totalFeatures === 1 ? "" : "s"} in total across those layers).{" "}
            {stats.hitCount === 0
              ? "No mapped intersections were returned under the current layer configuration; this does not demonstrate absence of environmental values on the ground."
              : "Presence of an intersection does not, by itself, establish an impact or approval requirement; it indicates mapped data coincident with the AOI."}
          </p>
          {stats.errors.length > 0 ? (
            <p>
              <strong>Data quality note:</strong> {stats.errors.length} layer query
              {stats.errors.length === 1 ? "" : "ies"} returned an error (see Section 4). Results for those layers should
              not be relied upon until the service responds successfully.
            </p>
          ) : null}
          {stats.capped.length > 0 ? (
            <p>
              <strong>Transfer limit:</strong> One or more layers may have truncated feature lists at the server
              maximum. Narrow the AOI or obtain a direct data extract if a complete attribute list is required.
            </p>
          ) : null}
        </div>
      </section>

      {/* Scope */}
      <section className="report-section mt-8 print:break-inside-avoid">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          1. Scope and intended use
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          <p>
            This report is an <strong>indicative, non-statutory</strong> screening output. It does not constitute an
            environmental impact assessment, an EPBC Act referral recommendation, a clearing approval, a biodiversity
            offset calculation, or planning scheme advice.
          </p>
          <p>
            <strong>MSES (Queensland)</strong> matters are approximated using published government map services
            intersected with the AOI. <strong>MNES (Commonwealth)</strong> matters under the EPBC Act (e.g. threatened
            species, threatened ecological communities) are <strong>not</strong> automatically assessed in this tool; the
            Protected Matters Search Tool (PMST) and project-specific advice remain the appropriate tests where
            Commonwealth triggers may apply.
          </p>
          <p>
            The user-drawn AOI is not a surveyed boundary. Where legal lot boundaries, easements, or design footprints
            differ from the AOI, conclusions may not hold.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="report-section mt-8 print:break-inside-avoid">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          2. Methodology
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
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
            For each configured map layer, the application server issued an Esri REST <code className="rounded bg-bloom-cream/80 px-1 font-mono text-xs print:bg-neutral-100">query</code>{" "}
            with spatial relationship <em>intersects</em> against the AOI polygon.
          </li>
          <li>
            Returned features are capped per layer (sample size) for display; attribute tables may be incomplete if the
            server enforces a transfer limit.
          </li>
          <li>Layer metadata and attribution are as published by the data custodian at the time of query.</li>
        </ol>
        {methodsText ? (
          <div className="mt-4 rounded border border-bloom-brown/20 bg-bloom-cream/30 p-3 text-sm leading-relaxed text-bloom-brown/95 dark:bg-bloom-brown/25 dark:text-bloom-cream/85 print:border-black print:bg-transparent print:text-black">
            <p className="font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">Methods paragraph (copy-ready)</p>
            <p className="mt-2 whitespace-pre-wrap">{methodsText}</p>
          </div>
        ) : null}
        {data.debug ? (
          <div className="mt-4 rounded border border-bloom-brown/20 bg-bloom-cream/30 p-3 font-mono text-[0.7rem] leading-relaxed text-bloom-ink dark:bg-bloom-brown/25 dark:text-bloom-cream print:border-black print:bg-transparent print:text-black">
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
      </section>

      {/* Study area */}
      <section className="report-section mt-8 print:break-inside-avoid">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          3. Study area reference
        </h2>
        <div className="mt-4 space-y-2 text-sm text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          {data.cadastre ? (
            <>
              <p>{data.cadastre.note}</p>
              <p>
                <strong>Approximate centroid (WGS84 / EPSG:4326):</strong> latitude {data.cadastre.centroidLat.toFixed(6)},
                longitude {data.cadastre.centroidLng.toFixed(6)} (decimal degrees).
              </p>
              <p className="break-all text-xs text-bloom-brown/80 dark:text-bloom-cream/70 print:text-black">
                Orientation map (third party): {data.cadastre.openMapUrl}
              </p>
            </>
          ) : (
            <p>No centroid metadata was stored for this run.</p>
          )}
        </div>
      </section>

      {/* Results table - all layers */}
      <section className="report-section mt-8 print:break-before-auto">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          4. Spatial intersection results
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          Table 1 summarises every layer interrogated. &ldquo;Intersecting features&rdquo; is the count returned by the
          map service for the AOI; it is not necessarily a count of distinct on-ground values where features fragment or
          overlap.
        </p>

        <div className="mt-4 overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-bloom-brown/25 text-left text-xs dark:border-bloom-gold/30 print:border-black print:text-[9pt]">
            <thead>
              <tr className="bg-bloom-cream/60 dark:bg-bloom-brown/30 print:bg-neutral-200">
                <th className="border border-bloom-brown/25 px-2 py-2 font-semibold dark:border-bloom-gold/30 print:border-black">
                  Layer
                </th>
                <th className="border border-bloom-brown/25 px-2 py-2 font-semibold dark:border-bloom-gold/30 print:border-black">
                  Theme
                </th>
                <th className="border border-bloom-brown/25 px-2 py-2 font-semibold dark:border-bloom-gold/30 print:border-black">
                  Tier
                </th>
                <th className="border border-bloom-brown/25 px-2 py-2 font-semibold dark:border-bloom-gold/30 print:border-black">
                  Count
                </th>
                <th className="border border-bloom-brown/25 px-2 py-2 font-semibold dark:border-bloom-gold/30 print:border-black">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.layers.map((layer) => (
                <ResultTableRow key={layer.catalogId} layer={layer} />
              ))}
            </tbody>
          </table>
        </div>

        {hits.length > 0 ? (
          <>
            <h3 className="font-display mt-8 text-base font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">
              4.1 Narrative summary of layers with intersections
            </h3>
            <p className="mt-2 text-sm text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
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
          <p className="mt-4 text-sm italic text-bloom-brown/85 dark:text-bloom-cream/75 print:text-black">
            No layers returned a positive intersection for this AOI under the current configuration.
          </p>
        ) : null}

        {noHitLayers.length > 0 && hits.length > 0 ? (
          <>
            <h3 className="font-display mt-8 text-base font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">
              4.2 Layers with no intersection (nil return)
            </h3>
            <p className="mt-2 text-sm text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
              The following configured layers returned zero intersecting features for the AOI (nil spatial overlap in the
              source data at the query scale):
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-bloom-brown/90 dark:text-bloom-cream/80 print:text-black">
              {noHitLayers.map((l) => (
                <li key={l.catalogId}>{l.name}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* Further assessment */}
      <section className="report-section mt-10 print:break-inside-avoid">
        <h2 className="font-display border-b border-bloom-brown/25 pb-1 text-lg font-semibold text-bloom-ink dark:text-bloom-cream print:border-black print:text-base">
          5. Further assessment and statutory registers
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          <p>
            Where development may affect matters of national environmental significance, proponents typically use the
            Commonwealth Protected Matters Search Tool (PMST) and seek advice under the <em>Environment Protection and
            Biodiversity Conservation Act 1999</em> framework. For Queensland biodiversity and MSES products, Biomaps,
            Queensland Globe, and agency databases may be used in addition to this screening.
          </p>
          <p className="rounded border border-amber-200/80 bg-amber-50/90 p-3 text-bloom-ink dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-bloom-cream print:border-black print:bg-neutral-100 print:text-black">
            <strong>Spot-check in Queensland Globe:</strong> for any layer outcome that could change a project decision,
            confirm intersections visually in Globe (or the source MapServer) at an appropriate scale and with your
            authoritative site boundary — automated intersection alone is not a substitute for visual verification.
          </p>
        </div>

        {data.consultantWorkflow ? (
          <div className="mt-4 rounded border border-bloom-brown/20 bg-bloom-cream/30 p-4 text-sm dark:bg-bloom-brown/20 print:border-black print:bg-transparent">
            <p className="font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">Workflow links (centroid-assisted)</p>
            <p className="mt-2 text-bloom-brown/90 dark:text-bloom-cream/80 print:text-black">{data.consultantWorkflow.summary}</p>
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

        {data.registerHints && data.registerHints.length > 0 ? (
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
            {data.registerHints.map((h) => (
              <li key={h.id}>
                <span className="font-semibold">{h.title}</span> - {h.description}{" "}
                <span className="break-all text-xs text-bloom-brown/80 dark:text-bloom-cream/70">({h.url})</span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {/* Disclaimer */}
      <section className="report-section mt-10 border-t-2 border-bloom-brown/30 pt-6 text-xs leading-relaxed text-bloom-brown/90 dark:border-bloom-gold/30 dark:text-bloom-cream/75 print:border-black print:text-[9pt] print:text-black">
        <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">
          6. Limitations and disclaimer
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            Mapped data are sourced from third-party services; currency, scale, positional accuracy, and completeness
            are not warranted by this tool.
          </li>
          <li>
            Aboriginal and Torres Strait Islander cultural heritage is not fully captured in spatial databases; a duty
            of care applies irrespective of this report.
          </li>
          <li>
            Local planning scheme overlays, infrastructure charges, bushfire construction requirements, and other
            non-catalogued constraints may still apply.
          </li>
          <li>
            This report is prepared by automated intersection only. It must be reviewed by a suitably qualified
            environmental practitioner before reliance in a statutory or commercial context.
          </li>
        </ul>
      </section>

      <footer className="report-section mt-8 border-t border-bloom-brown/20 pt-4 text-center text-[0.65rem] text-bloom-brown/60 dark:border-bloom-gold/25 dark:text-bloom-cream/50 print:border-black print:text-black">
        Generated by QLD Environmental Screening (Bloom Foundry prototype)
        {data.audit?.appVersion ? ` · v${data.audit.appVersion}` : ""}
        {data.audit?.catalogFingerprint ? ` · ${data.audit.catalogFingerprint}` : ""}. Not for statutory notification unless
        endorsed.
      </footer>
    </article>
  );
}

function ResultTableRow({ layer }: { layer: LayerScreeningResult }) {
  let status = "OK";
  if (layer.error) status = "Query error";
  else if (layer.exceededTransferLimit) status = "Capped / partial";

  return (
    <tr className="align-top print:break-inside-avoid">
      <td className="border border-bloom-brown/25 px-2 py-1.5 dark:border-bloom-gold/30 print:border-black">{layer.name}</td>
      <td className="border border-bloom-brown/25 px-2 py-1.5 dark:border-bloom-gold/30 print:border-black">
        {domainLabel(layer.domain)}
      </td>
      <td className="border border-bloom-brown/25 px-2 py-1.5 dark:border-bloom-gold/30 print:border-black">{layer.tier}</td>
      <td className="border border-bloom-brown/25 px-2 py-1.5 tabular-nums dark:border-bloom-gold/30 print:border-black">
        {layer.featureCount}
      </td>
      <td className="border border-bloom-brown/25 px-2 py-1.5 dark:border-bloom-gold/30 print:border-black">{status}</td>
    </tr>
  );
}

function HitDetail({ layer }: { layer: LayerScreeningResult }) {
  const g = GLOSSARY[layer.glossaryKey];
  return (
    <li className="text-bloom-ink dark:text-bloom-cream print:text-black">
      <p className="font-semibold">{layer.name}</p>
      <p className="text-xs text-bloom-brown/75 dark:text-bloom-cream/65 print:text-black">
        {domainLabel(layer.domain)} | {tierLabel(layer.tier)} | Features intersecting: {layer.featureCount}
      </p>
      {layer.exceededTransferLimit ? (
        <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200 print:text-black">
          Server transfer limit may apply; feature list may be incomplete.
        </p>
      ) : null}
      {layer.error ? <p className="mt-1 text-xs text-red-700 dark:text-red-300 print:text-black">Error: {layer.error}</p> : null}
      {g ? (
        <div className="mt-2 text-bloom-brown/95 dark:text-bloom-cream/85 print:text-black">
          <p className="italic">{g.title}</p>
          <p className="mt-1">{g.summary}</p>
          <p className="mt-1 text-bloom-brown/85 dark:text-bloom-cream/75 print:text-black">
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
      <p className="mt-2 text-xs text-bloom-brown/65 dark:text-bloom-cream/55 print:text-black">Source: {layer.attribution}</p>
      <details className="mt-2 print:hidden">
        <summary className="cursor-pointer text-xs text-bloom-brown/70">Sample attributes (first records)</summary>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-bloom-cream/80 p-2 font-mono text-[0.65rem] text-bloom-ink dark:bg-bloom-brown/40 dark:text-bloom-cream">
          {JSON.stringify(layer.features.slice(0, 5), null, 2)}
        </pre>
      </details>
      <pre className="mt-2 hidden max-h-48 overflow-hidden rounded border border-bloom-brown/20 bg-neutral-50 p-2 font-mono text-[0.6rem] print:block print:break-inside-avoid print:text-black">
        {JSON.stringify(layer.features.slice(0, 3), null, 2)}
      </pre>
    </li>
  );
}
