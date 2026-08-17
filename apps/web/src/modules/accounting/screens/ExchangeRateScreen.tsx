import { ArrowsRightLeftIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function ExchangeRateScreen() {
  return (
    <ModulePlaceholder
      icon={<ArrowsRightLeftIcon className="h-5 w-5" />}
      title="Exchange Rates"
      description="Record and review dated Exchange Rates between Currency pairs. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
