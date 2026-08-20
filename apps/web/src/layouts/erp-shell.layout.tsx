"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  EmptyState,
  LedgerOneMark,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from "@ledgerone/ui";
import { useAuth } from "@/modules/authentication/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/context/theme.context";
import { NAV_ENTRIES, getBreadcrumbTrail, type NavItem } from "./navigation.config";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

// LAY-001: the desktop-first ERP shell — persistent left navigation, top
// header chrome, breadcrumb, and a content slot. Responsive collapse
// (the mobile drawer below) is a secondary adaptation, not the starting
// design (FP2). LAY-004: navigation shows every module unconditionally for
// now — usePermissions()/useCurrentTenant() are not yet implemented
// (Ch.29/current-phase.md: Frontend was out of scope until this milestone)
// — this is UX-only per FP1 regardless, the server remains authoritative.
export function ErpShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Desktop-only icon rail toggle (LAY-001's mobile drawer is unaffected).
  // Lazy-init reads localStorage on the client only — SSR always renders
  // the expanded rail, then this settles to the user's stored preference
  // on hydration.
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("erpShellCollapsed") === "1",
  );
  const breadcrumbTrail = getBreadcrumbTrail(pathname ?? "/");

  // Each submenu toggles independently (any number can be open at once).
  // Starts with whichever submenu holds the current route already expanded.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () =>
      new Set(
        NAV_ENTRIES.filter((entry): entry is Extract<(typeof NAV_ENTRIES)[number], { kind: "group" }> =>
          entry.kind === "group" && entry.items.some((item) => pathname === item.href),
        ).map((entry) => entry.key),
      ),
  );

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("erpShellCollapsed", next ? "1" : "0");
      return next;
    });
  }

  function toggleGroup(key: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // A collapsed rail has nowhere to show a submenu panel — clicking a group
  // header there first pulls the rail back out and opens that group, rather
  // than toggling a now-invisible panel.
  function handleGroupHeaderClick(key: string) {
    if (isCollapsed) {
      setIsCollapsed(false);
      window.localStorage.setItem("erpShellCollapsed", "0");
      setExpandedGroups((current) => new Set(current).add(key));
    } else {
      toggleGroup(key);
    }
  }

  function renderNavLink(item: NavItem, options: { indent?: boolean } = {}) {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        onClick={() => setIsMobileNavOpen(false)}
        title={isCollapsed ? item.label : undefined}
        className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors ${
          options.indent ? "px-3 lg:pl-10" : "px-3"
        } ${isCollapsed ? "lg:justify-center lg:px-0" : ""} ${
          isActive ? "bg-primary-500 text-white" : "text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04] hover:text-ink light:hover:text-light-ink"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface light:bg-light-surface text-ink light:text-light-ink">
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-surface-border light:border-light-surface-border bg-surface-card light:bg-light-surface-card transition-[transform,width] lg:static lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20 w-64" : "w-64"}`}
      >
        <div
          className={`flex h-16 items-center gap-3 border-b border-surface-border light:border-light-surface-border px-5 ${
            isCollapsed ? "lg:justify-center lg:px-3" : ""
          }`}
        >
          <LedgerOneMark className="h-8 w-8 shrink-0" />
          <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
            <span className="block text-base font-semibold tracking-tight text-ink light:text-light-ink">LedgerOne</span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-warning-500">
              Cloud ERP Platform
            </span>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`ml-auto hidden shrink-0 items-center justify-center rounded-lg border border-surface-border light:border-light-surface-border p-1 text-ink-muted light:text-light-ink-muted transition-colors hover:border-surface-borderStrong light:border-light-surface-borderStrong hover:bg-white/[0.06] light:hover:bg-black/[0.04] hover:text-ink light:hover:text-light-ink lg:flex ${
              isCollapsed ? "lg:ml-0" : ""
            }`}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={isCollapsed}
          >
            <ChevronLeftIcon className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04] lg:hidden"
            aria-label="Close navigation"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {NAV_ENTRIES.map((entry, index) => {
              if (entry.kind === "link") {
                return <li key={entry.item.href}>{renderNavLink(entry.item)}</li>;
              }

              const isExpanded = expandedGroups.has(entry.key);
              const hasActiveChild = entry.items.some((item) => pathname === item.href);
              const GroupIcon = entry.icon;
              const panelId = `nav-group-panel-${entry.key}`;
              return (
                <li key={entry.key} className={index > 0 ? "mt-2 border-t border-surface-border light:border-light-surface-border pt-2" : undefined}>
                  <button
                    type="button"
                    onClick={() => handleGroupHeaderClick(entry.key)}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    title={isCollapsed ? entry.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isCollapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      hasActiveChild
                        ? "bg-primary-500/15 text-primary-400"
                        : "text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04] hover:text-ink light:hover:text-light-ink"
                    }`}
                  >
                    <GroupIcon className="h-5 w-5 shrink-0" />
                    <span className={`flex-1 truncate text-left uppercase tracking-wide text-xs font-semibold ${isCollapsed ? "lg:hidden" : ""}`}>
                      {entry.label}
                    </span>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""} ${
                        isCollapsed ? "lg:hidden" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <ul id={panelId} className={`mt-0.5 flex flex-col gap-0.5 ${isCollapsed ? "lg:hidden" : ""}`}>
                      {entry.items.map((item) => (
                        <li key={item.href}>{renderNavLink(item, { indent: true })}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-border light:border-light-surface-border bg-surface-card light:bg-light-surface-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded-lg p-2 text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04] lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
            {breadcrumbTrail.map((crumb, index) => {
              const isLast = index === breadcrumbTrail.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5 text-sm">
                  {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-ink-faint light:text-light-ink-faint" />}
                  {isLast ? (
                    <span className="font-medium text-ink light:text-light-ink">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-ink-muted light:text-light-ink-muted hover:text-ink light:hover:text-light-ink">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Search placeholder — no query wiring yet, per scope. */}
          <div className="relative hidden max-w-xs flex-1 md:flex lg:max-w-sm">
            <SearchIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-ink-faint light:text-light-ink-faint" />
            <input
              type="search"
              placeholder="Search…"
              disabled
              aria-label="Search (coming soon)"
              className="w-full rounded-xl border border-surface-border light:border-light-surface-border bg-surface-sunken light:bg-light-surface-sunken py-2 pl-9 pr-3 text-sm text-ink light:text-light-ink placeholder:text-ink-faint light:text-light-ink-faint light:placeholder:text-light-ink-faint disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification placeholder — static empty state, no live feed yet. */}
            <Dropdown align="right">
              <DropdownTrigger className="relative rounded-lg p-2 text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04]" aria-label="Notifications">
                <BellIcon className="h-5 w-5" />
              </DropdownTrigger>
              <DropdownMenu className="w-72 p-0">
                <div className="border-b border-surface-border light:border-light-surface-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink light:text-light-ink">Notifications</p>
                </div>
                <EmptyState
                  title="No notifications yet"
                  description="You'll see activity from your modules here once notifications are wired up."
                  className="px-4 py-8"
                />
              </DropdownMenu>
            </Dropdown>

            <Dropdown align="right">
              <DropdownTrigger className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-white/[0.06] light:hover:bg-black/[0.04]" aria-label="Account menu">
                <Avatar name="Account" size="sm" />
              </DropdownTrigger>
              <DropdownMenu className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-ink light:text-light-ink">Signed in</p>
                  <p className="text-xs text-ink-muted light:text-light-ink-muted">Session managed by LedgerOne Authentication</p>
                </div>
                <div className="my-1 border-t border-surface-border light:border-light-surface-border" />
                <div className="px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint light:text-light-ink-faint">
                    Theme
                  </p>
                  <div className="flex gap-1">
                    {THEME_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isActive = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          aria-pressed={isActive}
                          className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                            isActive
                              ? "bg-primary-500/15 text-primary-400"
                              : "text-ink-muted light:text-light-ink-muted hover:bg-white/[0.06] light:hover:bg-black/[0.04] hover:text-ink light:hover:text-light-ink"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="my-1 border-t border-surface-border light:border-light-surface-border" />
                <DropdownItem destructive onClick={() => void signOut()}>
                  Log out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
