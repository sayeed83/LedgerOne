import {
  ArrowsRightLeftIcon,
  BarChartIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  CoinsIcon,
  FilterIcon,
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
  // Purely a rendering hint for ErpShell — consecutive items sharing a
  // `group` render as one collapsible submenu instead of standalone links
  // (see buildNavEntries/NAV_ENTRIES below). getBreadcrumbTrail ignores it
  // entirely, so grouping items differently never touches breadcrumb
  // behavior.
  group?: string;
}

// LAY-002: the one central registry every nav/breadcrumb consumer reads
// from — no screen hand-rolls its own copy of this list. Every entry here
// mirrors a backend module already shipped per
// engineering/implementation/current-phase.md; ARCH-002/ROUTE-001 keep each
// `href` aligned to that module's `/api/v1/...` resource path.
export const NAVIGATION_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: GridIcon },
  { label: "Organization", href: "/organization", icon: BuildingIcon, group: "Org & Access" },
  { label: "User Management", href: "/users", icon: UsersIcon, group: "Org & Access" },
  { label: "Roles", href: "/authorization/roles", icon: KeyIcon, group: "Org & Access" },
  { label: "Permissions", href: "/authorization/permissions", icon: ShieldCheckIcon, group: "Org & Access" },
  { label: "Financial Year", href: "/accounting/financial-years", icon: CalendarIcon, group: "Accounting" },
  { label: "Currency", href: "/accounting/currencies", icon: CoinsIcon, group: "Accounting" },
  { label: "Exchange Rates", href: "/accounting/exchange-rates", icon: ArrowsRightLeftIcon, group: "Accounting" },
  { label: "Tax", href: "/accounting/tax", icon: PercentIcon, group: "Accounting" },
  { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: LayersIcon, group: "Accounting" },
  { label: "Journal Entries", href: "/accounting/journal-entries", icon: BookOpenIcon, group: "Accounting" },
  { label: "Ledger", href: "/accounting/ledger", icon: ListIcon, group: "Accounting" },
  { label: "Reports", href: "/accounting/reports", icon: BarChartIcon, group: "Accounting" },
  { label: "Product Categories", href: "/inventory/product-categories", icon: FilterIcon, group: "Inventory" },
  { label: "Units of Measure", href: "/inventory/units", icon: LayersIcon, group: "Inventory" },
  { label: "Products", href: "/inventory/products", icon: ListIcon, group: "Inventory" },
  { label: "Warehouses", href: "/inventory/warehouses", icon: BuildingIcon, group: "Inventory" },
  { label: "Stocks", href: "/inventory/stocks", icon: ListIcon, group: "Inventory" },
  { label: "Adjustments", href: "/inventory/adjustments", icon: ListIcon, group: "Inventory" },
  { label: "Stock Movements", href: "/inventory/stock-movements", icon: ArrowsRightLeftIcon, group: "Inventory" },
  { label: "Batches", href: "/inventory/batches", icon: CalendarIcon, group: "Inventory" },
  { label: "Reorder Levels", href: "/inventory/reorder-levels", icon: FilterIcon, group: "Inventory" },
];

// One icon per group header — deliberately distinct from any single item's
// icon inside it, so the collapsed submenu reads as its own entity rather
// than an arbitrary member item standing in for the whole group.
const GROUP_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  "Org & Access": ShieldCheckIcon,
  Accounting: BookOpenIcon,
  Inventory: LayersIcon,
};

export interface NavLinkEntry {
  kind: "link";
  item: NavItem;
}

export interface NavGroupEntry {
  kind: "group";
  key: string;
  label: string;
  icon: (props: IconProps) => JSX.Element;
  items: NavItem[];
}

export type NavEntry = NavLinkEntry | NavGroupEntry;

// Folds NAVIGATION_ITEMS' flat list into ErpShell's render shape: an
// ungrouped item stays a standalone link, and a run of consecutive items
// sharing the same `group` collapses into one submenu — same source list
// getBreadcrumbTrail reads, so the two never drift apart.
function buildNavEntries(items: NavItem[]): NavEntry[] {
  const entries: NavEntry[] = [];
  for (const item of items) {
    if (!item.group) {
      entries.push({ kind: "link", item });
      continue;
    }
    const last = entries[entries.length - 1];
    if (last?.kind === "group" && last.label === item.group) {
      last.items.push(item);
    } else {
      entries.push({
        kind: "group",
        key: item.group,
        label: item.group,
        icon: GROUP_ICONS[item.group] ?? item.icon,
        items: [item],
      });
    }
  }
  return entries;
}

export const NAV_ENTRIES: NavEntry[] = buildNavEntries(NAVIGATION_ITEMS);

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

  // Role's own first nested/detail-level route (`/authorization/roles/:roleUuid`),
  // mirroring the User Management branch above.
  if (pathname.startsWith("/authorization/roles/")) {
    trail.push({ label: "Roles", href: "/authorization/roles" });
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

  // Product Category's own first nested/detail-level route
  // (`/inventory/product-categories/:productCategoryUuid`), mirroring the
  // User Management branch above (flat one-level list + one detail route,
  // no further nesting).
  if (pathname.startsWith("/inventory/product-categories/")) {
    trail.push({ label: "Product Categories", href: "/inventory/product-categories" });
    trail.push({ label: "Details", href: pathname });
  }

  // Inventory's own first nested/detail-level route
  // (`/inventory/units/:unitUuid`), mirroring the User Management branch
  // above (flat one-level list + one detail route, no further nesting).
  if (pathname.startsWith("/inventory/units/")) {
    trail.push({ label: "Units of Measure", href: "/inventory/units" });
    trail.push({ label: "Details", href: pathname });
  }

  // Product's own first nested/detail-level route
  // (`/inventory/products/:productUuid`), mirroring Unit's own branch above.
  if (pathname.startsWith("/inventory/products/")) {
    trail.push({ label: "Products", href: "/inventory/products" });
    trail.push({ label: "Details", href: pathname });
  }

  // Warehouse's own first nested/detail-level route
  // (`/inventory/warehouses/:warehouseUuid`), mirroring Product's own branch above.
  if (pathname.startsWith("/inventory/warehouses/")) {
    trail.push({ label: "Warehouses", href: "/inventory/warehouses" });
    trail.push({ label: "Details", href: pathname });
  }

  // Stock's own first nested/detail-level route
  // (`/inventory/stocks/:stockUuid`), mirroring Warehouse's own branch above.
  if (pathname.startsWith("/inventory/stocks/")) {
    trail.push({ label: "Stocks", href: "/inventory/stocks" });
    trail.push({ label: "Details", href: pathname });
  }

  // Inventory Adjustment's own first nested/detail-level route
  // (`/inventory/adjustments/:adjustmentUuid`), mirroring Stock's own branch above.
  if (pathname.startsWith("/inventory/adjustments/")) {
    trail.push({ label: "Adjustments", href: "/inventory/adjustments" });
    trail.push({ label: "Details", href: pathname });
  }

  // Stock Movement's own first nested/detail-level route
  // (`/inventory/stock-movements/:movementUuid`), mirroring Inventory Adjustment's own branch above.
  if (pathname.startsWith("/inventory/stock-movements/")) {
    trail.push({ label: "Stock Movements", href: "/inventory/stock-movements" });
    trail.push({ label: "Details", href: pathname });
  }

  // Batch's own first nested/detail-level route
  // (`/inventory/batches/:batchUuid`), mirroring Stock Movement's own branch above.
  if (pathname.startsWith("/inventory/batches/")) {
    trail.push({ label: "Batches", href: "/inventory/batches" });
    trail.push({ label: "Details", href: pathname });
  }

  // Reorder Level's own first nested/detail-level route
  // (`/inventory/reorder-levels/:reorderLevelUuid`), mirroring Batch's own branch above.
  if (pathname.startsWith("/inventory/reorder-levels/")) {
    trail.push({ label: "Reorder Levels", href: "/inventory/reorder-levels" });
    trail.push({ label: "Details", href: pathname });
  }

  return trail;
}
