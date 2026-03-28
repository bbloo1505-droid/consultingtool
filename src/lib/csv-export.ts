import type { LayerScreeningResult } from "@/types/screening";

export function layersToCsv(layers: LayerScreeningResult[]): string {
  const headers = [
    "catalogId",
    "name",
    "domain",
    "tier",
    "featureCount",
    "exceededTransferLimit",
    "error",
  ];
  const escape = (v: string | number | boolean) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = layers.map((l) =>
    [
      l.catalogId,
      l.name,
      l.domain,
      l.tier,
      l.featureCount,
      l.exceededTransferLimit,
      l.error ?? "",
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\r\n");
}
