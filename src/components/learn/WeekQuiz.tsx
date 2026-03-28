"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/types/learning";

const labels = ["A", "B", "C", "D"] as const;

type Props = {
  questions: QuizQuestion[];
  week: number;
};

export function WeekQuiz({ questions, week }: Props) {
  const [choices, setChoices] = useState<(0 | 1 | 2 | 3 | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [warnIncomplete, setWarnIncomplete] = useState(false);

  const correct = questions.filter((q, idx) => choices[idx] === q.correctIndex).length;

  const pick = (qi: number, opt: 0 | 1 | 2 | 3) => {
    if (submitted) return;
    setChoices((prev) => {
      const next = [...prev];
      next[qi] = opt;
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">
        Week {week} quiz (10 questions)
      </h3>
      <ol className="mt-4 space-y-6 text-sm">
        {questions.map((q, qi) => (
          <li key={qi} className="list-inside">
            <p className="mb-2 font-medium text-bloom-ink dark:text-bloom-cream">
              {qi + 1}. {q.question}
            </p>
            <div className="ml-0 space-y-2 sm:ml-4">
              {q.options.map((opt, oi) => {
                const selected = choices[qi] === oi;
                const showAns = submitted;
                const isCorrect = oi === q.correctIndex;
                const wrongPick = showAns && selected && !isCorrect;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => pick(qi, oi as 0 | 1 | 2 | 3)}
                    className={
                      "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs sm:text-sm " +
                      (showAns && isCorrect
                        ? "border-emerald-600/80 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-950/40"
                        : wrongPick
                          ? "border-red-400/80 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30"
                          : selected
                            ? "border-bloom-gold bg-bloom-gold/15 dark:bg-bloom-gold/10"
                            : "border-bloom-brown/15 bg-bloom-cream/30 hover:bg-bloom-cream/50 dark:border-bloom-gold/20 dark:bg-bloom-brown/20")
                    }
                  >
                    <span className="font-mono text-[0.65rem] text-bloom-brown/80 dark:text-bloom-cream/70">
                      {labels[oi]}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {submitted ? (
              <p className="mt-2 text-xs leading-relaxed text-bloom-brown/85 dark:text-bloom-cream/75">
                <span className="font-semibold">Why:</span> {q.explanation}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (choices.some((c) => c === null)) {
              setWarnIncomplete(true);
              return;
            }
            setWarnIncomplete(false);
            setSubmitted(true);
          }}
          disabled={submitted}
          className="rounded-lg bg-bloom-gold px-4 py-2 text-sm font-semibold text-bloom-ink disabled:opacity-50"
        >
          {submitted ? "Submitted" : "Submit and show answers"}
        </button>
        {warnIncomplete && !submitted ? (
          <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
            Answer all questions before submitting.
          </p>
        ) : null}
        {submitted ? (
          <p className="text-sm font-medium text-bloom-ink dark:text-bloom-cream">
            Score: {correct} / {questions.length}
          </p>
        ) : null}
        {submitted ? (
          <button
            type="button"
            onClick={() => {
              setChoices(questions.map(() => null));
              setSubmitted(false);
              setWarnIncomplete(false);
            }}
            className="text-sm font-medium text-bloom-brown underline dark:text-bloom-gold-light"
          >
            Reset quiz
          </button>
        ) : null}
      </div>
    </div>
  );
}
