"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bbox } from "@turf/turf";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import type {
  LgaId,
  OffsetMatterType,
  ProjectMetadata,
  ScreenResponse,
  ScreeningMode,
  StoredScreeningSession,
} from "@/types/screening";
import glossary from "@/data/glossary.json";

import "maplibre-gl/dist/maplibre-gl.css";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";

import { bufferAoiMeters } from "@/lib/aoi-buffer";
import { layersToCsv } from "@/lib/csv-export";
import { buildMethodsParagraph } from "@/lib/methods-blurb";
import { parseBoundaryFile } from "@/lib/parse-boundary-file";
import { fetchScreeningNdjsonStream } from "@/lib/screening-stream-client";
import {
  loadProjectFieldsFromStorage,
  saveProjectFieldsToStorage,
  SCREENING_STORAGE_KEY,
  SNAPSHOT_A_KEY,
  SNAPSHOT_B_KEY,
} from "@/lib/screening-storage";
import { ConsultantChecklist } from "@/components/map/ConsultantChecklist";
import { SidebarSection } from "@/components/ui/SidebarSection";
import { FieldLabel, PremiumDateInput, PremiumInput, PremiumSelect } from "@/components/ui/PremiumField";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Tabs } from "@/components/ui/Tabs";
import { SummaryStatCard } from "@/components/ui/SummaryStatCard";
import { EmptyState } from "@/components/ui/EmptyState";
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultProject(): ProjectMetadata {
  return {
    clientName: "",
    jobId: "",
    siteName: "",
    analyst: "",
    reportDate: todayIsoDate(),
  };
}

export function MapScreen() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** Suppresses draw.create handler when we programmatically add an uploaded polygon. */
  const suppressDrawSourceRef = useRef(false);

  const [lga, setLga] = useState<LgaId>("qld");
  const [mode, setMode] = useState<ScreeningMode>("standard");
  const [offsetMatterType, setOffsetMatterType] = useState<OffsetMatterType>("manual_review_required");
  const [bufferMeters, setBufferMeters] = useState(0);
  const [project, setProject] = useState<ProjectMetadata>(defaultProject);
  const [aoiSource, setAoiSource] = useState<NonNullable<StoredScreeningSession["aoiSource"]>>("draw");
  const [basemap, setBasemap] = useState<"streets" | "imagery">("streets");
  const [mapReady, setMapReady] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [streamProgress, setStreamProgress] = useState<{ current: number; total: number } | null>(null);

  const [status, setStatus] = useState<string>("Draw a polygon on the map or upload GeoJSON to represent your site.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenResponse | null>(null);
  const [lastSession, setLastSession] = useState<StoredScreeningSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<"summary" | "constraints" | "mnes" | "report">("summary");
  const [mapSnapshotDataUrl, setMapSnapshotDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadProjectFieldsFromStorage();
    if (saved && Object.keys(saved).length > 0) {
      setProject((p) => ({ ...p, ...saved, reportDate: saved.reportDate ?? p.reportDate }));
    }
  }, []);

  useEffect(() => {
    saveProjectFieldsToStorage(project);
  }, [project]);

  useEffect(() => {
    // Keep packs aligned with review mode (dedicated offset pack).
    if (mode === "offset" && lga !== "qld_offset") {
      setLga("qld_offset");
    }
    if (mode === "standard" && lga === "qld_offset") {
      setLga("qld");
    }
  }, [mode, lga]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const rasterStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "(c) OpenStreetMap contributors",
        },
        esri: {
          type: "raster",
          tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Esri, Maxar, Earthstar Geographics",
        },
      },
      layers: [
        { id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 22, layout: { visibility: "visible" } },
        {
          id: "esri-imagery",
          type: "raster",
          source: "esri",
          minzoom: 0,
          maxzoom: 22,
          layout: { visibility: "none" },
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapEl.current,
      style: rasterStyle,
      center: [153.0251, -27.4705],
      zoom: 10.5,
      preserveDrawingBuffer: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      // Draw actions are rendered in the sidebar (not as on-map buttons).
      controls: {},
      defaultMode: "simple_select",
    });

    map.addControl(draw as unknown as maplibregl.IControl, "top-left");
    drawRef.current = draw;
    mapRef.current = map;

    const syncHint = () => {
      const fc = draw.getAll();
      const n = fc.features.filter((f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon").length;
      if (n === 0) {
        setStatus("Draw a polygon, search a Queensland address for the lot boundary, or upload a boundary file.");
      } else {
        setStatus("Polygon ready. Choose buffer if needed, then run screening.");
      }
    };

    const onDrawCreate = () => {
      syncHint();
      if (!suppressDrawSourceRef.current) {
        setAoiSource("draw");
      }
    };
    map.on("draw.create", onDrawCreate);
    map.on("draw.update", () => {
      syncHint();
      if (!suppressDrawSourceRef.current) {
        setAoiSource("draw");
      }
    });
    map.on("draw.delete", syncHint);

    const resizeMap = () => {
      map.resize();
    };
    map.once("load", () => {
      resizeMap();
      requestAnimationFrame(resizeMap);
      setMapReady(true);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapEl.current);

    return () => {
      ro.disconnect();
      drawRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map?.isStyleLoaded()) return;
    map.setLayoutProperty("osm", "visibility", basemap === "streets" ? "visible" : "none");
    map.setLayoutProperty("esri-imagery", "visibility", basemap === "imagery" ? "visible" : "none");
  }, [basemap, mapReady]);

  const getAoiFeature = useCallback((): Feature<Polygon | MultiPolygon> | null => {
    const draw = drawRef.current;
    if (!draw) return null;
    const fc = draw.getAll();
    const poly = fc.features.find(
      (f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
    );
    if (!poly || !poly.geometry) return null;
    return {
      type: "Feature",
      geometry: poly.geometry as Polygon | MultiPolygon,
      properties: poly.properties ?? {},
    };
  }, []);

  const fitMapToFeature = useCallback((feature: Feature<Polygon | MultiPolygon>) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const [minX, minY, maxX, maxY] = bbox(feature);
      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 48, maxZoom: 17, duration: 600 },
      );
    } catch {
      // ignore
    }
  }, []);

  const onBoundaryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    const draw = drawRef.current;
    if (!draw) return;
    try {
      const { feature, kind } = await parseBoundaryFile(file);
      draw.deleteAll();
      suppressDrawSourceRef.current = true;
      draw.add(feature as GeoJSON.Feature);
      setAoiSource(kind);
      setTimeout(() => {
        suppressDrawSourceRef.current = false;
      }, 0);
      fitMapToFeature(feature);
      setStatus("Boundary loaded on map. Adjust buffer if needed, then run screening.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    }
  };

  const onAddressParcelSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    const draw = drawRef.current;
    if (!draw) return;
    const q = addressQuery.trim();
    if (!q) {
      setAddressError("Enter a Queensland street address.");
      return;
    }
    setAddressLoading(true);
    try {
      const res = await fetch("/api/address-parcel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: q }),
      });
      const json = (await res.json()) as {
        error?: string;
        feature?: Feature<Polygon | MultiPolygon>;
        parcelSummary?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? res.statusText);
      }
      if (!json.feature || !json.feature.geometry) {
        throw new Error("Invalid response from address lookup.");
      }
      draw.deleteAll();
      suppressDrawSourceRef.current = true;
      draw.add(json.feature as GeoJSON.Feature);
      setTimeout(() => {
        suppressDrawSourceRef.current = false;
      }, 0);
      setAoiSource("address");
      fitMapToFeature(json.feature as Feature<Polygon | MultiPolygon>);
      setStatus(
        `Parcel boundary loaded (${json.parcelSummary ?? "QLD DCDB"}). Indicative only—not a surveyed title boundary. Adjust buffer if needed, then run screening.`,
      );
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddressLoading(false);
    }
  };

  const runScreen = async () => {
    setError(null);
    setCopyMsg(null);
    const rawAoi = getAoiFeature();
    if (!rawAoi) {
      setError("Draw or upload a polygon first.");
      return;
    }

    let aoi = rawAoi;
    try {
      aoi = bufferMeters > 0 ? bufferAoiMeters(rawAoi, bufferMeters) : rawAoi;
    } catch (be) {
      setError(be instanceof Error ? be.message : "Buffer failed.");
      return;
    }

    setLoading(true);
    setResult(null);
    setStreamProgress(null);
    try {
      let data: ScreenResponse;

      if (useStreaming) {
        data = await fetchScreeningNdjsonStream(
          { aoi, lga },
          {
            onStart: (total) => {
              setStreamProgress({ current: 0, total });
              setResult({
                generatedAt: new Date().toISOString(),
                layers: [],
              } as ScreenResponse);
            },
            onLayer: (layer, index, totalLayers) => {
              setStreamProgress({ current: index + 1, total: totalLayers });
              setResult((prev) => ({
                ...(prev as ScreenResponse),
                layers: [...(prev?.layers ?? []), layer],
              }));
            },
          },
        );
        setResult(data);
      } else {
        const res = await fetch("/api/screen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aoi, lga }),
        });
        const json = (await res.json()) as ScreenResponse & { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? res.statusText);
        }
        data = json as ScreenResponse;
        setResult(data);
      }

      const session: StoredScreeningSession = {
        screen: data,
        project,
        bufferMeters,
        aoiSource,
        mode,
        offsetMatterType: mode === "offset" ? offsetMatterType : undefined,
      };
      setLastSession(session);
      try {
        sessionStorage.setItem(SCREENING_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
      setStatus("Screening complete. Review results, export data, or open the written report.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setStreamProgress(null);
    }
  };

  const saveSnapshot = (slot: "a" | "b") => {
    const session =
      lastSession ??
      (result
        ? ({ screen: result, project, bufferMeters, aoiSource } as StoredScreeningSession)
        : null);
    if (!session) {
      setError("Run a screening first, then save a snapshot.");
      return;
    }
    try {
      const key = slot === "a" ? SNAPSHOT_A_KEY : SNAPSHOT_B_KEY;
      sessionStorage.setItem(key, JSON.stringify(session));
      setCopyMsg(`Snapshot ${slot.toUpperCase()} saved. Open Compare to view side by side.`);
      setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setError("Could not save snapshot.");
    }
  };

  const copyMethods = async () => {
    if (!result) return;
    const text = buildMethodsParagraph(result, { bufferMeters, aoiSource, project });
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Methods paragraph copied.");
      setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setCopyMsg("Could not copy (browser blocked).");
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const blob = new Blob([layersToCsv(result.layers)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `screening-layers-${result.generatedAt.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadSessionJson = () => {
    const session =
      lastSession ??
      (result
        ? ({
            screen: result,
            project,
            bufferMeters,
            aoiSource,
          } as StoredScreeningSession)
        : null);
    if (!session) return;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `screening-session-${session.screen.generatedAt.slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hits = result?.layers.filter((l) => l.featureCount > 0) ?? [];
  const layerErrors = result?.layers.filter((l) => l.error) ?? [];

  const updateProject = (patch: Partial<ProjectMetadata>) => {
    setProject((p) => ({ ...p, ...patch }));
  };

  const aoiReady = Boolean(getAoiFeature());
  const hitLayers = result?.layers.filter((l) => l.featureCount > 0) ?? [];
  const totalHits = hitLayers.length;
  const totalFeatures = result?.layers.reduce((s, l) => s + l.featureCount, 0) ?? 0;
  const errorCount = layerErrors.length;
  const offsetGrouped = mode === "offset" && result ? groupOffsetLayers(result.layers) : null;
  const fatalCount = offsetGrouped ? offsetGrouped.filter((x) => x.severity === "fatal" && x.layer.featureCount > 0 && !x.layer.error).length : 0;
  const riskCount = offsetGrouped ? offsetGrouped.filter((x) => x.severity === "risk" && x.layer.featureCount > 0 && !x.layer.error).length : 0;
  const positiveCount = offsetGrouped ? offsetGrouped.filter((x) => x.severity === "positive" && x.layer.featureCount > 0 && !x.layer.error).length : 0;
  const coverageAudit =
    mode === "offset" && result
      ? auditOffsetCoverage(result.layers.map((l) => ({ glossaryKey: l.glossaryKey, domain: l.domain })))
      : null;
  const suitability =
    mode === "offset" && offsetGrouped
      ? evaluateOffsetSuitability(offsetGrouped, offsetMatterType)
      : null;

  const clearAoi = () => {
    drawRef.current?.deleteAll();
    setStatus("AOI cleared. Add an address, draw a polygon, or upload a boundary to begin.");
    setResult(null);
    setLastSession(null);
    setError(null);
  };

  const startDrawPolygon = () => {
    const draw = drawRef.current;
    if (!draw) return;
    try {
      draw.changeMode("draw_polygon");
      setStatus("Draw your AOI on the map. Click to add vertices, then click the first point to finish.");
      setAoiSource("draw");
    } catch {
      // ignore
    }
  };

  const deleteSelected = () => {
    const draw = drawRef.current;
    if (!draw) return;
    try {
      draw.trash();
      setStatus("Selection deleted. Draw or upload a boundary to continue.");
    } catch {
      // ignore
    }
  };

  const recenter = () => {
    const f = getAoiFeature();
    if (f) fitMapToFeature(f);
  };

  const exportMapSnapshot = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const url = map.getCanvas().toDataURL("image/png");
      setMapSnapshotDataUrl(url);
      const session =
        lastSession ??
        (result ? ({ screen: result, project, bufferMeters, aoiSource } as StoredScreeningSession) : null);
      if (session) {
        const next: StoredScreeningSession = {
          ...session,
          mode,
          offsetMatterType: mode === "offset" ? offsetMatterType : undefined,
          mapSnapshotDataUrl: url,
        };
        setLastSession(next);
        try {
          sessionStorage.setItem(SCREENING_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      setCopyMsg("Map snapshot captured for the report.");
      setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setCopyMsg("Could not capture map image.");
      setTimeout(() => setCopyMsg(null), 2500);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[400px_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100vh-6.25rem)] lg:overflow-auto">
        <div className="space-y-3">
          <div className="rounded-[16px] border border-border bg-bg-panel/65 p-4 shadow-[0_14px_32px_rgba(2,6,23,0.16)] ring-1 ring-brand-primary/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-bg-soft">Desktop screening workspace</p>
                <p className="mt-1 text-xs leading-snug text-bg-soft/65">
                  Add an AOI, choose a pack, then run screening. Use results as a triage aid—verify in authoritative mapping.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {aoiReady ? <StatusChip tone="brand">AOI ready</StatusChip> : <StatusChip>AOI needed</StatusChip>}
                {result ? <StatusChip tone={errorCount ? "warn" : "good"}>Run complete</StatusChip> : <StatusChip>Not run</StatusChip>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip tone="neutral">{aoiSource === "address" ? "AOI: parcel" : aoiSource === "draw" ? "AOI: drawn" : `AOI: ${aoiSource}`}</StatusChip>
              <StatusChip tone="neutral">{bufferMeters > 0 ? `Buffer: ${bufferMeters} m` : "Buffer: none"}</StatusChip>
              <StatusChip tone="neutral">Pack: {lga}</StatusChip>
            </div>
            {status ? <p className="mt-3 text-xs text-bg-soft/65">{status}</p> : null}
            {streamProgress ? (
              <p className="mt-2 text-xs font-semibold text-bg-soft/75">
                Screening progress: {streamProgress.current} / {streamProgress.total} layers
              </p>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-[14px] border border-danger/40 bg-danger/10 p-3 text-sm text-bg-soft" role="alert">
                <p className="font-semibold">Couldn’t run screening</p>
                <p className="mt-1 text-sm text-bg-soft/75">{error}</p>
              </div>
            ) : null}
          </div>

          <SidebarSection
            title="Review mode"
            description="Choose a workflow. Offset mode groups results and applies desktop-review logic."
          >
            <div className="grid gap-3">
              <div>
                <FieldLabel label="Mode" />
                <PremiumSelect
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ScreeningMode)}
                >
                  <option value="standard">Standard site screening</option>
                  <option value="offset">Offset site desktop review (QLD)</option>
                </PremiumSelect>
              </div>

              {mode === "offset" ? (
                <div>
                  <FieldLabel
                    label="Impacted matter type (assumption)"
                    hint="Used to frame suitability checks. This does not replace policy interpretation."
                  />
                  <PremiumSelect
                    value={offsetMatterType}
                    onChange={(e) => setOffsetMatterType(e.target.value as OffsetMatterType)}
                  >
                    <option value="manual_review_required">Manual review required (generic)</option>
                    <option value="regional_ecosystem">Regional ecosystem offsets</option>
                    <option value="wetland">Wetland offsets</option>
                    <option value="connectivity">Connectivity offsets</option>
                    <option value="threatened_species_habitat">Threatened species / habitat</option>
                    <option value="koala">Koala-related</option>
                    <option value="protected_area_related">Protected area-related</option>
                  </PremiumSelect>
                </div>
              ) : null}

              {mode === "offset" ? (
                <div className="rounded-[14px] border border-border bg-surface/5 p-3 text-xs leading-relaxed text-bg-soft/70">
                  <p className="font-semibold text-bg-soft/85">Offset site objective</p>
                  <p className="mt-1">
                    Screens for constraints, legal-security risks, delivery risks, and suitability indicators.
                    Some checks (bioregion/subregion matching, council overlays, tenure/easements) may still require manual confirmation.
                  </p>
                </div>
              ) : null}
            </div>
          </SidebarSection>

          <SidebarSection
            title="1. Project details"
            description="Optional filing fields used in the report cover."
          >
            <div className="grid gap-3">
              <div>
                <FieldLabel label="Client" />
                <PremiumInput
                  value={project.clientName}
                  onChange={(e) => updateProject({ clientName: e.target.value })}
                  placeholder="e.g. Acme Developments Pty Ltd"
                />
              </div>
              <div>
                <FieldLabel label="Site / project name" />
                <PremiumInput
                  value={project.siteName}
                  onChange={(e) => updateProject({ siteName: e.target.value })}
                  placeholder="e.g. Smith Road industrial lots"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Job / file ID" />
                  <PremiumInput
                    value={project.jobId}
                    onChange={(e) => updateProject({ jobId: e.target.value })}
                    placeholder="Internal reference"
                  />
                </div>
                <div>
                  <FieldLabel label="Report date" />
                  <PremiumDateInput
                    value={project.reportDate}
                    onChange={(e) => updateProject({ reportDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <FieldLabel label="Analyst" />
                <PremiumInput
                  value={project.analyst}
                  onChange={(e) => updateProject({ analyst: e.target.value })}
                  placeholder="Name"
                />
              </div>
            </div>
          </SidebarSection>

          <SidebarSection
            title="2. Area of interest (AOI)"
            description="Start with an address/parcel, upload a boundary file, or draw directly on the map."
            rightSlot={
              aoiReady ? (
                <button type="button" onClick={clearAoi} className="focus-ring rounded-full px-2 py-1 text-xs font-semibold text-bg-soft/70 hover:bg-surface/10 hover:text-bg-soft">
                  Clear
                </button>
              ) : null
            }
          >
            <div className="grid gap-2">
              <Button type="button" variant="primary" onClick={startDrawPolygon} disabled={!mapReady}>
                Draw polygon on map
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={deleteSelected} disabled={!mapReady}>
                  Delete selected
                </Button>
                <Button type="button" variant="danger" onClick={clearAoi} disabled={!mapReady || !aoiReady}>
                  Clear AOI
                </Button>
              </div>
              <p className="text-xs leading-snug text-bg-soft/60">
                Tip: click to place vertices, then click the first point to finish. You can select and adjust vertices after drawing.
              </p>
            </div>

            <form onSubmit={onAddressParcelSearch} className="mt-4 grid gap-3">
              <div>
                <FieldLabel
                  label="Queensland address → indicative parcel boundary"
                  hint="Loads the QLD DCDB parcel containing the geocoded address point."
                />
                <PremiumInput
                  id="address-parcel"
                  type="text"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  disabled={addressLoading}
                  autoComplete="street-address"
                  placeholder="e.g. 12 Queen St, Brisbane QLD"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={addressLoading}
              >
                {addressLoading ? "Looking up…" : "Load parcel boundary"}
              </Button>
              {addressError ? (
                <p className="text-xs text-danger" role="alert">
                  {addressError}
                </p>
              ) : (
                <p className="text-xs leading-snug text-bg-soft/60">
                  Indicative only—not a surveyed title boundary. Verify against cadastral and survey data for decisions.
                </p>
              )}
            </form>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.geojson,.kml,.kmz,.zip,application/geo+json,application/vnd.google-earth.kml+xml"
              className="hidden"
              onChange={onBoundaryFile}
            />
            <div className="mt-4 grid gap-2">
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload boundary file
              </Button>
              {uploadError ? (
                <p className="text-xs text-danger" role="alert">
                  {uploadError}
                </p>
              ) : (
                <p className="text-xs leading-snug text-bg-soft/60">
                  Supported: GeoJSON, KML, KMZ, or shapefile (.zip). WGS84 preferred.
                </p>
              )}
            </div>
          </SidebarSection>

          <SidebarSection
            title="3. Basemap & display"
            description="Presentation settings only—does not affect the screening logic."
            defaultOpen={false}
          >
            <div className="grid gap-3">
              <div>
                <FieldLabel label="Basemap" />
                <PremiumSelect value={basemap} onChange={(e) => setBasemap(e.target.value as "streets" | "imagery")}>
                  <option value="streets">OpenStreetMap (streets)</option>
                  <option value="imagery">Esri World Imagery</option>
                </PremiumSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Buffer (metres)" hint="Applied to the AOI before querying." />
                  <PremiumSelect value={bufferMeters} onChange={(e) => setBufferMeters(Number(e.target.value))}>
                    <option value={0}>None</option>
                    <option value={10}>10 m</option>
                    <option value={25}>25 m</option>
                    <option value={50}>50 m</option>
                    <option value={100}>100 m</option>
                  </PremiumSelect>
                </div>
                <div>
                  <FieldLabel label="Study area pack" hint="Change pack then re-run—no redraw needed." />
                  <PremiumSelect value={lga} onChange={(e) => setLga(e.target.value as LgaId)}>
                    {mode === "offset" ? (
                      <option value="qld_offset">Queensland — offset desktop review pack</option>
                    ) : (
                      <>
                        <option value="qld">Queensland (statewide)</option>
                        <option value="brisbane">Brisbane / SEQ — flood overlays</option>
                        <option value="gold_coast">Gold Coast label — SEQ flood overlays</option>
                        <option value="sunshine_coast">Sunshine Coast label — SEQ flood overlays</option>
                        <option value="cairns">Cairns — regional pack</option>
                      </>
                    )}
                  </PremiumSelect>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface/5 px-3 py-2 text-sm">
                <span className="text-sm font-semibold text-bg-soft/80">Progressive results</span>
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  style={{ accentColor: "var(--brand-primary)" }}
                  className="h-4 w-4"
                />
              </label>
              <p className="text-xs leading-snug text-bg-soft/60">
                Streams layer results as they complete. Useful for long runs, especially on large AOIs.
              </p>
            </div>
          </SidebarSection>

          <SidebarSection
            title="4. Run screening"
            description="Primary action. Uses AOI (plus optional buffer) to query the selected pack."
          >
            <div className="grid gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={runScreen}
                disabled={loading || !aoiReady}
              >
                {loading ? "Running screening…" : "Run screening"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={runScreen}
                disabled={loading || !aoiReady}
              >
                Re-run (same AOI)
              </Button>
              {!aoiReady ? (
                <p className="text-xs leading-snug text-bg-soft/60">
                  Add an address, parcel, or uploaded boundary to begin screening.
                </p>
              ) : null}
            </div>
          </SidebarSection>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="rounded-[18px] border border-border bg-bg-panel/45 shadow-[0_14px_32px_rgba(2,6,23,0.16)] ring-1 ring-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-sm font-semibold text-bg-soft">Map workspace</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" onClick={recenter} disabled={!aoiReady}>
                Recenter
              </Button>
              <Button size="sm" variant="ghost" onClick={exportMapSnapshot} disabled={!mapReady}>
                Capture for report
              </Button>
              <Button size="sm" variant="ghost" onClick={clearAoi} disabled={!aoiReady}>
                Clear AOI
              </Button>
            </div>
          </div>
          <div className="relative h-[58vh] min-h-[420px] overflow-hidden rounded-b-[18px]">
            <div ref={mapEl} className="absolute inset-0 h-full w-full [&_.maplibregl-canvas]:outline-none" />

            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              {aoiReady ? <StatusChip tone="brand">AOI loaded</StatusChip> : <StatusChip>AOI needed</StatusChip>}
              <StatusChip>{bufferMeters > 0 ? `Buffer: ${bufferMeters} m` : "No buffer"}</StatusChip>
              {result ? (
                <StatusChip tone={errorCount ? "warn" : totalHits ? "good" : "neutral"}>
                  {errorCount ? `${errorCount} error(s)` : totalHits ? `${totalHits} hit layer(s)` : "No hits"}
                </StatusChip>
              ) : (
                <StatusChip>Not run</StatusChip>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border border-border bg-bg-panel/45 p-4 shadow-[0_14px_32px_rgba(2,6,23,0.16)] ring-1 ring-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-bg-soft">Results</p>
              <p className="mt-1 text-xs text-bg-soft/60">
                Run screening to populate results. Use the report tab to export a deliverable PDF.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => saveSnapshot("a")} disabled={!result}>
                Save snapshot A
              </Button>
              <Button size="sm" variant="secondary" onClick={() => saveSnapshot("b")} disabled={!result}>
                Save snapshot B
              </Button>
              <Button size="sm" variant="secondary" onClick={downloadCsv} disabled={!result}>
                CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={downloadSessionJson} disabled={!result}>
                Session JSON
              </Button>
              <Button size="sm" variant="secondary" onClick={copyMethods} disabled={!result}>
                Methods
              </Button>
            </div>
          </div>

          {copyMsg ? <p className="mt-2 text-xs text-bg-soft/70">{copyMsg}</p> : null}

          {layerErrors.length > 0 ? (
            <div className="mt-4 rounded-[14px] border border-warning/45 bg-warning/10 p-3 text-sm text-bg-soft" role="alert">
              <p className="font-semibold">{layerErrors.length} layer query issue(s)</p>
              <p className="mt-1 text-sm text-bg-soft/75">
                Some layers returned an error. Treat outputs as incomplete until re-run successfully.
              </p>
            </div>
          ) : null}

          {!result ? (
            <div className="mt-4">
              <EmptyState
                title="Run screening to see results"
                description="Add an address, parcel, or uploaded boundary to begin. Then run screening to summarise state and Commonwealth workflow flags here."
                action={<Button variant="primary" onClick={runScreen} disabled={!aoiReady || loading}>{loading ? "Running…" : "Run screening"}</Button>}
              />
            </div>
          ) : (
            <div className="mt-4">
              <Tabs
                tabs={[
                  { id: "summary", label: "Summary", rightSlot: <span className="tabular-nums">{totalHits}</span> },
                  { id: "constraints", label: "Layers / constraints" },
                  { id: "mnes", label: "PMST / MNES" },
                  { id: "report", label: "Report" },
                ]}
                active={activeResultsTab}
                onChange={setActiveResultsTab}
              />

              {activeResultsTab === "summary" ? (
                mode === "offset" ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-4">
                    <SummaryStatCard
                      label="Fatal flaws"
                      value={fatalCount}
                      hint="Potential deal-breakers for offset availability."
                      icon={<FlagIcon />}
                    />
                    <SummaryStatCard
                      label="Key constraints"
                      value={riskCount}
                      hint="Statutory/legal/delivery risks with hits."
                      icon={<LayersIcon />}
                    />
                    <SummaryStatCard
                      label="Suitability signals"
                      value={positiveCount}
                      hint="Layers suggesting potential matter presence/capacity."
                      icon={<LeafIcon />}
                    />
                    <SummaryStatCard
                      label="Suitability rating"
                      value={suitability?.rating ?? "—"}
                      hint={mode === "offset" ? `Matter type: ${matterLabel(offsetMatterType)}` : undefined}
                      icon={<ShieldIcon />}
                    />
                    {coverageAudit ? (
                      <div className="lg:col-span-4 mt-1 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                          <p className="text-sm font-semibold text-bg-soft">Enabled families</p>
                          <ul className="mt-2 space-y-1 text-sm text-bg-soft/75">
                            {coverageAudit.enabled.map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-success/80" />
                                <span className="min-w-0">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                          <p className="text-sm font-semibold text-bg-soft">Missing / manual checks</p>
                          <ul className="mt-2 space-y-1 text-sm text-bg-soft/75">
                            {coverageAudit.missing.map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-warning/80" />
                                <span className="min-w-0">{f}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs text-bg-soft/60">
                            Offset desktop review still requires council overlays and authoritative tenure/encumbrance checks.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <SummaryStatCard
                      label="Hit layers"
                      value={totalHits}
                      hint="Layers with one or more intersecting features."
                      icon={<LayersIcon />}
                    />
                    <SummaryStatCard
                      label="Total feature records"
                      value={totalFeatures.toLocaleString()}
                      hint="Sum of returned features across layers (not necessarily distinct on-ground values)."
                      icon={<HashIcon />}
                    />
                    <SummaryStatCard
                      label="Run quality"
                      value={errorCount ? "Review required" : "OK"}
                      hint={errorCount ? "One or more layer queries failed." : "No layer errors detected."}
                      icon={<ShieldIcon />}
                    />
                  </div>
                )
              ) : null}

              {activeResultsTab === "constraints" ? (
                <div className="mt-4">
                  {mode === "offset" && offsetGrouped ? (
                    <div className="space-y-4">
                      {(
                        [
                          "Fatal Flaws",
                          "Statutory Constraints",
                          "Offset Suitability Tests",
                          "Legal Security / Land Availability",
                          "Delivery Risk / Practical Constraints",
                          "Information Only",
                        ] as const
                      ).map((group) => {
                        const items = offsetGrouped.filter((x) => x.group === group);
                        const hitItems = items.filter((x) => x.layer.featureCount > 0 && !x.layer.error);
                        return (
                          <div
                            key={group}
                            className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-bg-soft">{group}</p>
                                <p className="mt-1 text-xs text-bg-soft/60">
                                  {hitItems.length} with hits · {items.length} layers assessed
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {group === "Fatal Flaws" ? <StatusChip tone="danger">Deal-breakers</StatusChip> : null}
                                {group === "Offset Suitability Tests" ? <StatusChip tone="good">Positives</StatusChip> : null}
                                {group === "Information Only" ? <StatusChip>Context</StatusChip> : null}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              {items.map(({ layer, severity, whyItMatters, followUp }) => {
                                const g = GLOSSARY[layer.glossaryKey];
                                const isHit = layer.featureCount > 0;
                                const chipTone =
                                  severity === "fatal"
                                    ? "danger"
                                    : severity === "positive"
                                      ? "good"
                                      : severity === "risk"
                                        ? "warn"
                                        : "neutral";
                                return (
                                  <div
                                    key={layer.catalogId}
                                    className="rounded-[16px] border border-border bg-bg-panel/65 p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-bg-soft">{layer.name}</p>
                                        <p className="mt-1 text-xs text-bg-soft/60">
                                          Tier: <span className="font-semibold text-bg-soft/80">{layer.tier}</span> · Domain{" "}
                                          <span className="font-semibold text-bg-soft/80">{layer.domain}</span>
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {layer.error ? <StatusChip tone="warn">Query error</StatusChip> : null}
                                        {layer.exceededTransferLimit ? <StatusChip tone="warn">Capped</StatusChip> : null}
                                        <StatusChip tone={chipTone}>
                                          {isHit ? `${layer.featureCount} hit` : "No hit"}
                                        </StatusChip>
                                      </div>
                                    </div>

                                    {layer.error ? (
                                      <p className="mt-2 text-xs text-bg-soft/80">{layer.error}</p>
                                    ) : null}

                                    <div className="mt-3 text-sm">
                                      <p className="text-xs font-semibold text-bg-soft/75">Why it matters</p>
                                      <p className="mt-1 text-sm leading-relaxed text-bg-soft/70">{whyItMatters}</p>
                                      <p className="mt-2 text-xs font-semibold text-bg-soft/75">Follow-up</p>
                                      <p className="mt-1 text-sm leading-relaxed text-bg-soft/70">{followUp}</p>
                                    </div>

                                    {g ? (
                                      <div className="mt-3 text-sm">
                                        <p className="text-xs font-semibold text-bg-soft/75">{g.title}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-bg-soft/70">{g.summary}</p>
                                      </div>
                                    ) : null}

                                    <p className="mt-3 text-xs text-bg-soft/45">Source: {layer.attribution}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {result.layers.map((layer) => {
                        const g = GLOSSARY[layer.glossaryKey];
                        const isHit = layer.featureCount > 0;
                        return (
                          <div
                            key={layer.catalogId}
                            className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-bg-soft">{layer.name}</p>
                                <p className="mt-1 text-xs text-bg-soft/60">
                                  Tier: <span className="font-semibold text-bg-soft/80">{layer.tier}</span> · Domain{" "}
                                  <span className="font-semibold text-bg-soft/80">{layer.domain}</span>
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {layer.error ? <StatusChip tone="warn">Query error</StatusChip> : null}
                                {layer.exceededTransferLimit ? <StatusChip tone="warn">Capped</StatusChip> : null}
                                <StatusChip tone={isHit ? "brand" : "neutral"}>
                                  {layer.featureCount} feature{layer.featureCount === 1 ? "" : "s"}
                                </StatusChip>
                              </div>
                            </div>

                            {layer.error ? (
                              <p className="mt-2 text-xs text-bg-soft/80">{layer.error}</p>
                            ) : null}
                            {g ? (
                              <div className="mt-3 text-sm">
                                <p className="text-xs font-semibold text-bg-soft/75">{g.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-bg-soft/70">{g.summary}</p>
                                <p className="mt-2 text-xs text-bg-soft/60">
                                  Next: <span className="font-semibold text-bg-soft/75">{g.nextSteps}</span>
                                </p>
                                {g.references && g.references.length > 0 ? (
                                  <ul className="mt-3 flex flex-wrap gap-2">
                                    {g.references.map((r) => (
                                      <li key={r.url}>
                                        <a
                                          href={r.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="focus-ring inline-flex h-8 items-center rounded-full border border-border bg-surface/10 px-3 text-xs font-semibold text-bg-soft/75 hover:bg-surface/15 hover:text-bg-soft"
                                        >
                                          {r.label}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            ) : null}
                            <p className="mt-3 text-xs text-bg-soft/45">Source: {layer.attribution}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {hits.length === 0 && layerErrors.length === 0 ? (
                    <p className="mt-4 text-sm text-bg-soft/70">
                      No intersecting features were returned for the current AOI and pack.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {activeResultsTab === "mnes" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                    <p className="text-sm font-semibold text-bg-soft">Commonwealth (MNES) workflow</p>
                    <p className="mt-2 text-sm leading-relaxed text-bg-soft/70">
                      This tool screens Queensland spatial layers. For EPBC/MNES matters, use PMST and project-specific advice.
                    </p>
                    {result.consultantWorkflow ? (
                      <div className="mt-3 space-y-2 text-sm">
                        <a
                          href={result.consultantWorkflow.pmstMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring inline-flex w-full items-center justify-between rounded-[14px] border border-border bg-surface/10 px-3 py-2 text-sm font-semibold text-bg-soft hover:bg-surface/15"
                        >
                          Open PMST (centroid assist)
                          <span className="text-bg-soft/55">↗</span>
                        </a>
                        <a
                          href={result.consultantWorkflow.biomapsStoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring inline-flex w-full items-center justify-between rounded-[14px] border border-border bg-surface/10 px-3 py-2 text-sm font-semibold text-bg-soft hover:bg-surface/15"
                        >
                          Queensland Biomaps
                          <span className="text-bg-soft/55">↗</span>
                        </a>
                        <a
                          href={result.consultantWorkflow.planningRegulationPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="focus-ring inline-flex w-full items-center justify-between rounded-[14px] border border-border bg-surface/10 px-3 py-2 text-sm font-semibold text-bg-soft hover:bg-surface/15"
                        >
                          Planning Regulation (Qld) PDF
                          <span className="text-bg-soft/55">↗</span>
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                    <p className="text-sm font-semibold text-bg-soft">Registers & references</p>
                    <p className="mt-2 text-sm leading-relaxed text-bg-soft/70">
                      Not queried spatially here. Use these alongside Globe, scheme mapping, and statutory tests.
                    </p>
                    {result.registerHints && result.registerHints.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {result.registerHints.slice(0, 8).map((h) => (
                          <li key={h.id}>
                            <a
                              href={h.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="focus-ring block rounded-[14px] border border-border bg-surface/10 px-3 py-2 hover:bg-surface/15"
                            >
                              <p className="text-sm font-semibold text-bg-soft">{h.title}</p>
                              <p className="mt-0.5 text-xs leading-snug text-bg-soft/60">{h.description}</p>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-bg-soft/60">No register hints were returned.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {activeResultsTab === "report" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_360px]">
                  <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                    <p className="text-sm font-semibold text-bg-soft">Report readiness</p>
                    <p className="mt-2 text-sm leading-relaxed text-bg-soft/70">
                      The report is designed for a consultant-facing desktop screening note. It includes project metadata, an executive summary, and a tabular layer summary.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mapSnapshotDataUrl || lastSession?.mapSnapshotDataUrl ? (
                        <StatusChip tone="good">Map snapshot captured</StatusChip>
                      ) : (
                        <StatusChip tone="neutral">No map snapshot yet</StatusChip>
                      )}
                      {project.clientName || project.siteName || project.jobId ? (
                        <StatusChip tone="good">Project metadata set</StatusChip>
                      ) : (
                        <StatusChip tone="neutral">Add project details (optional)</StatusChip>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href="/report"
                        className="focus-ring inline-flex h-10 items-center justify-center rounded-[14px] bg-brand-primary px-4 text-sm font-semibold text-brand-dark hover:bg-brand-primary-hover"
                      >
                        Open report preview
                      </a>
                      <Button variant="secondary" onClick={exportMapSnapshot}>
                        Capture map snapshot
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
                    <p className="text-sm font-semibold text-bg-soft">Consultant checklist</p>
                    <div className="mt-3">
                      <ConsultantChecklist embedded />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {result?.audit ? (
            <p className="mt-4 text-xs text-bg-soft/45">
              Audit: {result.audit.layersQueried} layers · pack {result.audit.lga}
              {result.audit.appVersion ? ` · v${result.audit.appVersion}` : ""}
              {result.audit.catalogFingerprint ? ` · ${result.audit.catalogFingerprint}` : ""} ·{" "}
              {new Date(result.audit.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10 3L17 7L10 11L3 7L10 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 10L10 14L17 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 13L10 17L17 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7 3L5.5 17M14.5 3L13 17M3 7H17M2.5 13H16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M10 2.8L16 5.2V10.2C16 13.6 13.5 16.6 10 17.6C6.5 16.6 4 13.6 4 10.2V5.2L10 2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 10.2L9.2 12L12.8 8.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M5 17V4.5C5 4 5.4 3.6 5.9 3.6H14.2C14.8 3.6 15 4.4 14.6 4.8L13.2 6.2C12.9 6.5 12.9 7 13.2 7.3L14.6 8.7C15 9.1 14.8 9.9 14.2 9.9H5.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M16.5 3.8C11.5 3.2 6.2 5.3 4.2 9.2C2.8 11.9 3.4 15.1 5.8 16.6C8.3 18.1 12.1 17.4 14.5 14.2C16.6 11.5 17.2 7.3 16.5 3.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 15.2C8.3 12.2 11.2 9.8 15.2 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
