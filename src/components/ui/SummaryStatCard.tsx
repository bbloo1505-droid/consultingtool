import type { ReactNode } from "react";

export function SummaryStatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-bg-panel/65 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)] ring-1 ring-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-bg-soft/70">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-bg-soft">{value}</p>
          {hint ? <p className="mt-1 text-xs text-bg-soft/55">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-brand-primary/25 bg-brand-primary/10 text-bg-soft/90 shadow-[0_10px_24px_rgba(214,165,35,0.08)]">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

