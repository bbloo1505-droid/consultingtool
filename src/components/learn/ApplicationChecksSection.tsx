"use client";

import { useState } from "react";
import type { ApplicationCheck } from "@/types/learning";

type Props = {
  checks: ApplicationCheck[];
  week: number;
};

export function ApplicationChecksSection({ checks, week }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (checks.length === 0) return null;

  return (
    <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Application checks (active recall)</h3>
      <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
        Answer in a notebook or out loud, then reveal the model points. Week {week}.
      </p>
      <ol className="mt-4 space-y-4">
        {checks.map((c, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-bloom-ink dark:text-bloom-cream">
              {i + 1}. {c.prompt}
            </p>
            {c.suggestedAnswer ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setOpen((x) => (x === i ? null : i))}
                  className="text-xs font-medium text-bloom-brown underline dark:text-bloom-gold-light"
                >
                  {open === i ? "Hide model points" : "Show model points"}
                </button>
                {open === i ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-bloom-brown/15 bg-bloom-cream/40 p-3 text-xs leading-relaxed text-bloom-brown/95 dark:border-bloom-gold/20 dark:bg-bloom-brown/25 dark:text-bloom-cream/85">
                    {c.suggestedAnswer}
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
