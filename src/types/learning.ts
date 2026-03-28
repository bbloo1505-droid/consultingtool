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

/** Short written recall after the lesson (self-mark against suggested points). */
export type ApplicationCheck = {
  prompt: string;
  /** Optional bullet-style model answer for self-check */
  suggestedAnswer?: string;
};

/** Core fields stored in `term1-weeks-part-*.ts` */
export type TermWeekContentCore = {
  week: number;
  title: string;
  focus: string;
  portfolioOutput: string;
  introduction: string;
  /** When set, Learn shows a CTA to Screening with this “look for…” text */
  mapPracticeHint?: string;
  prompts: Record<StudyPromptKey, string>;
  glossary: GlossaryEntry[];
  quiz: QuizQuestion[];
};

/** Merged from `term1-week-extras.ts` for Learn UI */
export type WeekLearningExtras = {
  commonMistakes: [string, string];
  elaborationPrompt: string;
  applicationChecks: ApplicationCheck[];
};

export type TermWeekContent = TermWeekContentCore & WeekLearningExtras;
