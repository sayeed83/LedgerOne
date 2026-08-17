import { Card, CardContent, CardHeader, CardTitle, ClockIcon, EmptyState } from "@ledgerone/ui";

// dumb/presentational (CMP-002) — no activity feed endpoint exists yet on
// any module, so this renders the platform-standard EmptyState (PAGE-003/
// FP5: an empty state is designed content, not an omission) rather than a
// fabricated activity list.
export function RecentActivityPanel() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <EmptyState
          icon={<ClockIcon className="h-6 w-6" />}
          title="No recent activity yet"
          description="Activity from Journal Entries, User Management, and other modules will appear here once available."
        />
      </CardContent>
    </Card>
  );
}
