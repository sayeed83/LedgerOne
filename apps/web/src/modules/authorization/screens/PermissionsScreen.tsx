import { ShieldCheckIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

// Business screens for Authorization's Permission entity are out of
// scope for this milestone.
export function PermissionsScreen() {
  return (
    <ModulePlaceholder
      icon={<ShieldCheckIcon className="h-5 w-5" />}
      title="Permissions"
      description="Browse the platform's Permission catalog and manage Role-Permission grants. This screen is not yet implemented — the Authorization module's frontend is scheduled for a future milestone."
    />
  );
}
