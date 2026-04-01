import type { ReactNode } from "react";

export function BrandedTable({
  columns,
  children,
}: {
  columns: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-[var(--report-border)] bg-[var(--report-surface)] print:overflow-visible print:rounded-none print:border-black">
      <table className="w-full border-collapse text-left text-xs text-[var(--report-ink)] print:text-[9pt]">
        <thead className="bg-[color-mix(in_srgb,var(--report-border),#fff_70%)] print:bg-neutral-200">
          <tr>{columns}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-[var(--report-border)] px-3 py-2 font-semibold text-[var(--report-ink)] print:border-black">
      {children}
    </th>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return (
    <td className="border-b border-[var(--report-border)] px-3 py-2 align-top text-[var(--report-ink)] print:border-black">
      {children}
    </td>
  );
}

