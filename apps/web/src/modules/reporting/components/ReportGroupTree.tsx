"use client";

import type { ReportGroupedBalanceNodeDto } from "@ledgerone/shared-types";

export interface ReportGroupTreeProps {
  groups: ReportGroupedBalanceNodeDto[];
  total: string;
  totalLabel: string;
  depth?: number;
}

// Recursive Account Group hierarchy renderer, shared by Balance Sheet
// (Ch.26) and Profit & Loss (Ch.25) — both return the identical
// `ReportGroupedBalanceNodeDto[]` tree shape (account balances grouped by
// Account Group, nested arbitrarily deep). No `DataTable` here: TBL-001's
// primitive is a flat row grid, not a tree, and this data is genuinely
// hierarchical (a group's own subtotal plus each child group's own),
// mirrored instead as nested `<dl>`-style sections — the report's own
// natural on-screen shape (indentation communicates nesting depth directly,
// the same visual language a printed financial statement uses).
export function ReportGroupTree({ groups, total, totalLabel, depth = 0 }: ReportGroupTreeProps) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <ReportGroupNode key={group.accountGroupUuid} node={group} depth={depth} />
      ))}
      <div
        className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-ink"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <span>{totalLabel}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

function ReportGroupNode({ node, depth }: { node: ReportGroupedBalanceNodeDto; depth: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 1.25}rem` }}>
      <div className="flex items-center justify-between text-sm font-medium text-ink">
        <span>{node.accountGroupName}</span>
        <span>{node.subtotal}</span>
      </div>

      {node.accountBalances.length > 0 && (
        <div className="mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {node.accountBalances.map((row) => (
            <div key={row.account.uuid} className="flex items-center justify-between text-sm text-ink-muted">
              <span>
                {row.account.code} — {row.account.name}
              </span>
              <span>{row.balance}</span>
            </div>
          ))}
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {node.children.map((child) => (
            <ReportGroupNode key={child.accountGroupUuid} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
