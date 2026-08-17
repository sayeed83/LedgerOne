import { CalendarIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function FinancialYearScreen() {
  return (
    <ModulePlaceholder
      icon={<CalendarIcon className="h-5 w-5" />}
      title="Financial Year"
      description="Define and manage Financial Years, and their Open/Closing/Closed/Reopened lifecycle. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
