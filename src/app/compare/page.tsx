"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import type { LayerScreeningResult, StoredScreeningSession } from "@/types/screening";
import { parseStoredScreening, SNAPSHOT_A_KEY, SNAPSHOT_B_KEY } from "@/lib/screening-storage";
import { AppShell } from "@/components/shell/AppShell";

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
    <AppShell title="Compare">
      <div className="rounded-[18px] border border-border bg-surface p-6 text-text-strong shadow-[0_14px_32px_rgba(2,6,23,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-text-strong">Compare screening runs</h1>
            <p className="mt-1 max-w-prose text-sm text-text-muted">
              Save two runs as <strong>snapshot A</strong> and <strong>snapshot B</strong>, then compare layer hits side by side.
              Snapshots are stored in this browser only.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/" className="text-text-muted underline-offset-2 hover:underline">
              Screening
            </Link>
            <Link href="/report" className="text-text-muted underline-offset-2 hover:underline">
              Report
            </Link>
          </div>
        </div>

        {!screenA && !screenB ? (
          <p className="mt-8 text-sm text-text-muted">
            No snapshots found. Run a screening, then use “Save snapshot A” and “Save snapshot B” to compare scenarios.
          </p>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[16px] border border-border bg-bg-soft p-4">
                <h2 className="text-base font-semibold tracking-tight">Snapshot A</h2>
                {screenA && sessionA ? (
                  <SnapshotMeta session={sessionA} screen={screenA} summary={sumA!} />
                ) : (
                  <p className="mt-2 text-sm text-text-muted">Empty — save from the screening page.</p>
                )}
              </div>
              <div className="rounded-[16px] border border-border bg-bg-soft p-4">
                <h2 className="text-base font-semibold tracking-tight">Snapshot B</h2>
                {screenB && sessionB ? (
                  <SnapshotMeta session={sessionB} screen={screenB} summary={sumB!} />
                ) : (
                  <p className="mt-2 text-sm text-text-muted">Empty — save from the screening page.</p>
                )}
              </div>
            </div>

            {screenA && screenB && allIds.length > 0 ? (
              <div className="overflow-x-auto rounded-[16px] border border-border">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-soft">
                      <th className="px-3 py-2 font-semibold text-text-strong">Layer</th>
                      <th className="px-3 py-2 font-semibold text-text-strong">A — count</th>
                      <th className="px-3 py-2 font-semibold text-text-strong">B — count</th>
                      <th className="px-3 py-2 font-semibold text-text-strong">Δ</th>
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
                        <tr key={id} className="border-b border-border/60">
                          <td className="px-3 py-2 text-text-strong">{name}</td>
                          <td className="px-3 py-2 tabular-nums">{ca}{la?.error ? ` (err)` : ""}</td>
                          <td className="px-3 py-2 tabular-nums">{cb}{lb?.error ? ` (err)` : ""}</td>
                          <td className="px-3 py-2 tabular-nums text-text-muted">
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
    </AppShell>
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
