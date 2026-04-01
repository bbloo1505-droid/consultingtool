import type { LgaId } from "@/types/screening";

/** Parses request body `lga` string to a known pack id. */
export function parseLga(raw: unknown): LgaId {
  const s = typeof raw === "string" ? raw : "";
  if (s === "qld_offset") return "qld_offset";
  if (s === "brisbane" || s === "gold_coast" || s === "sunshine_coast" || s === "cairns") {
    return s;
  }
  return "qld";
}
