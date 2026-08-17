import { KeyIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

// Business screens for Authorization's Role entity are out of scope for
// this milestone.
export function RolesScreen() {
  return (
    <ModulePlaceholder
      icon={<KeyIcon className="h-5 w-5" />}
      title="Roles"
      description="Create and manage Roles, and assign them to your Tenant's Users. This screen is not yet implemented — the Authorization module's frontend is scheduled for a future milestone."
    />
  );
}
