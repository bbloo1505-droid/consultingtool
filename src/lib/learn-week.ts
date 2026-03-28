import { notFound } from "next/navigation";
import { TERM1_WEEK_EXTRAS } from "@/data/term1-week-extras";
import { getTerm1Week } from "@/data/term1-weeks";
import type { TermWeekContent } from "@/types/learning";

export const TERM1_WEEK_MIN = 1;
export const TERM1_WEEK_MAX = 13;

export function parseWeekParam(weekStr: string): number {
  const n = parseInt(weekStr, 10);
  if (Number.isNaN(n) || n < TERM1_WEEK_MIN || n > TERM1_WEEK_MAX) {
    notFound();
  }
  return n;
}

export function getWeekContent(week: number): TermWeekContent {
  const content = getTerm1Week(week);
  if (!content) notFound();
  const extras = TERM1_WEEK_EXTRAS[week];
  if (!extras) notFound();
  return { ...content, ...extras };
}
