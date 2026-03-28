import Link from "next/link";
import { GlossaryCrossLinks } from "@/components/learn/GlossaryCrossLinks";
import { LearnDisclaimer } from "@/components/learn/LearnDisclaimer";
import { WeekProgressCard } from "@/components/learn/WeekProgressCard";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnWeekOverviewPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="pb-12">
      <div className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
          This week
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-bloom-ink dark:text-bloom-cream">Focus</dt>
            <dd className="text-bloom-brown/90 dark:text-bloom-cream/85">{content.focus}</dd>
          </div>
          <div>
            <dt className="font-medium text-bloom-ink dark:text-bloom-cream">Portfolio output</dt>
            <dd className="text-bloom-brown/90 dark:text-bloom-cream/85">{content.portfolioOutput}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <WeekProgressCard week={week} />
      </div>

      <div className="mt-6 rounded-xl border border-bloom-gold/35 bg-bloom-gold/10 p-4 dark:border-bloom-gold/25 dark:bg-bloom-gold/5">
        <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Practice with Screening (map)</h3>
        <p className="mt-2 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">
          {content.mapPracticeHint
            ? content.mapPracticeHint
            : "Open Screening, draw or upload an AOI, and relate this week’s concepts to what you see in the layers and report."}
        </p>
        <p className="mt-3 text-sm font-semibold">
          <Link href="/" className="text-bloom-brown underline dark:text-bloom-gold-light">
            Open Screening (home)
          </Link>
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Common mistakes</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-bloom-brown/95 dark:text-bloom-cream/85">
          <li>{content.commonMistakes[0]}</li>
          <li>{content.commonMistakes[1]}</li>
        </ul>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
        Work through each section in order, or jump to flashcards and quiz for revision. Use{" "}
        <Link href="/learn/review" className="font-medium underline">
          Review queue
        </Link>
        ,{" "}
        <Link href="/learn/mixed-quiz" className="font-medium underline">
          Mixed quiz
        </Link>
        , or a{" "}
        <Link href={`/learn/session?week=${week}`} className="font-medium underline">
          timed session
        </Link>{" "}
        for exam-style practice.
      </p>

      <div className="mt-8">
        <GlossaryCrossLinks entries={content.glossary} week={week} />
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href={`/learn/${week}/lesson`}
            className="block rounded-xl border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-sm font-semibold text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/25 dark:bg-bloom-brown/25 dark:text-bloom-cream dark:hover:bg-bloom-brown/40"
          >
            Lesson →
          </Link>
        </li>
        <li>
          <Link
            href={`/learn/${week}/prompts`}
            className="block rounded-xl border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-sm font-semibold text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/25 dark:bg-bloom-brown/25 dark:text-bloom-cream dark:hover:bg-bloom-brown/40"
          >
            Study prompts →
          </Link>
        </li>
        <li>
          <Link
            href={`/learn/${week}/flashcards`}
            className="block rounded-xl border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-sm font-semibold text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/25 dark:bg-bloom-brown/25 dark:text-bloom-cream dark:hover:bg-bloom-brown/40"
          >
            Flashcards →
          </Link>
        </li>
        <li>
          <Link
            href={`/learn/${week}/quiz`}
            className="block rounded-xl border border-bloom-brown/20 bg-bloom-cream/40 p-4 text-sm font-semibold text-bloom-ink hover:bg-bloom-cream dark:border-bloom-gold/25 dark:bg-bloom-brown/25 dark:text-bloom-cream dark:hover:bg-bloom-brown/40"
          >
            Quiz →
          </Link>
        </li>
      </ul>

      <div className="mt-10">
        <LearnDisclaimer />
      </div>
    </div>
  );
}
