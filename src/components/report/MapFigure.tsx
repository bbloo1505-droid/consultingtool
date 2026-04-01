import type { ReactNode } from "react";

export function MapFigure({
  dataUrl,
  caption,
  meta,
}: {
  dataUrl: string | null | undefined;
  caption: string;
  meta?: ReactNode;
}) {
  if (!dataUrl) {
    return (
      <section className="mt-6 rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
        <h2 className="text-base font-semibold tracking-tight text-[var(--report-ink)] print:text-[12pt]">
          Map snapshot
        </h2>
        <p className="mt-2 text-sm text-[var(--report-muted)]">
          No map snapshot was captured for this run. Use “Capture for report” in the screening workspace to include a figure.
        </p>
      </section>
    );
  }

  return (
    <section className="report-avoid-break mt-6 rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-[var(--report-ink)] print:text-[12pt]">
            Map snapshot
          </h2>
          <p className="mt-1 text-sm text-[var(--report-muted)]">{caption}</p>
        </div>
        {meta ? <div className="text-xs text-[var(--report-muted)]">{meta}</div> : null}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- data URL snapshot, print-friendly */}
      <img
        src={dataUrl}
        alt="Map snapshot"
        className="mt-4 w-full rounded-[12px] border border-[var(--report-border)] print:rounded-none print:border-black"
      />
    </section>
  );
}

