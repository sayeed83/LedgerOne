import { BarChartIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

// Trial Balance, Profit & Loss, Balance Sheet, Cash Flow, and Closing
// Readiness endpoints have shipped on the backend (Accounting module's
// Reports sub-area), but this screen's frontend is out of scope for this
// milestone — mapped to the pre-scaffolded `reporting` module folder since
// roadmap.md tracks Reports as its own top-level phase (Phase 08).
export function ReportsScreen() {
  return (
    <ModulePlaceholder
      icon={<BarChartIcon className="h-5 w-5" />}
      title="Reports"
      description="Trial Balance, Profit & Loss, Balance Sheet, and Cash Flow statements. This screen is not yet implemented — the Reports module's frontend is scheduled for a future milestone."
    />
  );
}
