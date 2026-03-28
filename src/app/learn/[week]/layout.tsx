import { LearnWeekNav } from "@/components/learn/LearnWeekNav";
import { parseWeekParam, getWeekContent } from "@/lib/learn-week";

export default async function LearnWeekLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ week: string }>;
}) {
  const { week: w } = await params;
  const week = parseWeekParam(w);
  const content = getWeekContent(week);

  return (
    <div>
      <div className="mb-2 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">Term 1</p>
        <h1 className="font-display text-xl font-semibold text-bloom-ink dark:text-bloom-cream">
          Week {week}: {content.title}
        </h1>
      </div>
      <div className="print:hidden">
        <LearnWeekNav week={week} />
      </div>
      {children}
    </div>
  );
}
