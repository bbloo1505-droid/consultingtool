"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { segment: "" as const, label: "Overview" },
  { segment: "lesson" as const, label: "Lesson" },
  { segment: "prompts" as const, label: "Prompts" },
  { segment: "flashcards" as const, label: "Flashcards" },
  { segment: "quiz" as const, label: "Quiz" },
  { segment: "print" as const, label: "Print" },
];

type Props = {
  week: number;
};

export function LearnWeekNav({ week }: Props) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-bloom-brown/15 pb-4 dark:border-bloom-gold/20" aria-label="Week sections">
      {SECTIONS.map(({ segment, label }) => {
        const href = segment === "" ? `/learn/${week}` : `/learn/${week}/${segment}`;
        const active =
          segment === ""
            ? pathname === `/learn/${week}` || pathname === `/learn/${week}/`
            : pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={segment || "overview"}
            href={href}
            className={
              "rounded-lg px-3 py-2 text-sm font-semibold transition " +
              (active
                ? "bg-bloom-gold text-bloom-ink shadow-sm"
                : "bg-bloom-cream/60 text-bloom-brown hover:bg-bloom-cream dark:bg-bloom-brown/30 dark:text-bloom-cream dark:hover:bg-bloom-brown/50")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
