import Link from "next/link";
import { ApplicationChecksSection } from "@/components/learn/ApplicationChecksSection";
import { LearnDisclaimer } from "@/components/learn/LearnDisclaimer";
import { MarkSectionVisited } from "@/components/learn/MarkSectionVisited";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnLessonPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="pb-12">
      <MarkSectionVisited week={week} section="lesson" />
      <MarkSectionVisited week={week} section="applicationChecks" />
      <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
        <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Lesson</h2>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">
          {content.introduction}
        </div>
        <div className="mt-4 rounded-lg border border-bloom-gold/40 bg-bloom-gold/10 p-3 text-sm dark:bg-bloom-gold/5">
          <p className="font-semibold text-bloom-ink dark:text-bloom-cream">Practice with Screening</p>
          <p className="mt-1 text-bloom-brown/90 dark:text-bloom-cream/80">
            {content.mapPracticeHint
              ? content.mapPracticeHint
              : "Relate this lesson to a real AOI: open Screening, run layers, and note one observation tied to this week’s focus."}
          </p>
          <p className="mt-2 text-sm font-semibold text-bloom-brown dark:text-bloom-gold-light">
            <Link href="/" className="underline">
              Open Screening (home)
            </Link>{" "}
            to draw or upload an AOI and run layers.
          </p>
        </div>
      </section>

      <div className="mt-8">
        <ApplicationChecksSection checks={content.applicationChecks} week={week} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/learn/${week}/prompts`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          Next: Study prompts →
        </Link>
      </div>

      <div className="mt-10">
        <LearnDisclaimer />
      </div>
    </div>
  );
}
