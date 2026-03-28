import { SessionModeClient } from "@/components/learn/SessionModeClient";

export const metadata = {
  title: "Timed session | Learn Term 1",
  description: "15 or 25 minute focused study session with a checklist.",
};

export default async function LearnSessionPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const sp = await searchParams;
  const n = parseInt(sp.week ?? "1", 10);
  const initialWeek = Number.isNaN(n) || n < 1 || n > 13 ? 1 : n;

  return (
    <div className="pb-16">
      <h1 className="font-display text-2xl font-semibold text-bloom-ink dark:text-bloom-cream">Timed session</h1>
      <p className="mt-2 text-sm leading-relaxed text-bloom-brown/90 dark:text-bloom-cream/80">
        Pick a week and a duration. Follow the list—prompts, then flashcards, then quiz—with optional Screening practice.
      </p>
      <div className="mt-8">
        <SessionModeClient initialWeek={initialWeek} />
      </div>
    </div>
  );
}
