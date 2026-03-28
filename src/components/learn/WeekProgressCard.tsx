"use client";

import { useEffect, useState } from "react";
import type { WeekSectionKey } from "@/lib/learn-progress";
import { getWeekProgress, progressFraction } from "@/lib/learn-progress";

const LABEL: Record<WeekSectionKey, string> = {
  lesson: "Lesson read",
  prompts: "Prompts",
  flashcards: "Flashcards",
  quiz: "Quiz",
  applicationChecks: "Application checks",
};

export function WeekProgressCard({ week }: { week: number }) {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump((x) => x + 1);
    window.addEventListener("learn-progress", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("learn-progress", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);

  const p = getWeekProgress(week);
  const frac = progressFraction(week);
  const keys: WeekSectionKey[] = ["lesson", "prompts", "flashcards", "quiz", "applicationChecks"];

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">This week’s progress</h3>
        <span className="text-xs font-medium text-bloom-brown dark:text-bloom-cream/80">
          {Math.round(frac * 100)}% visited
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bloom-cream/80 dark:bg-bloom-brown/40">
        <div
          className="h-full rounded-full bg-bloom-gold transition-[width]"
          style={{ width: `${frac * 100}%` }}
        />
      </div>
      <ul className="mt-3 grid gap-1 text-xs text-bloom-brown/90 dark:text-bloom-cream/75 sm:grid-cols-2">
        {keys.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className={p[k] ? "text-emerald-600 dark:text-emerald-400" : "text-bloom-brown/40 dark:text-bloom-cream/35"}>
              {p[k] ? "✓" : "○"}
            </span>
            {LABEL[k]}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.65rem] text-bloom-brown/65 dark:text-bloom-cream/50">
        Sections mark as visited when you open each page (stored in this browser).
      </p>
    </div>
  );
}
