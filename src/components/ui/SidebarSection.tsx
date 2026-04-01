import type { ReactNode } from "react";

export function SidebarSection({
  title,
  description,
  children,
  defaultOpen = true,
  rightSlot,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  rightSlot?: ReactNode;
}) {
  return (
    <details
      className="group rounded-[16px] border border-border bg-bg-panel/65 shadow-[0_10px_24px_rgba(2,6,23,0.12)] ring-1 ring-transparent open:ring-brand-primary/15"
      open={defaultOpen}
    >
      <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-3 rounded-[16px] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-primary/90 shadow-[0_0_0_3px_rgba(214,165,35,0.10)]" />
            <p className="text-sm font-semibold tracking-tight text-bg-soft">{title}</p>
          </div>
          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-bg-soft/60">{description}</p>
          ) : null}
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          {rightSlot}
          <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface/10 text-bg-soft/70 transition group-open:rotate-180">
            <ChevronDownIcon />
          </span>
        </div>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

