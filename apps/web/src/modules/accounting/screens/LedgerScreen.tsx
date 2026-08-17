import { ListIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function LedgerScreen() {
  return (
    <ModulePlaceholder
      icon={<ListIcon className="h-5 w-5" />}
      title="Ledger"
      description="Drill into the General Ledger per Account, with running balances and posted-entry detail. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
