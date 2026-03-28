"use client";

import { useMemo, useState } from "react";
import { getTerm1Week, TERM1_WEEKS } from "@/data/term1-weeks";
import {
  cardIdForGlossary,
  getDueCardIds,
  parseCardId,
  rateCard,
  sortDueCardIds,
  type SrsRating,
} from "@/lib/flashcard-srs";

const BTN =
  "rounded-lg border px-2 py-1.5 text-xs font-medium transition dark:border-bloom-gold/30";

function buildAllIds(): string[] {
  const ids: string[] = [];
  for (const w of TERM1_WEEKS) {
    for (let i = 0; i < w.glossary.length; i++) {
      ids.push(cardIdForGlossary(w.week, i));
    }
  }
  return ids;
}

export function FlashcardReviewQueue() {
  const [flipped, setFlipped] = useState(false);
  const [doneSession, setDoneSession] = useState(0);

  const queue = useMemo(() => {
    const all = buildAllIds();
    const due = getDueCardIds(all);
    return sortDueCardIds(due);
  }, [doneSession]);

  const currentId = queue[0];

  const card = useMemo(() => {
    if (!currentId) return null;
    const parsed = parseCardId(currentId);
    if (!parsed) return null;
    const wk = getTerm1Week(parsed.week);
    if (!wk) return null;
    const g = wk.glossary[parsed.termIndex];
    if (!g) return null;
    return { ...parsed, term: g.term, definition: g.definition };
  }, [currentId]);

  const onRate = (r: SrsRating) => {
    if (!currentId) return;
    rateCard(currentId, r);
    setFlipped(false);
    setDoneSession((x) => x + 1);
  };

  if (!card) {
    return (
      <div className="rounded-xl border border-bloom-brown/15 bg-white p-6 text-center dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <p className="text-sm font-medium text-bloom-ink dark:text-bloom-cream">No cards due right now</p>
        <p className="mt-2 text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
          Open any week’s flashcards, flip cards, and rate them—due items will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <p className="text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
        Week {card.week} · {queue.length} due in queue
      </p>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="mt-4 flex min-h-[160px] w-full flex-col justify-center rounded-lg border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-left text-sm shadow-sm transition hover:bg-bloom-cream/70 dark:border-bloom-gold/25 dark:bg-bloom-brown/30 dark:hover:bg-bloom-brown/45"
      >
        {flipped ? (
          <p className="leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/90">{card.definition}</p>
        ) : (
          <p className="font-semibold text-bloom-ink dark:text-bloom-cream">{card.term}</p>
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
      ) : (
        <p className="mt-2 text-xs text-bloom-brown/65 dark:text-bloom-cream/55">Flip the card, then rate your recall.</p>
      )}
    </div>
  );
}
