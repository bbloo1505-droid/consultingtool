import Link from "next/link";
import { PrintWeekButton } from "@/components/learn/PrintWeekButton";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnWeekPrintPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="print-lean pb-16 print:pb-0">
      <p className="mb-4 text-sm print:hidden">
        <Link href={`/learn/${week}`} className="font-medium underline">
          ← Back to week {week}
        </Link>
      </p>

      <div className="mx-auto max-w-3xl rounded-xl border border-bloom-brown/15 bg-white p-6 print:max-w-none print:border-0 print:p-0 print:shadow-none dark:border-bloom-gold/20 dark:bg-bloom-ink/50 print:dark:bg-white">
        <header className="border-b border-bloom-brown/15 pb-4 dark:border-bloom-gold/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">Term 1 · printable</p>
          <h1 className="mt-1 font-display text-xl font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">
            Week {week}: {content.title}
          </h1>
          <p className="mt-2 text-sm text-bloom-brown/90 dark:text-bloom-cream/80 print:text-neutral-800">
            <span className="font-medium">Focus:</span> {content.focus}
          </p>
          <p className="mt-1 text-sm text-bloom-brown/90 dark:text-bloom-cream/80 print:text-neutral-800">
            <span className="font-medium">Portfolio:</span> {content.portfolioOutput}
          </p>
        </header>

        <section className="mt-6">
          <h2 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">Lesson (summary)</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85 print:text-neutral-900">
            {content.introduction}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">Common mistakes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-bloom-brown/95 print:text-neutral-900">
            <li>{content.commonMistakes[0]}</li>
            <li>{content.commonMistakes[1]}</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">Glossary</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {content.glossary.map((g, i) => (
              <div key={i}>
                <dt className="font-semibold text-bloom-ink dark:text-bloom-cream print:text-black">{g.term}</dt>
                <dd className="text-bloom-brown/95 print:text-neutral-800">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-8 text-[0.65rem] text-bloom-brown/60 print:text-neutral-600">
          Study aid only—not legal or professional advice. Verify against current legislation and your organisation’s templates.
        </p>
      </div>

      <p className="mt-6 print:hidden">
        <PrintWeekButton />
      </p>
    </div>
  );
}
