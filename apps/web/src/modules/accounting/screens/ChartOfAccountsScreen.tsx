import { LayersIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function ChartOfAccountsScreen() {
  return (
    <ModulePlaceholder
      icon={<LayersIcon className="h-5 w-5" />}
      title="Chart of Accounts"
      description="Manage Account Groups and Accounts, and their Draft/Active/Inactive lifecycle. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
