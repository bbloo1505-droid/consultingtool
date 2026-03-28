import { TERM1_WEEKS } from "@/data/term1-weeks";

/** Normalise glossary term for matching across weeks */
export function glossaryKey(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Weeks where this exact term string appears in glossary (may repeat across weeks with same wording) */
export function weeksForGlossaryTerm(term: string): number[] {
  const k = glossaryKey(term);
  const weeks: number[] = [];
  for (const w of TERM1_WEEKS) {
    if (w.glossary.some((g) => glossaryKey(g.term) === k)) {
      weeks.push(w.week);
    }
  }
  return weeks.sort((a, b) => a - b);
}

/** Other weeks (excluding `currentWeek`) that use the same term label */
export function crossLinkWeeksForTerm(term: string, currentWeek: number): number[] {
  return weeksForGlossaryTerm(term).filter((w) => w !== currentWeek);
}
