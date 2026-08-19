"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  EmptyState,
  LedgerOneMark,
  MenuIcon,
  SearchIcon,
  XIcon,
} from "@ledgerone/ui";
import { useAuth } from "@/modules/authentication/hooks/use-auth";
import { NAVIGATION_ITEMS, getBreadcrumbTrail } from "./navigation.config";

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // Desktop-only icon rail toggle (LAY-001's mobile drawer is unaffected).
  // Lazy-init reads localStorage on the client only — SSR always renders
  // the expanded rail, then this settles to the user's stored preference
  // on hydration.
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("erpShellCollapsed") === "1",
  );
  const breadcrumbTrail = getBreadcrumbTrail(pathname ?? "/");

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("erpShellCollapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-surface-border bg-surface-card transition-[transform,width] lg:static lg:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20 w-64" : "w-64"}`}
      >
        <div
          className={`flex h-16 items-center gap-3 border-b border-surface-border px-5 ${
            isCollapsed ? "lg:justify-center lg:px-3" : ""
          }`}
        >
          <LedgerOneMark className="h-8 w-8 shrink-0" />
          <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
            <span className="block text-base font-semibold tracking-tight text-ink">LedgerOne</span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-warning-500">
              Cloud ERP Platform
            </span>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`ml-auto hidden shrink-0 items-center justify-center rounded-lg border border-surface-border p-1 text-ink-muted transition-colors hover:border-surface-borderStrong hover:bg-white/[0.06] hover:text-ink lg:flex ${
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
            className="ml-auto rounded-lg p-1.5 text-ink-muted hover:bg-white/[0.06] lg:hidden"
            aria-label="Close navigation"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {NAVIGATION_ITEMS.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const previousGroup = index > 0 ? NAVIGATION_ITEMS[index - 1]!.group : undefined;
              const showDivider = item.group !== undefined && item.group !== previousGroup;
              return (
                <li key={item.href}>
                  {showDivider && <div className="my-2 border-t border-surface-border" aria-hidden="true" />}
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMobileNavOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isCollapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      isActive
                        ? "bg-primary-500 text-white"
                        : "text-ink-muted hover:bg-white/[0.06] hover:text-ink"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-surface-border bg-surface-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded-lg p-2 text-ink-muted hover:bg-white/[0.06] lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
            {breadcrumbTrail.map((crumb, index) => {
              const isLast = index === breadcrumbTrail.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5 text-sm">
                  {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-ink-faint" />}
                  {isLast ? (
                    <span className="font-medium text-ink">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-ink-muted hover:text-ink">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          {/* Search placeholder — no query wiring yet, per scope. */}
          <div className="relative hidden max-w-xs flex-1 md:flex lg:max-w-sm">
            <SearchIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-ink-faint" />
            <input
              type="search"
              placeholder="Search…"
              disabled
              aria-label="Search (coming soon)"
              className="w-full rounded-xl border border-surface-border bg-surface-sunken py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification placeholder — static empty state, no live feed yet. */}
            <Dropdown align="right">
              <DropdownTrigger className="relative rounded-lg p-2 text-ink-muted hover:bg-white/[0.06]" aria-label="Notifications">
                <BellIcon className="h-5 w-5" />
              </DropdownTrigger>
              <DropdownMenu className="w-72 p-0">
                <div className="border-b border-surface-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                </div>
                <EmptyState
                  title="No notifications yet"
                  description="You'll see activity from your modules here once notifications are wired up."
                  className="px-4 py-8"
                />
              </DropdownMenu>
            </Dropdown>

            <Dropdown align="right">
              <DropdownTrigger className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-white/[0.06]" aria-label="Account menu">
                <Avatar name="Account" size="sm" />
              </DropdownTrigger>
              <DropdownMenu className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-ink">Signed in</p>
                  <p className="text-xs text-ink-muted">Session managed by LedgerOne Authentication</p>
                </div>
                <div className="my-1 border-t border-surface-border" />
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
