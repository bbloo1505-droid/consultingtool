import { describe, expect, it } from "vitest";
import { getCatalogFingerprint } from "@/lib/catalog-version";

describe("getCatalogFingerprint", () => {
  it("returns a non-empty fingerprint string", () => {
    const fp = getCatalogFingerprint();
    expect(fp).toMatch(/^base:\d+;brisbane:\d+;cairns:\d+$/);
  });
});
