import { describe, expect, it } from "vitest";
import { parseStoredScreening, SCREENING_STORAGE_KEY } from "@/lib/screening-storage";
import type { ScreenResponse } from "@/types/screening";

describe("parseStoredScreening", () => {
  it("parses wrapped session", () => {
    const screen: ScreenResponse = {
      generatedAt: "2026-01-01T00:00:00.000Z",
      layers: [],
    };
    const raw = JSON.stringify({
      screen,
      bufferMeters: 50,
      aoiSource: "kml",
      project: { clientName: "X", jobId: "", siteName: "", analyst: "", reportDate: "2026-01-01" },
    });
    const s = parseStoredScreening(raw);
    expect(s?.screen.generatedAt).toBe(screen.generatedAt);
    expect(s?.bufferMeters).toBe(50);
    expect(s?.aoiSource).toBe("kml");
  });

  it("parses legacy plain ScreenResponse", () => {
    const screen: ScreenResponse = {
      generatedAt: "2026-01-02T00:00:00.000Z",
      layers: [],
    };
    const raw = JSON.stringify(screen);
    const s = parseStoredScreening(raw);
    expect(s?.screen.generatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(s?.bufferMeters).toBeUndefined();
  });

  it("returns null for invalid json", () => {
    expect(parseStoredScreening(null)).toBeNull();
    expect(parseStoredScreening("")).toBeNull();
  });

  it("exports stable storage key", () => {
    expect(SCREENING_STORAGE_KEY).toContain("env-screening");
  });
});
