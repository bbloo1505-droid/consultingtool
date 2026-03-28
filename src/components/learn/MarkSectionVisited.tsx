"use client";

import { useEffect } from "react";
import type { WeekSectionKey } from "@/lib/learn-progress";
import { markVisited } from "@/lib/learn-progress";

/** Marks a Learn section as visited for progress tracking (localStorage). */
export function MarkSectionVisited({ week, section }: { week: number; section: WeekSectionKey }) {
  useEffect(() => {
    markVisited(week, section);
  }, [week, section]);
  return null;
}
