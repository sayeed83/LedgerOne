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
