"use client";

import { useMemo, useState } from "react";
import { TERM1_WEEKS } from "@/data/term1-weeks";
import type { StudyPromptKey } from "@/types/learning";
import { FlashcardDeck } from "@/components/learn/FlashcardDeck";
import { WeekQuiz } from "@/components/learn/WeekQuiz";

const PROMPT_LABEL: Record<StudyPromptKey, string> = {
  lecture: "Lecture-style prompt",
  tutorial: "Tutorial (Q&A) prompt",
  practical: "Practical exercise prompt",
  caseStudy: "Case study prompt",
  viva: "Viva / interview prompt",
  reportWriting: "Report-writing prompt",
  revision: "Revision / flashcard prompt",
};

const PROMPT_ORDER: StudyPromptKey[] = [
  "lecture",
  "tutorial",
  "practical",
  "caseStudy",
  "viva",
  "reportWriting",
  "revision",
];

export function Term1Learn() {
  const [week, setWeek] = useState(1);
  const content = useMemo(() => TERM1_WEEKS.find((w) => w.week === week), [week]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy:", text);
    }
  };

  if (!content) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-16">
      <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <label htmlFor="learn-week" className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
          Term 1 — Week
        </label>
        <select
          id="learn-week"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-bloom-brown/20 bg-white px-3 py-2 text-sm font-medium text-bloom-ink dark:border-bloom-gold/30 dark:bg-bloom-ink/80 dark:text-bloom-cream"
        >
          {TERM1_WEEKS.map((w) => (
            <option key={w.week} value={w.week}>
              Week {w.week}: {w.title}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
          <span className="font-semibold text-bloom-ink dark:text-bloom-cream">Focus:</span> {content.focus}
        </p>
        <p className="mt-1 text-xs text-bloom-brown/70 dark:text-bloom-cream/60">
          <span className="font-semibold text-bloom-ink dark:text-bloom-cream">Portfolio output:</span>{" "}
          {content.portfolioOutput}
        </p>
      </div>

      <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Lesson</h2>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">
          {content.introduction}
        </div>
        {content.mapPracticeHint ? (
          <div className="mt-4 rounded-lg border border-bloom-gold/40 bg-bloom-gold/10 p-3 text-sm dark:bg-bloom-gold/5">
            <p className="font-semibold text-bloom-ink dark:text-bloom-cream">Practice with the map</p>
            <p className="mt-1 text-bloom-brown/90 dark:text-bloom-cream/80">{content.mapPracticeHint}</p>
            <p className="mt-2 text-sm font-semibold text-bloom-brown dark:text-bloom-gold-light">
              Switch to the <span className="underline">Screening</span> tab at the top to use the map.
            </p>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Study prompts (copy to ChatGPT or a notebook)</h2>
        <p className="text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
          From your learning program: use one prompt per session. Add context from your screening run when relevant.
        </p>
        {PROMPT_ORDER.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-bloom-brown/12 bg-bloom-cream/30 p-3 dark:border-bloom-gold/15 dark:bg-bloom-brown/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
                {PROMPT_LABEL[key]}
              </h3>
              <button
                type="button"
                onClick={() => copy(content.prompts[key])}
                className="text-xs font-medium text-bloom-brown underline dark:text-bloom-gold-light"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">{content.prompts[key]}</p>
          </div>
        ))}
      </section>

      <FlashcardDeck entries={content.glossary} week={week} />

      <WeekQuiz questions={content.quiz} week={week} />

      <p className="text-center text-[0.65rem] text-bloom-brown/55 dark:text-bloom-cream/45">
        Learning content is for study only—not statutory, legal, or professional advice. Verify against current legislation and your supervisor.
      </p>
    </div>
  );
}
