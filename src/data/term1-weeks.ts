import type { TermWeekContent } from "@/types/learning";
import { TERM1_PART_A } from "./term1-weeks-part-a";
import { TERM1_PART_B } from "./term1-weeks-part-b";

export const TERM1_WEEKS: TermWeekContent[] = [...TERM1_PART_A, ...TERM1_PART_B].sort((a, b) => a.week - b.week);

export function getTerm1Week(n: number): TermWeekContent | undefined {
  return TERM1_WEEKS.find((w) => w.week === n);
}
