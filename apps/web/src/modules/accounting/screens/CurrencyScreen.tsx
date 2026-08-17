import { CoinsIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function CurrencyScreen() {
  return (
    <ModulePlaceholder
      icon={<CoinsIcon className="h-5 w-5" />}
      title="Currency"
      description="Browse the platform's Currency reference data and its Active/Inactive status. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
