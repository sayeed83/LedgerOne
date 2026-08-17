import { BookOpenIcon } from "@ledgerone/ui";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export function JournalEntriesScreen() {
  return (
    <ModulePlaceholder
      icon={<BookOpenIcon className="h-5 w-5" />}
      title="Journal Entries"
      description="Create, submit, post, and reverse Journal Entries. This screen is not yet implemented — the Accounting module's frontend is scheduled for a future milestone."
    />
  );
}
