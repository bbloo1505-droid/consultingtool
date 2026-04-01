"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "env-screening:consultant-checklist";

type Item = { id: string; label: string; done: boolean };

const DEFAULT_ITEMS: Item[] = [
  { id: "pmst", label: "Run PMST with site boundary (MNES / EPBC matters)", done: false },
  { id: "biomaps", label: "Upload boundary to Queensland Biomaps (state biodiversity products)", done: false },
  { id: "globe", label: "Spot-check material layers in Queensland Globe at appropriate scale", done: false },
  { id: "scheme", label: "Confirm planning scheme overlays and assessable development triggers", done: false },
  { id: "cadastre", label: "Confirm legal lot / title boundary against cadastre (AOI is not a survey)", done: false },
];

function loadItemsFromSession(): Item[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ITEMS;
    const parsed = JSON.parse(raw) as Item[];
    if (Array.isArray(parsed) && parsed.length === DEFAULT_ITEMS.length) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ITEMS;
}

export function ConsultantChecklist({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount (no SSR access)
    setItems(loadItemsFromSession());
  }, []);

  const persist = useCallback((next: Item[]) => {
    setItems(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const toggle = (id: string) => {
    persist(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const reset = () => {
    persist(DEFAULT_ITEMS.map((i) => ({ ...i, done: false })));
  };

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-bg-soft">Consultant follow-up checklist</h3>
        <button
          type="button"
          onClick={reset}
          className="focus-ring rounded-full px-2 py-1 text-xs font-semibold text-bg-soft/65 hover:bg-surface/10 hover:text-bg-soft"
        >
          Reset
        </button>
      </div>
      <p className="mt-1 text-xs text-bg-soft/60">Tick items as you complete them (stored in this browser session).</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 text-sm leading-relaxed text-bg-soft/75">
            <input
              id={`chk-${i.id}`}
              type="checkbox"
              checked={i.done}
              onChange={() => toggle(i.id)}
              style={{ accentColor: "var(--brand-primary)" }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border bg-surface/10"
            />
            <label htmlFor={`chk-${i.id}`} className="cursor-pointer">
              {i.label}
            </label>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) return content;

  return (
    <div className="rounded-[16px] border border-border bg-bg-panel/55 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.12)]">
      {content}
    </div>
  );
}
