import type { ProjectMetadata, ScreenResponse, StoredScreeningSession } from "@/types/screening";

/** sessionStorage key for last successful screening session */
export const SCREENING_STORAGE_KEY = "env-screening:last-screen";

/** Saved snapshots for dual-AOI compare (full StoredScreeningSession JSON). */
export const SNAPSHOT_A_KEY = "env-screening:snapshot-a";
export const SNAPSHOT_B_KEY = "env-screening:snapshot-b";

const PROJECT_STORAGE_KEY = "env-screening:project-fields";

/** Reads legacy plain ScreenResponse or wrapped StoredScreeningSession. */
export function parseStoredScreening(raw: string | null): StoredScreeningSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if ("screen" in o && o.screen && typeof o.screen === "object") {
      const s = o.screen as Record<string, unknown>;
      if (typeof s.generatedAt === "string") {
        return parsed as StoredScreeningSession;
      }
    }
    if (typeof o.generatedAt === "string" && Array.isArray(o.layers)) {
      return { screen: parsed as ScreenResponse };
    }
  } catch {
    return null;
  }
  return null;
}

export function getScreenFromSession(session: StoredScreeningSession | null): ScreenResponse | null {
  return session?.screen ?? null;
}

/** Persist project form fields (client-side only). */
export function loadProjectFieldsFromStorage(): Partial<ProjectMetadata> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ProjectMetadata>;
  } catch {
    return null;
  }
}

export function saveProjectFieldsToStorage(project: ProjectMetadata): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
  } catch {
    // ignore
  }
}
