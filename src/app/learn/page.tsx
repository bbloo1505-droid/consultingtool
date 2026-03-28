import Link from "next/link";
import { TERM1_WEEKS } from "@/data/term1-weeks";

export const metadata = {
  title: "Learn Term 1 | QLD environmental screening",
  description: "Term 1 graduate study weeks 1–13 for environmental consulting.",
};

export default function LearnIndexPage() {
  return (
    <div className="pb-16">
      <h1 className="font-display text-2xl font-semibold text-bloom-ink dark:text-bloom-cream">Term 1 — Weeks 1–13</h1>
      <p className="mt-2 text-sm leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
        Open a week for overview, lesson, prompts, spaced-repetition flashcards, and quiz—or use{" "}
        <Link href="/learn/review" className="font-medium underline">
          Review queue
        </Link>
        ,{" "}
        <Link href="/learn/mixed-quiz" className="font-medium underline">
          Mixed quiz
        </Link>
        , and{" "}
        <Link href="/learn/session" className="font-medium underline">
          Timed sessions
        </Link>{" "}
        for exam-style practice.
      </p>
      <ul className="mt-8 space-y-3">
        {TERM1_WEEKS.map((w) => (
          <li key={w.week}>
            <Link
              href={`/learn/${w.week}`}
              className="block rounded-xl border border-bloom-brown/15 bg-white p-4 shadow-sm transition hover:border-bloom-gold/40 hover:bg-bloom-cream/30 dark:border-bloom-gold/20 dark:bg-bloom-ink/50 dark:hover:bg-bloom-brown/30"
            >
              <span className="font-display font-semibold text-bloom-ink dark:text-bloom-cream">
                Week {w.week}: {w.title}
              </span>
              <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/70">{w.focus}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
