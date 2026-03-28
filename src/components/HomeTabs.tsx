"use client";

import { useState } from "react";
import { MapScreen } from "@/components/map/MapScreen";
import { Term1Learn } from "@/components/learn/Term1Learn";

export function HomeTabs() {
  const [tab, setTab] = useState<"screen" | "learn">("screen");

  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
      <div className="mb-4 flex justify-center">
        <div
          className="inline-flex rounded-xl border border-bloom-brown/15 bg-white/90 p-1 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/60"
          role="tablist"
          aria-label="Main sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "screen"}
            onClick={() => setTab("screen")}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold transition " +
              (tab === "screen"
                ? "bg-bloom-gold text-bloom-ink shadow-sm"
                : "text-bloom-brown/80 hover:bg-bloom-cream/80 dark:text-bloom-cream/80 dark:hover:bg-bloom-brown/40")
            }
          >
            Screening
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "learn"}
            onClick={() => setTab("learn")}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold transition " +
              (tab === "learn"
                ? "bg-bloom-gold text-bloom-ink shadow-sm"
                : "text-bloom-brown/80 hover:bg-bloom-cream/80 dark:text-bloom-cream/80 dark:hover:bg-bloom-brown/40")
            }
          >
            Learn (Term 1)
          </button>
        </div>
      </div>
      {tab === "screen" ? <MapScreen /> : <Term1Learn />}
    </main>
  );
}
