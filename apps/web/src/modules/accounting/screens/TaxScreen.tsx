import { PercentIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function TaxScreen() {
  return (
    <ModulePlaceholder
      icon={<PercentIcon className="h-5 w-5" />}
      title="Tax"
      description="Manage Tax Groups and their effective-dated Tax Rules. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
