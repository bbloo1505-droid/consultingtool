"use client";

import Link from "next/link";
import { MapScreen } from "@/components/map/MapScreen";

/** Home (`/`) only: map plus navigation to `/learn`. */
export function HomeTabs() {
  return (
    <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
      <div className="mb-4 flex justify-center">
        <div
          className="inline-flex rounded-xl border border-bloom-brown/15 bg-white/90 p-1 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/60"
          role="tablist"
          aria-label="Main sections"
        >
          <span
            role="tab"
            aria-selected
            className="rounded-lg bg-bloom-gold px-4 py-2 text-sm font-semibold text-bloom-ink shadow-sm"
          >
            Screening
          </span>
          <Link
            href="/learn"
            role="tab"
            aria-selected={false}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-bloom-brown/80 transition hover:bg-bloom-cream/80 dark:text-bloom-cream/80 dark:hover:bg-bloom-brown/40"
          >
            Learn (Term 1)
          </Link>
        </div>
      </div>
      <MapScreen />
    </main>
  );
}
