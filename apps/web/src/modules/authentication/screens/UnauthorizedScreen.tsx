import Link from "next/link";
import { LockClosedBadgeIcon } from "@ledgerone/ui";

// FP1: this screen is UX only — every endpoint behind it independently
// re-checks authorization server-side regardless of whether this page is
// ever reached.
export function UnauthorizedScreen() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-danger-500/15 text-danger-500">
        <LockClosedBadgeIcon className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
        Access denied
      </h1>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
        You don&apos;t have permission to view this page. Contact your administrator if you
        believe this is a mistake.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
      >
        Back to home
      </Link>
    </div>
  );
}
