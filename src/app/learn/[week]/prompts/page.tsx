import Link from "next/link";
import { LearnDisclaimer } from "@/components/learn/LearnDisclaimer";
import { MarkSectionVisited } from "@/components/learn/MarkSectionVisited";
import { PromptsSection } from "@/components/learn/PromptsSection";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnPromptsPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="pb-12">
      <MarkSectionVisited week={week} section="prompts" />
      <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Study prompts</h2>
      <div className="mt-4">
        <PromptsSection content={content} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/learn/${week}/lesson`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          ← Lesson
        </Link>
        <Link href={`/learn/${week}/flashcards`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          Next: Flashcards →
        </Link>
      </div>

      <div className="mt-10">
        <LearnDisclaimer />
      </div>
    </div>
  );
}
