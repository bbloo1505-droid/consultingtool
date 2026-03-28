import Link from "next/link";
import { FlashcardReviewQueue } from "@/components/learn/FlashcardReviewQueue";

export const metadata = {
  title: "Review queue | Learn Term 1",
  description: "Spaced repetition flashcards due for review.",
};

export default function LearnReviewPage() {
  return (
    <div className="pb-16">
      <h1 className="font-display text-2xl font-semibold text-bloom-ink dark:text-bloom-cream">Review queue</h1>
      <p className="mt-2 text-sm leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
        Cards you have rated in any week’s flashcards appear here when due.{" "}
        <Link href="/learn" className="font-medium underline decoration-bloom-gold/50">
          Browse weeks
        </Link>
      </p>
      <div className="mt-8">
        <FlashcardReviewQueue />
      </div>
    </div>
  );
}
