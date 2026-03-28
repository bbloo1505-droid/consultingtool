export type StudyPromptKey =
  | "lecture"
  | "tutorial"
  | "practical"
  | "caseStudy"
  | "viva"
  | "reportWriting"
  | "revision";

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type TermWeekContent = {
  week: number;
  title: string;
  focus: string;
  portfolioOutput: string;
  introduction: string;
  /** When set, Learn tab shows a CTA to run the map with this hint */
  mapPracticeHint?: string;
  prompts: Record<StudyPromptKey, string>;
  glossary: GlossaryEntry[];
  quiz: QuizQuestion[];
};
