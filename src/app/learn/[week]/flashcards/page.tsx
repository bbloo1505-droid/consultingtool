import Link from "next/link";
import { FlashcardDeck } from "@/components/learn/FlashcardDeck";
import { LearnDisclaimer } from "@/components/learn/LearnDisclaimer";
import { MarkSectionVisited } from "@/components/learn/MarkSectionVisited";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnFlashcardsPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="pb-12">
      <MarkSectionVisited week={week} section="flashcards" />
      <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Flashcards</h2>
      <p className="mt-2 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
        Terms and definitions for this week. Click a card to flip.
      </p>
      <div className="mt-6">
        <FlashcardDeck entries={content.glossary} week={week} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/learn/${week}/prompts`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          ← Prompts
        </Link>
        <Link href={`/learn/${week}/quiz`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          Next: Quiz →
        </Link>
      </div>

      <div className="mt-10">
        <LearnDisclaimer />
      </div>
    </div>
  );
}
