"use client";

export function PrintWeekButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-bloom-gold px-4 py-2 text-sm font-semibold text-bloom-ink"
    >
      Print or save as PDF
    </button>
  );
}
