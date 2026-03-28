import Link from "next/link";
import type { GlossaryEntry } from "@/types/learning";
import { crossLinkWeeksForTerm } from "@/lib/glossary-index";

type Props = {
  entries: GlossaryEntry[];
  week: number;
};

export function GlossaryCrossLinks({ entries, week }: Props) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-bloom-brown/15 bg-white p-4 dark:border-bloom-gold/20 dark:bg-bloom-ink/50">
      <h3 className="font-display text-sm font-semibold text-bloom-ink dark:text-bloom-cream">Glossary (cross-links)</h3>
      <p className="mt-1 text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
        Same term may appear in other weeks—compare definitions in context.
      </p>
      <dl className="mt-4 space-y-4 text-sm">
        {entries.map((g, i) => {
          const other = crossLinkWeeksForTerm(g.term, week);
          return (
            <div key={`${g.term}-${i}`}>
              <dt className="font-semibold text-bloom-ink dark:text-bloom-cream">{g.term}</dt>
              <dd className="mt-1 leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">{g.definition}</dd>
              {other.length > 0 ? (
                <dd className="mt-2 text-xs text-bloom-brown/80 dark:text-bloom-cream/70">
                  Also in:{" "}
                  {other.map((w, j) => (
                    <span key={w}>
                      {j > 0 ? ", " : ""}
                      <Link href={`/learn/${w}`} className="font-medium underline decoration-bloom-gold/60">
                        Week {w}
                      </Link>
                    </span>
                  ))}
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
