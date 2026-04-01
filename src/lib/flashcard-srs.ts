/** Leitner-style spaced repetition (intervals in minutes). Box 0 = 1m … box 4 = 7d */

export type SrsRating = "again" | "hard" | "good" | "easy";

const BOX_MINUTES = [1, 10, 1440, 4320, 10080] as const;

export type CardSrsState = {
  cardId: string;
  /** 0–4 */
  box: number;
  due: number;
};

const STORAGE_KEY = "learn-flashcard-srs-v1";

function loadMap(): Record<string, CardSrsState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CardSrsState>;
  } catch {
    return {};
  }
}

function saveMap(m: Record<string, CardSrsState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

function minutesForBox(box: number): number {
  const b = Math.max(0, Math.min(BOX_MINUTES.length - 1, box));
  return BOX_MINUTES[b];
}

export function cardIdForGlossary(week: number, termIndex: number): string {
  return `w${week}-c${termIndex}`;
}

export function parseCardId(id: string): { week: number; termIndex: number } | null {
  const m = /^w(\d+)-c(\d+)$/.exec(id);
  if (!m) return null;
  return { week: parseInt(m[1], 10), termIndex: parseInt(m[2], 10) };
}

export function rateCard(cardId: string, rating: SrsRating): CardSrsState {
  const m = loadMap();
  const cur = m[cardId] ?? { cardId, box: 0, due: Date.now() };
  let box = cur.box;

  switch (rating) {
    case "again":
      box = 0;
      break;
    case "hard":
      box = Math.max(0, box - 1);
      break;
    case "good":
      box = Math.min(4, box + 1);
      break;
    case "easy":
      box = Math.min(4, box + 2);
      break;
  }

  const mins = minutesForBox(box);
  const next: CardSrsState = { cardId, box, due: Date.now() + mins * 60_000 };
  m[cardId] = next;
  saveMap(m);
  return next;
}

/** Cards that have been studied at least once and are due (or never scheduled = not included). */
export function getDueCardIds(allIds: string[]): string[] {
  const m = loadMap();
  const now = Date.now();
  return allIds.filter((id) => {
    const s = m[id];
    if (!s) return false;
    return s.due <= now;
  });
}

export function getCardState(cardId: string): CardSrsState | undefined {
  return loadMap()[cardId];
}

export function sortDueCardIds(ids: string[]): string[] {
  const m = loadMap();
  return [...ids].sort((a, b) => (m[a]?.due ?? 0) - (m[b]?.due ?? 0));
}

export function countDueSoon(allIds: string[], withinMs: number): number {
  const m = loadMap();
  const now = Date.now();
  const limit = now + withinMs;
  return allIds.filter((id) => {
    const s = m[id];
    const due = s?.due ?? now;
    return due <= limit;
  }).length;
}
