import { MixedQuizClient } from "@/components/learn/MixedQuizClient";

export const metadata = {
  title: "Mixed quiz | Learn Term 1",
  description: "Interleaved questions from multiple Term 1 weeks.",
};

export default function MixedQuizPage() {
  return (
    <div className="pb-16">
      <h1 className="font-display text-2xl font-semibold text-bloom-ink dark:text-bloom-cream">Mixed quiz</h1>
      <p className="mt-2 text-sm leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
        Draw random questions from weeks you have already studied—good for exam-style recall. Use “New draw” to reshuffle.
      </p>
      <div className="mt-8">
        <MixedQuizClient />
      </div>
    </div>
  );
}
