import type { ReactNode } from "react";

export type MetaItem = {
  label: string;
  value: ReactNode;
};

export function MetadataGrid({ items }: { items: MetaItem[] }) {
  const visible = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  return (
    <section className="report-avoid-break mt-5 rounded-[16px] border border-[var(--report-border)] bg-[var(--report-surface)] p-6 print:rounded-none print:border-black print:p-0">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight text-[var(--report-ink)] print:text-[12pt]">
          Project metadata
        </h2>
        <span className="text-xs font-semibold text-[var(--report-muted)] print:hidden">
          Stored from the most recent screening run in this browser session
        </span>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
        {visible.map((i) => (
          <div key={i.label} className="grid grid-cols-[9.5rem_1fr] gap-3">
            <dt className="text-xs font-semibold text-[var(--report-muted)]">{i.label}</dt>
            <dd className="min-w-0 text-sm text-[var(--report-ink)]">{i.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

