import {
  ArrowsRightLeftIcon,
  BarChartIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  CoinsIcon,
  GridIcon,
  KeyIcon,
  LayersIcon,
  ListIcon,
  PercentIcon,
  ShieldCheckIcon,
  UsersIcon,
  type IconProps,
} from "@ledgerone/ui";

export interface NavItem {
  label: string;
  href: string;
  icon: (props: IconProps) => JSX.Element;
}

// LAY-002: the one central registry every nav/breadcrumb consumer reads
// from — no screen hand-rolls its own copy of this list. Every entry here
// mirrors a backend module already shipped per
// engineering/implementation/current-phase.md; ARCH-002/ROUTE-001 keep each
// `href` aligned to that module's `/api/v1/...` resource path.
export const NAVIGATION_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: GridIcon },
  { label: "Organization", href: "/organization", icon: BuildingIcon },
  { label: "User Management", href: "/users", icon: UsersIcon },
  { label: "Roles", href: "/authorization/roles", icon: KeyIcon },
  { label: "Permissions", href: "/authorization/permissions", icon: ShieldCheckIcon },
  { label: "Financial Year", href: "/accounting/financial-years", icon: CalendarIcon },
  { label: "Currency", href: "/accounting/currencies", icon: CoinsIcon },
  { label: "Exchange Rates", href: "/accounting/exchange-rates", icon: ArrowsRightLeftIcon },
  { label: "Tax", href: "/accounting/tax", icon: PercentIcon },
  { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: LayersIcon },
  { label: "Journal Entries", href: "/accounting/journal-entries", icon: BookOpenIcon },
  { label: "Ledger", href: "/accounting/ledger", icon: ListIcon },
  { label: "Reports", href: "/accounting/reports", icon: BarChartIcon },
];

export interface BreadcrumbItem {
  label: string;
  href: string;
}

// Every route this shell served until the Organization module's own screens
// shipped was a flat, one-level page, so a breadcrumb trail was just
// "Dashboard" plus the matching nav entry. Organization introduces the
// first real nested/detail-level routes (`/organization/companies`,
// `/organization/companies/:uuid`), so this segment-by-segment fallback
// covers those; every other module remains the flat one-level case above.
const ORGANIZATION_SECTION_LABELS: Record<string, string> = {
  tenant: "Tenant Management",
  companies: "Company Management",
  branches: "Branch Management",
  departments: "Department Management",
};

export function getBreadcrumbTrail(pathname: string): BreadcrumbItem[] {
  const dashboardItem = NAVIGATION_ITEMS[0]!;
  const trail: BreadcrumbItem[] = [{ label: dashboardItem.label, href: dashboardItem.href }];

  if (pathname === "/") {
    return trail;
  }

  const activeItem = NAVIGATION_ITEMS.find((item) => item.href === pathname);
  if (activeItem) {
    trail.push({ label: activeItem.label, href: activeItem.href });
    return trail;
  }

  if (pathname.startsWith("/organization/")) {
    trail.push({ label: "Organization", href: "/organization" });
    const [, , section, detailUuid] = pathname.split("/");
    if (section) {
      const sectionHref = `/organization/${section}`;
      trail.push({ label: ORGANIZATION_SECTION_LABELS[section] ?? section, href: sectionHref });
      if (detailUuid) {
        trail.push({ label: "Details", href: pathname });
      }
    }
  }

  // User Management's own first nested/detail-level route
  // (`/users/:userUuid`), mirroring the Organization branch above.
  if (pathname.startsWith("/users/")) {
    trail.push({ label: "User Management", href: "/users" });
    trail.push({ label: "Details", href: pathname });
  }

  // Accounting's own nested/detail-level routes — Financial Year's own
  // Fiscal Periods, Tax Group's own Tax Rules (surfaced inline, no separate
  // route), and Chart of Accounts' own Account Groups sub-section.
  if (pathname.startsWith("/accounting/")) {
    const segments = pathname.split("/").filter(Boolean);
    const [, section, ...rest] = segments;
    const sectionItem = NAVIGATION_ITEMS.find((item) => item.href === `/accounting/${section}`);
    if (sectionItem) {
      trail.push({ label: sectionItem.label, href: sectionItem.href });
    }
    if (section === "financial-years" && rest[0]) {
      trail.push({ label: "Details", href: `/accounting/financial-years/${rest[0]}` });
      if (rest[1] === "periods" && rest[2]) {
        trail.push({ label: "Fiscal Period", href: pathname });
      }
    } else if (section === "chart-of-accounts" && rest[0] === "groups" && rest[1]) {
      trail.push({ label: "Account Group", href: pathname });
    } else if (section === "chart-of-accounts" && rest[0]) {
      trail.push({ label: "Details", href: pathname });
    } else if (section === "journal-entries" && rest[0] === "new") {
      trail.push({ label: "New Journal Entry", href: pathname });
    } else if (rest[0]) {
      trail.push({ label: "Details", href: pathname });
    }
  }

  return trail;
}
