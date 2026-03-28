"use client";

import { useState } from "react";
import type { GlossaryEntry } from "@/types/learning";

type Props = {
  entries: GlossaryEntry[];
  week: number;
};

export function FlashcardDeck({ entries, week }: Props) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (entries.length === 0) return null;

  const cur = entries[i];

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
        Flashcards — Week {week}
      </h3>
      <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
        Click the card to flip. Term on front, definition on back.
      </p>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="mt-4 flex min-h-[140px] w-full flex-col justify-center rounded-lg border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-left text-sm shadow-sm transition hover:bg-bloom-cream/70 dark:border-bloom-gold/25 dark:bg-bloom-brown/30 dark:hover:bg-bloom-brown/45"
      >
        {flipped ? (
          <p className="leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/90">{cur.definition}</p>
        ) : (
          <p className="font-semibold text-bloom-ink dark:text-bloom-cream">{cur.term}</p>
        )}
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => {
            setI((x) => Math.max(0, x - 1));
            setFlipped(false);
          }}
          className="rounded-lg border border-bloom-brown/20 px-3 py-1.5 text-xs font-medium disabled:opacity-40 dark:border-bloom-gold/30"
        >
          Previous
        </button>
        <span className="text-xs text-bloom-brown/70 dark:text-bloom-cream/55">
          {i + 1} / {entries.length}
        </span>
        <button
          type="button"
          disabled={i >= entries.length - 1}
          onClick={() => {
            setI((x) => Math.min(entries.length - 1, x + 1));
            setFlipped(false);
          }}
          className="rounded-lg border border-bloom-brown/20 px-3 py-1.5 text-xs font-medium disabled:opacity-40 dark:border-bloom-gold/30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
