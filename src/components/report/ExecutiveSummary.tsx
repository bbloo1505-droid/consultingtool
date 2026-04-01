import type { ReactNode } from "react";
import { ReportStatusChip } from "@/components/report/ReportStatusChip";

export function ExecutiveSummary({
  blurb,
  cards,
  keyFlags,
}: {
  blurb: ReactNode;
  cards: { label: string; value: ReactNode; tone?: "brand" | "good" | "warn" | "danger" | "neutral" }[];
  keyFlags: { title: string; body: ReactNode; tone?: "brand" | "good" | "warn" | "danger" | "neutral" }[];
}) {
  return (
    <section className="mt-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] print:grid-cols-[1fr_320px]">
        <div className="rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
          <h2 className="text-base font-semibold tracking-tight text-[var(--report-ink)] print:text-[12pt]">
            Executive summary
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-[var(--report-ink)]">{blurb}</div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-[14px] border border-[var(--report-border)] bg-[var(--report-bg)] p-4 print:bg-transparent"
              >
                <p className="text-xs font-semibold text-[var(--report-muted)]">{c.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--report-ink)]">{c.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="report-avoid-break rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--report-ink)]">Key flags</h3>
            <ReportStatusChip tone="brand">Review</ReportStatusChip>
          </div>
          <div className="mt-3 space-y-3">
            {keyFlags.length === 0 ? (
              <p className="text-sm text-[var(--report-muted)]">No key flags were generated for this run.</p>
            ) : (
              keyFlags.map((f) => (
                <div key={f.title} className="rounded-[14px] border border-[var(--report-border)] bg-[var(--report-bg)] p-3 print:bg-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--report-ink)]">{f.title}</p>
                    {f.tone ? <ReportStatusChip tone={f.tone}>{f.tone.toUpperCase()}</ReportStatusChip> : null}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--report-muted)]">{f.body}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

