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

export function ConsultantChecklist() {
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

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm ring-1 ring-bloom-brown/5 dark:border-bloom-gold/20 dark:bg-bloom-ink/60 dark:ring-bloom-gold/10">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Consultant follow-up checklist</h3>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-bloom-brown/70 underline dark:text-bloom-gold-light/80"
        >
          Reset
        </button>
      </div>
      <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
        Tick items as you complete them (stored in this browser session).
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 text-xs leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
            <input
              id={`chk-${i.id}`}
              type="checkbox"
              checked={i.done}
              onChange={() => toggle(i.id)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-bloom-brown/30 text-bloom-gold focus:ring-bloom-gold"
            />
            <label htmlFor={`chk-${i.id}`} className="cursor-pointer">
              {i.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
