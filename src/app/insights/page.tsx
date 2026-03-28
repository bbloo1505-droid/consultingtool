"use client";

import { useEffect, useState, startTransition, useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScreenResponse } from "@/types/screening";
import { getScreenFromSession, parseStoredScreening, SCREENING_STORAGE_KEY } from "@/lib/screening-storage";

const BLOOM = {
  ink: "#3e2723",
  brown: "#a17336",
  gold: "#f9b42a",
  goldLight: "#fbc85a",
  cream: "#faf6ee",
};

const DOMAIN_NAMES: Record<number, string> = {
  4: "Protected / conservation",
  5: "Vegetation / offsets",
  6: "Wildlife",
  7: "Water / wetlands",
  8: "Fire history",
  10: "World Heritage",
  11: "Flood (historical)",
};

function domainName(d: number): string {
  return DOMAIN_NAMES[d] ?? `Domain ${d}`;
}

export default function InsightsPage() {
  const [data, setData] = useState<ScreenResponse | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCREENING_STORAGE_KEY);
      const session = parseStoredScreening(raw);
      const screen = getScreenFromSession(session);
      if (!screen) return;
      startTransition(() => setData(screen));
    } catch {
      // ignore
    }
  }, []);

  const charts = useMemo(() => {
    if (!data) return null;
    const layers = data.layers;
    const withHits = layers.filter((l) => l.featureCount > 0 && !l.error);
    const totalFeatures = layers.reduce((s, l) => s + l.featureCount, 0);

    const byLayer = [...withHits]
      .sort((a, b) => b.featureCount - a.featureCount)
      .map((l) => ({
        name:
          l.name.length > 42 ? `${l.name.slice(0, 40)}…` : l.name,
        fullName: l.name,
        count: l.featureCount,
      }));

    const domainAgg = new Map<number, number>();
    for (const l of layers) {
      if (l.error) continue;
      domainAgg.set(l.domain, (domainAgg.get(l.domain) ?? 0) + l.featureCount);
    }
    const byDomain = Array.from(domainAgg.entries())
      .map(([domain, count]) => ({
        name: domainName(domain),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const tierHits = { hard: 0, trigger: 0, watch: 0 };
    for (const l of withHits) {
      if (l.tier === "hard") tierHits.hard += 1;
      else if (l.tier === "trigger") tierHits.trigger += 1;
      else tierHits.watch += 1;
    }
    const tierPie = [
      { name: "Trigger", value: tierHits.trigger, key: "trigger" },
      { name: "Watch", value: tierHits.watch, key: "watch" },
      { name: "Hard", value: tierHits.hard, key: "hard" },
    ].filter((x) => x.value > 0);

    const hitVsMiss = [
      { name: "With intersection", value: withHits.length },
      { name: "Nil intersection", value: layers.filter((l) => l.featureCount === 0 && !l.error).length },
      { name: "Query error", value: layers.filter((l) => l.error).length },
    ].filter((x) => x.value > 0);

    return {
      byLayer,
      byDomain,
      tierPie,
      hitVsMiss,
      totalFeatures,
      withHitsCount: withHits.length,
      errorCount: layers.filter((l) => l.error).length,
    };
  }, [data]);

  if (!data || !charts) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-bloom-brown/90 dark:text-bloom-cream/80">
          No screening data found. Run a screening from the home page first, then return here.
        </p>
        <Link
          className="mt-4 inline-block font-semibold text-bloom-brown underline dark:text-bloom-gold-light"
          href="/"
        >
          Back to map
        </Link>
      </div>
    );
  }

  const pieColors = [BLOOM.gold, BLOOM.brown, BLOOM.ink, BLOOM.goldLight];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-bloom-brown underline dark:text-bloom-gold-light" href="/">
            Map
          </Link>
          <Link className="text-bloom-brown underline dark:text-bloom-gold-light" href="/report">
            Written report
          </Link>
          <Link className="text-bloom-brown underline dark:text-bloom-gold-light" href="/compare">
            Compare AOIs
          </Link>
        </div>
      </div>

      <p className="mt-4 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
        Charts are derived from the same screening response as the printable report. They summarise feature counts
        returned by each map service for your area of interest (not field-verified presence of values).
      </p>

      {/* KPI cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Layers queried" value={data.layers.length} />
        <KpiCard label="Layers with hits" value={charts.withHitsCount} />
        <KpiCard label="Features (sum)" value={charts.totalFeatures} />
        <KpiCard label="Layer query errors" value={charts.errorCount} accent={charts.errorCount > 0} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
          <h2 className="font-display text-lg font-semibold text-bloom-ink dark:text-bloom-cream">
            Intersections vs nil return
          </h2>
          <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
            Count of layers by outcome (spatial query).
          </p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.hitVsMiss}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {charts.hitVsMiss.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
          <h2 className="font-display text-lg font-semibold text-bloom-ink dark:text-bloom-cream">
            Screening tiers (layers with hits)
          </h2>
          <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
            Number of layers with at least one intersecting feature, by tier.
          </p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {charts.tierPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.tierPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {charts.tierPie.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-bloom-brown/70 dark:text-bloom-cream/60">
                No layers with positive intersections.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h2 className="font-display text-lg font-semibold text-bloom-ink dark:text-bloom-cream">
          Feature count by theme (domain)
        </h2>
        <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
          Sum of intersecting feature records returned, grouped by layer theme.
        </p>
        <div className="mt-6 h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.byDomain} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-bloom-brown/15 dark:stroke-bloom-gold/20" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: BLOOM.cream,
                  border: `1px solid ${BLOOM.brown}`,
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill={BLOOM.gold} radius={[4, 4, 0, 0]} name="Features" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h2 className="font-display text-lg font-semibold text-bloom-ink dark:text-bloom-cream">
          Feature count by layer (hits only)
        </h2>
        <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
          Horizontal bars sorted by count. Hover for full layer name.
        </p>
        <div
          className="mt-4 w-full min-w-0 min-h-[360px]"
          style={{ height: Math.max(360, charts.byLayer.length * 40) }}
        >
          {charts.byLayer.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.byLayer}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-bloom-brown/15 dark:stroke-bloom-gold/20" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={200}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  formatter={(value) => [value ?? 0, "Features"]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as { fullName?: string; name?: string } | undefined;
                    return p?.fullName ?? p?.name ?? String(label);
                  }}
                  contentStyle={{
                    backgroundColor: BLOOM.cream,
                    border: `1px solid ${BLOOM.brown}`,
                    borderRadius: 8,
                    maxWidth: 400,
                  }}
                />
                <Bar dataKey="count" fill={BLOOM.brown} radius={[0, 4, 4, 0]} name="Features" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-[200px] items-center justify-center text-sm text-bloom-brown/70 dark:text-bloom-cream/60">
              No positive intersections to chart.
            </p>
          )}
        </div>
      </section>

      <p className="mt-8 text-xs text-bloom-brown/65 dark:text-bloom-cream/55">
        Generated {new Date(data.generatedAt).toLocaleString()}. Same data as your last run; re-screen on the map to
        refresh.
      </p>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-bloom-brown/15 bg-bloom-cream/50 p-4 dark:border-bloom-gold/20 dark:bg-bloom-brown/25 ${
        accent ? "ring-2 ring-amber-500/50 dark:ring-amber-400/40" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold tabular-nums text-bloom-ink dark:text-bloom-cream">{value}</p>
    </div>
  );
}
