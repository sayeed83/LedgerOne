import { ChevronLeftIcon, ChevronRightIcon } from "@ledgerone/ui";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

// dumb/presentational (CMP-002) — client-side pager for the small, bounded
// Organization lists (a Tenant's Companies, a Company's Branches/
// Departments), which the backend deliberately returns unpaginated
// (07_REST_API_STANDARDS.md Ch.14's documented small-dataset exception,
// TBL-003). Not wired to cursor pagination since there is none to wire to.
export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalItems, page * pageSize);

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-ink-muted">
      <p>
        Showing <span className="font-medium text-ink">{rangeStart}</span>–
        <span className="font-medium text-ink">{rangeEnd}</span> of{" "}
        <span className="font-medium text-ink">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="px-2">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
