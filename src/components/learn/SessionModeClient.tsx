"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SessionModeClient({ initialWeek }: { initialWeek: number }) {
  const [week, setWeek] = useState(initialWeek >= 1 && initialWeek <= 13 ? initialWeek : 1);
  const [minutes, setMinutes] = useState<15 | 25>(15);
  const [running, setRunning] = useState(false);
  const [leftSec, setLeftSec] = useState(15 * 60);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setLeftSec((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    setLeftSec(minutes * 60);
    setRunning(true);
  };

  const mm = Math.floor(leftSec / 60);
  const ss = leftSec % 60;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-bloom-brown/15 bg-bloom-cream/30 p-4 dark:border-bloom-gold/20 dark:bg-bloom-brown/25">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-bloom-brown dark:text-bloom-cream/85">
            Week
            <select
              value={week}
              disabled={running}
              onChange={(e) => setWeek(parseInt(e.target.value, 10))}
              className="rounded-lg border border-bloom-brown/25 bg-white px-2 py-1.5 text-sm dark:border-bloom-gold/30 dark:bg-bloom-ink"
            >
              {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-bloom-brown dark:text-bloom-cream/85">
            Session length
            <select
              value={minutes}
              disabled={running}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10) as 15 | 25)}
              className="rounded-lg border border-bloom-brown/25 bg-white px-2 py-1.5 text-sm dark:border-bloom-gold/30 dark:bg-bloom-ink"
            >
              <option value={15}>15 minutes</option>
              <option value={25}>25 minutes</option>
            </select>
          </label>
          <div className="font-mono text-3xl font-semibold tabular-nums text-bloom-ink dark:text-bloom-cream">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
          {!running ? (
            <button type="button" onClick={start} className="rounded-lg bg-bloom-gold px-4 py-2 text-sm font-semibold text-bloom-ink">
              Start
            </button>
          ) : (
            <button type="button" onClick={() => setRunning(false)} className="rounded-lg border border-bloom-brown/25 px-4 py-2 text-sm font-medium dark:border-bloom-gold/30">
              Pause
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
          Timer runs in this tab only. Work through the checklist in order for week {week}.
        </p>
      </div>

      <ol className="list-decimal space-y-3 pl-5 text-sm text-bloom-brown/95 dark:text-bloom-cream/85">
        <li>
          <Link href={`/learn/${week}/prompts`} className="font-medium underline decoration-bloom-gold/50">
            Study prompts
          </Link>{" "}
          — copy one prompt; stay focused until the timer ends or you finish the list.
        </li>
        <li>
          <Link href={`/learn/${week}/flashcards`} className="font-medium underline decoration-bloom-gold/50">
            Flashcards
          </Link>{" "}
          — rate recall to build your review queue.
        </li>
        <li>
          <Link href={`/learn/${week}/quiz`} className="font-medium underline decoration-bloom-gold/50">
            Week quiz
          </Link>{" "}
          — check weak spots.
        </li>
        <li>
          <Link href="/" className="font-medium underline decoration-bloom-gold/50">
            Screening
          </Link>{" "}
          — optional: apply the week’s map practice hint from the lesson page.
        </li>
      </ol>
    </div>
  );
}
