"use client";

import type { StudyPromptKey, TermWeekContent } from "@/types/learning";

const PROMPT_LABEL: Record<StudyPromptKey, string> = {
  lecture: "Lecture-style prompt",
  tutorial: "Tutorial (Q&A) prompt",
  practical: "Practical exercise prompt",
  caseStudy: "Case study prompt",
  viva: "Viva / interview prompt",
  reportWriting: "Report-writing prompt",
  revision: "Revision / flashcard prompt",
};

const PROMPT_ORDER: StudyPromptKey[] = [
  "lecture",
  "tutorial",
  "practical",
  "caseStudy",
  "viva",
  "reportWriting",
  "revision",
];

type Props = {
  content: TermWeekContent;
};

export function PromptsSection({ content }: Props) {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy:", text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-bloom-gold/40 bg-bloom-gold/10 p-4 dark:border-bloom-gold/30 dark:bg-bloom-gold/5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
          Contrast / “what would a marker penalise?”
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">{content.elaborationPrompt}</p>
        <button
          type="button"
          onClick={() => copy(content.elaborationPrompt)}
          className="mt-3 text-xs font-medium text-bloom-brown underline dark:text-bloom-gold-light"
        >
          Copy elaboration prompt
        </button>
      </div>
      <p className="text-xs text-bloom-brown/75 dark:text-bloom-cream/65">
        Use one prompt per session. Add context from your screening run when relevant. Paste into ChatGPT or a notebook.
      </p>
      {PROMPT_ORDER.map((key) => (
        <div
          key={key}
          className="rounded-xl border border-bloom-brown/12 bg-bloom-cream/30 p-3 dark:border-bloom-gold/15 dark:bg-bloom-brown/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-bloom-brown dark:text-bloom-gold-light">
              {PROMPT_LABEL[key]}
            </h2>
            <button
              type="button"
              onClick={() => copy(content.prompts[key])}
              className="text-xs font-medium text-bloom-brown underline dark:text-bloom-gold-light"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-bloom-brown/95 dark:text-bloom-cream/85">{content.prompts[key]}</p>
        </div>
      ))}
    </div>
  );
}
