import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "danger" | "brand";

const toneClass: Record<Tone, string> = {
  neutral: "border-border bg-surface/10 text-bg-soft/75",
  good: "border-success/40 bg-success/15 text-bg-soft",
  warn: "border-warning/45 bg-warning/15 text-bg-soft",
  danger: "border-danger/45 bg-danger/15 text-bg-soft",
  brand: "border-brand-primary/45 bg-brand-primary/15 text-bg-soft",
};

export function StatusChip({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneClass[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

