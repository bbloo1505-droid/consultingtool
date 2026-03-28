"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bbox } from "@turf/turf";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import type {
  LgaId,
  ProjectMetadata,
  ScreenResponse,
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
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "draw_polygon",
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

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
      <aside className="w-full shrink-0 space-y-4 lg:w-[400px]">
        <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
          <h2 className="font-display text-lg font-semibold text-bloom-ink dark:text-bloom-cream">Site screening</h2>
          <p className="mt-2 text-sm leading-relaxed text-bloom-brown/85 dark:text-bloom-cream/75">
            <strong className="text-bloom-ink dark:text-bloom-cream">State (MSES):</strong> this tool intersects
            configured Queensland map layers with your area. <strong className="text-bloom-ink dark:text-bloom-cream">
              Commonwealth (MNES):
            </strong>{" "}
            use PMST and formal EPBC processes — linked below after you run a screen.
          </p>

          <div className="mt-4 space-y-3 border-t border-bloom-brown/15 pt-4 dark:border-bloom-gold/15">
            <p className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
              Project / file reference (optional)
            </p>
            <div className="grid gap-2">
              <label className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                Client
                <input
                  value={project.clientName}
                  onChange={(e) => updateProject({ clientName: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                  placeholder="e.g. Acme Pty Ltd"
                />
              </label>
              <label className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                Site name
                <input
                  value={project.siteName}
                  onChange={(e) => updateProject({ siteName: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                  placeholder="e.g. Smith Road lot"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                  Job / file ID
                  <input
                    value={project.jobId}
                    onChange={(e) => updateProject({ jobId: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                    placeholder="Internal ref"
                  />
                </label>
                <label className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                  Report date
                  <input
                    type="date"
                    value={project.reportDate}
                    onChange={(e) => updateProject({ reportDate: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                  />
                </label>
              </div>
              <label className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                Analyst
                <input
                  value={project.analyst}
                  onChange={(e) => updateProject({ analyst: e.target.value })}
                  className="mt-0.5 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                  placeholder="Name"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 border-t border-bloom-brown/15 pt-4 dark:border-bloom-gold/15">
            <p className="text-xs font-semibold text-bloom-brown dark:text-bloom-gold-light">Area of interest</p>
            <form onSubmit={onAddressParcelSearch} className="mt-3 space-y-2">
              <label htmlFor="address-parcel" className="text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                Queensland address → lot boundary
              </label>
              <input
                id="address-parcel"
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                disabled={addressLoading}
                autoComplete="street-address"
                placeholder="e.g. 12 Queen St, Brisbane QLD"
                className="w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink placeholder:text-bloom-brown/40 dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream dark:placeholder:text-bloom-cream/35"
              />
              <button
                type="submit"
                disabled={addressLoading}
                className="w-full rounded-lg border border-bloom-gold/50 bg-bloom-gold/20 px-3 py-2 text-sm font-semibold text-bloom-ink hover:bg-bloom-gold/35 disabled:opacity-50 dark:border-bloom-gold/40 dark:bg-bloom-gold/15 dark:text-bloom-cream dark:hover:bg-bloom-gold/25"
              >
                {addressLoading ? "Looking up…" : "Load property boundary"}
              </button>
              {addressError ? (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {addressError}
                </p>
              ) : (
                <p className="text-xs text-bloom-brown/60 dark:text-bloom-cream/55">
                  Geocodes the address (Australia), keeps a <strong className="font-medium text-bloom-ink dark:text-bloom-cream">Queensland</strong> hit, then loads the{" "}
                  <strong className="font-medium text-bloom-ink dark:text-bloom-cream">DCDB parcel</strong> that contains that point. Not a legal survey—verify against title.
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full rounded-lg border border-bloom-brown/25 bg-bloom-cream/50 px-3 py-2 text-sm font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/35 dark:bg-bloom-brown/30 dark:text-bloom-cream dark:hover:bg-bloom-brown/45"
            >
              Upload boundary file
            </button>
            {uploadError ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                {uploadError}
              </p>
            ) : (
              <p className="mt-2 text-xs text-bloom-brown/60 dark:text-bloom-cream/55">
                GeoJSON, KML, KMZ, or shapefile (.zip with .shp). WGS84. You can still draw instead.
              </p>
            )}
          </div>

          <div className="mt-3">
            <label htmlFor="basemap" className="text-xs font-medium text-bloom-brown dark:text-bloom-gold-light">
              Basemap
            </label>
            <select
              id="basemap"
              value={basemap}
              onChange={(e) => setBasemap(e.target.value as "streets" | "imagery")}
              className="mt-1 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
            >
              <option value="streets">OpenStreetMap (streets)</option>
              <option value="imagery">Esri World Imagery</option>
            </select>
          </div>

          <div className="mt-3">
            <label htmlFor="buffer-m" className="text-xs font-medium text-bloom-brown dark:text-bloom-gold-light">
              Buffer around AOI (metres)
            </label>
            <select
              id="buffer-m"
              value={bufferMeters}
              onChange={(e) => setBufferMeters(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
            >
              <option value={0}>None (use polygon as drawn)</option>
              <option value={10}>10 m</option>
              <option value={25}>25 m</option>
              <option value={50}>50 m</option>
              <option value={100}>100 m</option>
            </select>
            <p className="mt-1 text-xs text-bloom-brown/55 dark:text-bloom-cream/50">
              Geodesic buffer in WGS84 before querying — useful for edge effects.
            </p>
          </div>

          <div className="mt-3">
            <label htmlFor="lga-pack" className="text-xs font-medium text-bloom-brown dark:text-bloom-gold-light">
              Study area pack
            </label>
            <select
              id="lga-pack"
              value={lga}
              onChange={(e) => setLga(e.target.value as LgaId)}
              className="mt-1 w-full rounded-lg border border-bloom-brown/20 bg-white px-2 py-1.5 text-sm text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
            >
              <option value="qld">Queensland (statewide catalog)</option>
              <option value="brisbane">Brisbane / SEQ — historical flood overlays</option>
              <option value="gold_coast">Gold Coast label — same SEQ flood overlays (verify local mapping)</option>
              <option value="sunshine_coast">Sunshine Coast label — same SEQ flood overlays</option>
              <option value="cairns">Cairns — regional pack (no extra layers yet)</option>
            </select>
            <p className="mt-1 text-xs text-bloom-brown/55 dark:text-bloom-cream/50">
              After changing the pack, run screening again — same polygon, no need to redraw.
            </p>
          </div>

          <p className="mt-3 text-xs text-bloom-brown/60 dark:text-bloom-cream/55">
            Desktop aid only — not legal advice. AOI is not a surveyed title boundary unless you sourced it from
            cadastral data.
          </p>
          <p className="mt-2 text-xs text-bloom-brown/60">{status}</p>
          {streamProgress ? (
            <p className="mt-2 text-xs font-medium text-bloom-brown dark:text-bloom-gold-light">
              Layer queries: {streamProgress.current} / {streamProgress.total}
            </p>
          ) : null}
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-bloom-brown/90 dark:text-bloom-cream/80">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="h-4 w-4 rounded border-bloom-brown/30 text-bloom-gold"
            />
            Progressive results (stream layers as they complete)
          </label>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={runScreen}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-bloom-gold px-3 py-2 text-sm font-semibold text-bloom-ink shadow hover:bg-bloom-gold-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Screening..." : "Run screening"}
            </button>
            <button
              type="button"
              onClick={runScreen}
              disabled={loading || !getAoiFeature()}
              className="inline-flex w-full items-center justify-center rounded-lg border border-bloom-brown/25 bg-white px-3 py-2 text-sm font-medium text-bloom-ink hover:bg-bloom-cream disabled:cursor-not-allowed disabled:opacity-50 dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream dark:hover:bg-bloom-brown/40"
            >
              Re-run screening (same polygon)
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Results</h3>
            <div className="flex flex-wrap gap-3 text-sm font-medium">
              <a className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/report">
                Written report
              </a>
              <a className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/insights">
                Charts
              </a>
              <a className="text-bloom-brown underline-offset-2 hover:underline dark:text-bloom-gold-light" href="/compare">
                Compare AOIs
              </a>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => saveSnapshot("a")}
              className="rounded-lg border border-bloom-brown/20 bg-bloom-cream/50 px-2 py-1 text-xs font-medium text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-brown/30 dark:text-bloom-cream"
            >
              Save snapshot A
            </button>
            <button
              type="button"
              onClick={() => saveSnapshot("b")}
              className="rounded-lg border border-bloom-brown/20 bg-bloom-cream/50 px-2 py-1 text-xs font-medium text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-brown/30 dark:text-bloom-cream"
            >
              Save snapshot B
            </button>
          </div>

          {layerErrors.length > 0 ? (
            <div className="mt-3 rounded-lg border border-red-300/80 bg-red-50 p-3 text-xs text-red-900 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100" role="alert">
              <p className="font-semibold">{layerErrors.length} layer query error(s)</p>
              <p className="mt-1">
                Do not rely on those layers until the service responds successfully. See each layer below for the message.
              </p>
            </div>
          ) : null}

          {!result ? (
            <p className="mt-2 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">No run yet.</p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="rounded-lg border border-bloom-brown/20 bg-white px-2.5 py-1.5 text-xs font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                >
                  Download CSV (layers)
                </button>
                <button
                  type="button"
                  onClick={downloadSessionJson}
                  className="rounded-lg border border-bloom-brown/20 bg-white px-2.5 py-1.5 text-xs font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                >
                  Export session JSON
                </button>
                <button
                  type="button"
                  onClick={copyMethods}
                  className="rounded-lg border border-bloom-brown/20 bg-white px-2.5 py-1.5 text-xs font-medium text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
                >
                  Copy methods paragraph
                </button>
              </div>
              {copyMsg ? <p className="mt-2 text-xs text-bloom-brown/80 dark:text-bloom-cream/70">{copyMsg}</p> : null}

              <ul className="mt-3 space-y-3 text-sm">
                {result.layers.map((layer) => {
                  const g = GLOSSARY[layer.glossaryKey];
                  const isHit = layer.featureCount > 0;
                  return (
                    <li key={layer.catalogId} className="rounded-lg border border-bloom-brown/10 p-3 dark:border-bloom-gold/15">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-bloom-ink dark:text-bloom-cream">{layer.name}</span>
                        <span className="rounded-full bg-bloom-cream px-2 py-0.5 text-xs text-bloom-brown dark:bg-bloom-brown/50 dark:text-bloom-cream">
                          tier: {layer.tier}
                        </span>
                        <span
                          className={
                            isHit
                              ? "rounded-full bg-bloom-gold/30 px-2 py-0.5 text-xs font-medium text-bloom-brown dark:bg-bloom-gold/25 dark:text-bloom-gold-light"
                              : "rounded-full bg-bloom-cream px-2 py-0.5 text-xs text-bloom-brown/70 dark:bg-bloom-brown/40 dark:text-bloom-cream/70"
                          }
                        >
                          {layer.featureCount} intersecting features
                        </span>
                      </div>
                      {layer.error ? (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{layer.error}</p>
                      ) : null}
                      {layer.exceededTransferLimit ? (
                        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                          Result capped (server transfer limit). Narrow the AOI for a full list.
                        </p>
                      ) : null}
                      {g ? (
                        <div className="mt-2 text-xs leading-relaxed text-bloom-brown/85 dark:text-bloom-cream/75">
                          <p className="font-medium text-bloom-ink dark:text-bloom-cream">{g.title}</p>
                          <p className="mt-1">{g.summary}</p>
                          <p className="mt-1 text-bloom-brown/60 dark:text-bloom-cream/55">Next: {g.nextSteps}</p>
                          {g.references && g.references.length > 0 ? (
                            <ul className="mt-2 list-inside list-disc space-y-0.5 text-bloom-brown/80 dark:text-bloom-cream/70">
                              {g.references.map((r) => (
                                <li key={r.url}>
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-bloom-brown underline underline-offset-2 hover:text-bloom-ink dark:text-bloom-gold-light"
                                  >
                                    {r.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {result && hits.length === 0 && layerErrors.length === 0 ? (
            <p className="mt-3 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
              No intersecting features in the configured layers for this AOI (or layers returned zero at this scale).
            </p>
          ) : null}
        </div>

        <ConsultantChecklist />

        {result?.consultantWorkflow ? (
          <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
            <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
              Commonwealth (MNES) — next steps
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-bloom-brown/85 dark:text-bloom-cream/75">
              {result.consultantWorkflow.summary}
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a
                  href={result.consultantWorkflow.pmstMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-bloom-brown underline dark:text-bloom-gold-light"
                >
                  Open PMST map at this AOI centroid (MNES / EPBC)
                </a>
                <p className="text-bloom-brown/80 dark:text-bloom-cream/65">
                  Upload your own boundary in PMST for a formal search; this link only centres the map on the drawn
                  area.
                </p>
              </li>
              <li>
                <a
                  href={result.consultantWorkflow.biomapsStoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-bloom-brown underline dark:text-bloom-gold-light"
                >
                  Queensland Biomaps
                </a>
                <p className="text-bloom-brown/80 dark:text-bloom-cream/65">
                  Upload site boundary for biodiversity / MSES-style outputs (e.g. Excel/PDF reports).
                </p>
              </li>
              <li>
                <a
                  href={result.consultantWorkflow.planningRegulationPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-bloom-brown underline dark:text-bloom-gold-light"
                >
                  Planning Regulation 2017 (Qld) - in force PDF
                </a>
                <p className="text-bloom-brown/80 dark:text-bloom-cream/65">
                  Legislation reference for assessment triggers and reporting context.
                </p>
              </li>
            </ul>
          </div>
        ) : null}

        {result?.registerHints && result.registerHints.length > 0 ? (
          <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
            <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
              Registers & references (manual)
            </h3>
            <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
              Not queried spatially here — use for formal workflows alongside Globe and scheme mapping.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-bloom-brown/85 dark:text-bloom-cream/75">
              {result.registerHints.map((h) => (
                <li key={h.id}>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-bloom-brown underline underline-offset-2 dark:text-bloom-gold-light"
                  >
                    {h.title}
                  </a>
                  <p className="mt-0.5 text-bloom-brown/75 dark:text-bloom-cream/65">{h.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result?.cadastre ? (
          <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
            <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
              Site location (not cadastral boundary)
            </h3>
            <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">{result.cadastre.note}</p>
            <p className="mt-2 text-xs text-bloom-brown/80 dark:text-bloom-cream/75">
              Approximate centroid: {result.cadastre.centroidLat.toFixed(5)}, {result.cadastre.centroidLng.toFixed(5)}{" "}
              (WGS84)
            </p>
            <a
              href={result.cadastre.openMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-bloom-brown underline dark:text-bloom-gold-light"
            >
              Open map at centroid (orientation only)
            </a>
          </div>
        ) : null}

        {result?.audit ? (
          <p className="text-xs text-bloom-brown/50 dark:text-bloom-cream/45">
            Audit: {result.audit.layersQueried} layers, pack {result.audit.lga}
            {result.audit.appVersion ? `, app v${result.audit.appVersion}` : ""}
            {result.audit.catalogFingerprint ? `, catalog ${result.audit.catalogFingerprint}` : ""},{" "}
            {new Date(result.audit.generatedAt).toLocaleString()}
          </p>
        ) : null}
      </aside>

      <div className="relative h-[55vh] min-h-[360px] w-full min-w-0 flex-1 overflow-hidden rounded-xl border border-bloom-brown/15 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:ring-bloom-gold/10 lg:h-[min(720px,calc(100vh-8rem))]">
        <div ref={mapEl} className="absolute inset-0 h-full w-full [&_.maplibregl-canvas]:outline-none" />
      </div>
    </div>
  );
}
