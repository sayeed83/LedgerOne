"use client";

import Link from "next/link";
import { BuildingIcon, Card, CardContent, CardHeader, CardTitle, ChevronRightIcon, LayersIcon, UsersIcon } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";

const SECTIONS = [
  {
    href: "/organization/tenant",
    icon: BuildingIcon,
    title: "Tenant Management",
    description: "View and manage your Organization's Tenant record, status, and contact details.",
  },
  {
    href: "/organization/companies",
    icon: BuildingIcon,
    title: "Company Management",
    description: "Manage the legal Companies operating within your Tenant.",
  },
  {
    href: "/organization/branches",
    icon: LayersIcon,
    title: "Branch Management",
    description: "Manage the physical/operational Branches within a Company.",
  },
  {
    href: "/organization/departments",
    icon: UsersIcon,
    title: "Department Management",
    description: "Manage the functional Departments within a Company.",
  },
];

// Smart landing screen for the Organization module — a real, functional
// index (not a placeholder, per CLAUDE.md's "no placeholder pages" rule)
// linking to each entity's own management area.
export function OrganizationScreen() {
  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage your Tenant's Companies, Branches, and Departments."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-white/[0.02] light:hover:bg-black/[0.02]">
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                    <section.icon className="h-5 w-5" />
                  </span>
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint light:text-light-ink-faint" />
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-ink-muted light:text-light-ink-muted">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
