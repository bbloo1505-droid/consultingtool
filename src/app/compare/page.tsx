"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import type { LayerScreeningResult, StoredScreeningSession } from "@/types/screening";
import { parseStoredScreening, SNAPSHOT_A_KEY, SNAPSHOT_B_KEY } from "@/lib/screening-storage";

function hitSummary(layers: LayerScreeningResult[]) {
  const hits = layers.filter((l) => l.featureCount > 0 && !l.error);
  const errs = layers.filter((l) => l.error);
  const feats = layers.reduce((s, l) => s + l.featureCount, 0);
  return { hits, errs, feats, hitLayerCount: hits.length };
}

export default function ComparePage() {
  const [rawA, setRawA] = useState<string | null>(null);
  const [rawB, setRawB] = useState<string | null>(null);

  useEffect(() => {
    try {
      const a = sessionStorage.getItem(SNAPSHOT_A_KEY);
      const b = sessionStorage.getItem(SNAPSHOT_B_KEY);
      startTransition(() => {
        setRawA(a);
        setRawB(b);
      });
    } catch {
      // ignore
    }
  }, []);

  const sessionA = useMemo(() => parseStoredScreening(rawA), [rawA]);
  const sessionB = useMemo(() => parseStoredScreening(rawB), [rawB]);

  const screenA = sessionA?.screen;
  const screenB = sessionB?.screen;

  const byIdA = useMemo(() => new Map(screenA?.layers.map((l) => [l.catalogId, l])), [screenA]);
  const byIdB = useMemo(() => new Map(screenB?.layers.map((l) => [l.catalogId, l])), [screenB]);

  const allIds = useMemo(() => {
    const s = new Set<string>();
    screenA?.layers.forEach((l) => s.add(l.catalogId));
    screenB?.layers.forEach((l) => s.add(l.catalogId));
    return [...s].sort();
  }, [screenA, screenB]);

  const sumA = screenA ? hitSummary(screenA.layers) : null;
  const sumB = screenB ? hitSummary(screenB.layers) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-bloom-ink dark:text-bloom-cream">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Compare screening runs</h1>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/" className="text-bloom-brown underline dark:text-bloom-gold-light">
            Map
          </Link>
          <Link href="/report" className="text-bloom-brown underline dark:text-bloom-gold-light">
            Report
          </Link>
        </div>
      </div>
      <p className="mt-3 max-w-prose text-sm text-bloom-brown/90 dark:text-bloom-cream/80">
        Save two runs from the map as <strong>snapshot A</strong> and <strong>snapshot B</strong>, then compare layer hits
        side by side. Snapshots are stored in this browser only.
      </p>

      {!screenA && !screenB ? (
        <p className="mt-8 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
          No snapshots found. Run a screening, click &quot;Save snapshot A&quot; and &quot;Save snapshot B&quot; for two scenarios, then
          return here.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-bloom-brown/20 bg-white p-4 dark:border-bloom-gold/25 dark:bg-bloom-ink/50">
              <h2 className="font-display text-lg font-semibold">Snapshot A</h2>
              {screenA && sessionA ? (
                <SnapshotMeta session={sessionA} screen={screenA} summary={sumA!} />
              ) : (
                <p className="mt-2 text-sm text-bloom-brown/70">Empty — save from the map.</p>
              )}
            </div>
            <div className="rounded-xl border border-bloom-brown/20 bg-white p-4 dark:border-bloom-gold/25 dark:bg-bloom-ink/50">
              <h2 className="font-display text-lg font-semibold">Snapshot B</h2>
              {screenB && sessionB ? (
                <SnapshotMeta session={sessionB} screen={screenB} summary={sumB!} />
              ) : (
                <p className="mt-2 text-sm text-bloom-brown/70">Empty — save from the map.</p>
              )}
            </div>
          </div>

          {screenA && screenB && allIds.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-bloom-brown/20 dark:border-bloom-gold/25">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-bloom-brown/20 bg-bloom-cream/50 dark:border-bloom-gold/20 dark:bg-bloom-brown/30">
                    <th className="px-3 py-2 font-semibold">Layer</th>
                    <th className="px-3 py-2 font-semibold">A — count</th>
                    <th className="px-3 py-2 font-semibold">B — count</th>
                    <th className="px-3 py-2 font-semibold">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {allIds.map((id) => {
                    const la = byIdA.get(id);
                    const lb = byIdB.get(id);
                    const ca = la?.featureCount ?? 0;
                    const cb = lb?.featureCount ?? 0;
                    const name = la?.name ?? lb?.name ?? id;
                    return (
                      <tr key={id} className="border-b border-bloom-brown/10 dark:border-bloom-gold/15">
                        <td className="px-3 py-2 text-bloom-brown/95 dark:text-bloom-cream/85">{name}</td>
                        <td className="px-3 py-2 tabular-nums">{ca}{la?.error ? ` (err)` : ""}</td>
                        <td className="px-3 py-2 tabular-nums">{cb}{lb?.error ? ` (err)` : ""}</td>
                        <td className="px-3 py-2 tabular-nums text-bloom-brown/80 dark:text-bloom-cream/70">
                          {ca - cb === 0 ? "—" : ca - cb > 0 ? `+${ca - cb}` : String(ca - cb)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SnapshotMeta({
  session,
  screen,
  summary,
}: {
  session: StoredScreeningSession;
  screen: StoredScreeningSession["screen"];
  summary: ReturnType<typeof hitSummary>;
}) {
  return (
    <dl className="mt-3 space-y-1 text-xs text-bloom-brown/90 dark:text-bloom-cream/80">
      {session.project?.siteName ? (
        <div>
          <dt className="font-semibold">Site</dt>
          <dd>{session.project.siteName}</dd>
        </div>
      ) : null}
      {session.project?.jobId ? (
        <div>
          <dt className="font-semibold">Job</dt>
          <dd>{session.project.jobId}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-semibold">Pack</dt>
        <dd>{screen.audit?.lga ?? "—"}</dd>
      </div>
      <div>
        <dt className="font-semibold">Buffer (m)</dt>
        <dd>{session.bufferMeters ?? 0}</dd>
      </div>
      <div>
        <dt className="font-semibold">Layers with hits</dt>
        <dd>{summary.hitLayerCount}</dd>
      </div>
      <div>
        <dt className="font-semibold">Feature records (sum)</dt>
        <dd>{summary.feats}</dd>
      </div>
      <div>
        <dt className="font-semibold">Query errors</dt>
        <dd>{summary.errs.length}</dd>
      </div>
    </dl>
  );
}
