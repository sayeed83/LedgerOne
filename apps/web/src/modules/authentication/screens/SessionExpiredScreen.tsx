import Link from "next/link";
import { ClockIcon } from "@ledgerone/ui";

export function SessionExpiredScreen() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-warning-500/15 text-warning-500">
        <ClockIcon className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
        Session expired
      </h1>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
        For your security, you&apos;ve been signed out. Please log in again to continue.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
      >
        Log in again
      </Link>
    </div>
  );
}
