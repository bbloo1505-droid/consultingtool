"use client";

import { useCallback, useState } from "react";
import type { GlossaryEntry } from "@/types/learning";
import { cardIdForGlossary, rateCard, type SrsRating } from "@/lib/flashcard-srs";

type Props = {
  entries: GlossaryEntry[];
  week: number;
};

const BTN =
  "rounded-lg border px-2 py-1.5 text-xs font-medium transition dark:border-bloom-gold/30";

export function FlashcardDeck({ entries, week }: Props) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cur = entries[i] ?? entries[0];
  const cardId = cardIdForGlossary(week, i);

  const onRate = useCallback(
    (r: SrsRating) => {
      rateCard(cardId, r);
      setFlipped(false);
      setI((x) => (x + 1 >= entries.length ? 0 : x + 1));
    },
    [cardId, entries.length],
  );

  if (entries.length === 0 || !cur) return null;

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
        Flashcards — Week {week}
      </h3>
      <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
        Flip the card, then rate how well you knew it—scheduling uses spaced repetition (stored in this browser).
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

      {flipped ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Rate recall">
          <button type="button" className={`${BTN} border-red-300/90 bg-red-50 dark:border-red-500/40 dark:bg-red-950/35`} onClick={() => onRate("again")}>
            Again
          </button>
          <button type="button" className={`${BTN} border-amber-400/80 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30`} onClick={() => onRate("hard")}>
            Hard
          </button>
          <button type="button" className={`${BTN} border-bloom-brown/25 bg-bloom-cream/60 dark:border-bloom-gold/30 dark:bg-bloom-brown/35`} onClick={() => onRate("good")}>
            Good
          </button>
          <button type="button" className={`${BTN} border-emerald-500/50 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/35`} onClick={() => onRate("easy")}>
            Easy
          </button>
        </div>
      ) : null}

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
