"use client";

import { useMemo, useState } from "react";
import { TERM1_WEEKS } from "@/data/term1-weeks";
import type { QuizQuestion } from "@/types/learning";
import { WeekQuiz } from "@/components/learn/WeekQuiz";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MixedQuizClient() {
  const [maxWeek, setMaxWeek] = useState(13);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState(0);

  const questions = useMemo(() => {
    const pool: QuizQuestion[] = [];
    for (const w of TERM1_WEEKS) {
      if (w.week > maxWeek) continue;
      for (const q of w.quiz) pool.push(q);
    }
    if (pool.length === 0) return [];
    const n = Math.min(count, pool.length);
    return shuffle(pool).slice(0, n);
  }, [maxWeek, count, seed]);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
        No questions in range—choose a higher “include through” week.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-bloom-brown/15 bg-bloom-cream/30 p-4 dark:border-bloom-gold/20 dark:bg-bloom-brown/20">
        <label className="flex flex-col gap-1 text-xs font-medium text-bloom-brown dark:text-bloom-cream/85">
          Include weeks 1–
          <select
            value={maxWeek}
            onChange={(e) => setMaxWeek(parseInt(e.target.value, 10))}
            className="rounded-lg border border-bloom-brown/25 bg-white px-2 py-1.5 text-sm dark:border-bloom-gold/30 dark:bg-bloom-ink"
          >
            {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-bloom-brown dark:text-bloom-cream/85">
          Questions
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="rounded-lg border border-bloom-brown/25 bg-white px-2 py-1.5 text-sm dark:border-bloom-gold/30 dark:bg-bloom-ink"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-lg border border-bloom-brown/25 bg-white px-3 py-2 text-sm font-medium dark:border-bloom-gold/30 dark:bg-bloom-ink"
        >
          New draw
        </button>
      </div>
      <WeekQuiz
        key={`${seed}-${maxWeek}-${count}`}
        questions={questions}
        week={0}
        title={`Mixed quiz — weeks 1–${maxWeek} (${questions.length} questions)`}
      />
    </div>
  );
}
