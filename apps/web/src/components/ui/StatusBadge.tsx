import { Badge, type BadgeVariant } from "@ledgerone/ui";

// Every Organization entity's status enum (TenantStatus, CompanyStatus,
// BranchStatus, DepartmentStatus, TenantSubscriptionStatus) resolves through
// this one map, so a given persisted string always renders the same color
// platform-wide (FP6) — never a per-screen ad hoc color choice. A11Y-003:
// the text label is always shown alongside the color, never color alone.
const VARIANT_BY_STATUS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  PROVISIONING: "default",
  DRAFT: "default",
  INVITED: "default",
  SUSPENDED: "warning",
  INACTIVE: "warning",
  CLOSED: "danger",
  DISSOLVED: "danger",
  DEACTIVATED: "danger",
  // Accounting module statuses (Financial Year, Fiscal Period, Currency,
  // Account, Journal Entry) — same one-map-platform-wide rule (FP6).
  FUTURE: "default",
  OPEN: "success",
  CLOSING: "warning",
  REOPENED: "warning",
  SOFT_CLOSED: "warning",
  PENDING_APPROVAL: "warning",
  POSTED: "success",
  REVERSED: "danger",
  // Inventory module statuses (Product, Ch.34.5) — same one-map-platform-wide rule (FP6).
  DISCONTINUED: "danger",
};

function toLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface StatusBadgeProps {
  status: string;
}

// dumb/presentational (CMP-002).
export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANT_BY_STATUS[status] ?? "default"}>{toLabel(status)}</Badge>;
}
