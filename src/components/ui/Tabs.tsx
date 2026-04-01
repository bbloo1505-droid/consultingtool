import type { ReactNode } from "react";

export type TabSpec<T extends string> = {
  id: T;
  label: string;
  rightSlot?: ReactNode;
};

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabSpec<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              "focus-ring inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition",
              isActive
                ? "border-brand-primary/55 bg-brand-primary/18 text-bg-soft shadow-[0_10px_22px_rgba(214,165,35,0.10)]"
                : "border-border bg-surface/10 text-bg-soft/70 hover:bg-surface/15 hover:text-bg-soft",
            ].join(" ")}
          >
            <span>{t.label}</span>
            {t.rightSlot ? <span className="text-xs font-semibold">{t.rightSlot}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

