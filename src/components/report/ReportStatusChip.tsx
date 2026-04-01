import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "danger" | "brand";

const toneStyle: Record<Tone, string> = {
  neutral:
    "border-[var(--report-border)] bg-[color-mix(in_srgb,var(--report-border),#fff_72%)] text-[var(--report-ink)]",
  good:
    "border-[color-mix(in_srgb,var(--report-success),#000_10%)] bg-[color-mix(in_srgb,var(--report-success),#fff_88%)] text-[var(--report-ink)]",
  warn:
    "border-[color-mix(in_srgb,var(--report-warning),#000_10%)] bg-[color-mix(in_srgb,var(--report-warning),#fff_88%)] text-[var(--report-ink)]",
  danger:
    "border-[color-mix(in_srgb,var(--report-danger),#000_10%)] bg-[color-mix(in_srgb,var(--report-danger),#fff_90%)] text-[var(--report-ink)]",
  brand:
    "border-[color-mix(in_srgb,var(--report-brand),#000_10%)] bg-[color-mix(in_srgb,var(--report-brand),#fff_90%)] text-[var(--report-brand-dark)]",
};

export function ReportStatusChip({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", toneStyle[tone]].join(" ")}>
      {children}
    </span>
  );
}

