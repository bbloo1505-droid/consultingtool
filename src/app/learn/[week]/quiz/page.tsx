import Link from "next/link";
import { LearnDisclaimer } from "@/components/learn/LearnDisclaimer";
import { MarkSectionVisited } from "@/components/learn/MarkSectionVisited";
import { WeekQuiz } from "@/components/learn/WeekQuiz";
import { getWeekContent, parseWeekParam } from "@/lib/learn-week";

export default async function LearnQuizPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div className="pb-12">
      <MarkSectionVisited week={week} section="quiz" />
      <h2 className="font-display text-base font-semibold text-bloom-ink dark:text-bloom-cream">Quiz</h2>
      <p className="mt-2 text-sm text-bloom-brown/85 dark:text-bloom-cream/75">
        {content.quiz.length} multiple-choice questions. Submit to see explanations.
      </p>
      <div className="mt-6">
        <WeekQuiz questions={content.quiz} week={week} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/learn/${week}/flashcards`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          ← Flashcards
        </Link>
        <Link href={`/learn/${week}`} className="text-bloom-brown underline dark:text-bloom-gold-light">
          Week overview
        </Link>
      </div>

      <div className="mt-10">
        <LearnDisclaimer />
      </div>
    </div>
  );
}
