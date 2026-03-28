export type WeekSectionKey = "lesson" | "prompts" | "flashcards" | "quiz" | "applicationChecks";

export type WeekProgressState = Record<WeekSectionKey, boolean>;

const STORAGE_KEY = "learn-progress-v1";
const EMPTY: WeekProgressState = {
  lesson: false,
  prompts: false,
  flashcards: false,
  quiz: false,
  applicationChecks: false,
};

function loadAll(): Record<number, WeekProgressState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<WeekProgressState>>;
    const out: Record<number, WeekProgressState> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const w = parseInt(k, 10);
      if (Number.isNaN(w)) continue;
      out[w] = { ...EMPTY, ...v };
    }
    return out;
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, WeekProgressState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("learn-progress"));
}

export function getWeekProgress(week: number): WeekProgressState {
  const all = loadAll();
  return all[week] ? { ...EMPTY, ...all[week] } : { ...EMPTY };
}

export function setWeekSection(week: number, key: WeekSectionKey, done: boolean) {
  const all = loadAll();
  const prev = all[week] ?? { ...EMPTY };
  all[week] = { ...prev, [key]: done };
  saveAll(all);
}

export function markVisited(week: number, key: WeekSectionKey) {
  setWeekSection(week, key, true);
}

export function progressFraction(week: number): number {
  const p = getWeekProgress(week);
  const keys: WeekSectionKey[] = ["lesson", "prompts", "flashcards", "quiz", "applicationChecks"];
  const done = keys.filter((k) => p[k]).length;
  return done / keys.length;
}

export function clearWeekProgress(week: number) {
  const all = loadAll();
  delete all[week];
  saveAll(all);
}
