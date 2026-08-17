import {
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  LayersIcon,
  UsersIcon,
} from "@ledgerone/ui";
import { DashboardCard } from "../components/DashboardCard";
import { QuickActionsPanel, type QuickAction } from "../components/QuickActionsPanel";
import { RecentActivityPanel } from "../components/RecentActivityPanel";
import { SystemStatusPanel, type SystemStatusItem } from "../components/SystemStatusPanel";

// Placeholder counts only — no module exposes a summary/count endpoint
// yet, per this milestone's explicit scope ("dashboard cards with
// placeholder counts", "do not implement business screens yet").
const SUMMARY_CARDS = [
  { label: "Companies", value: "—", hint: "Organization", icon: <BuildingIcon className="h-5 w-5" /> },
  { label: "Users", value: "—", hint: "User Management", icon: <UsersIcon className="h-5 w-5" /> },
  { label: "Open Financial Years", value: "—", hint: "Accounting", icon: <CalendarIcon className="h-5 w-5" /> },
  { label: "Journal Entries", value: "—", hint: "This period", icon: <BookOpenIcon className="h-5 w-5" /> },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add User", href: "/users", icon: <UsersIcon className="h-4 w-4" /> },
  { label: "New Journal Entry", href: "/accounting/journal-entries", icon: <BookOpenIcon className="h-4 w-4" /> },
  { label: "Manage Chart of Accounts", href: "/accounting/chart-of-accounts", icon: <LayersIcon className="h-4 w-4" /> },
  { label: "Open Financial Year", href: "/accounting/financial-years", icon: <CalendarIcon className="h-4 w-4" /> },
];

// Static placeholder — no live health-check integration yet (SystemStatusPanel's own doc comment).
const SYSTEM_STATUS: SystemStatusItem[] = [
  { label: "API", status: "operational" },
  { label: "Database", status: "operational" },
  { label: "Background Jobs", status: "operational" },
];

// CMP-003: this is the smart layer for the `/` route — currently composes
// only static placeholder data since no summary/activity/health endpoint
// exists on any module yet; will start calling real TanStack Query hooks
// once those endpoints ship.
export function DashboardHomeScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          An overview of your LedgerOne workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <DashboardCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <QuickActionsPanel actions={QUICK_ACTIONS} />
          <RecentActivityPanel />
        </div>
        <SystemStatusPanel items={SYSTEM_STATUS} />
      </div>
    </div>
  );
}
