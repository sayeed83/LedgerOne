import { SearchIcon } from "@ledgerone/ui";

export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

// dumb/presentational (CMP-002) — a controlled search input; the caller
// owns the debouncing/filtering logic (client-side filter over an
// already-fetched, unpaginated list per TBL-003's documented small-dataset
// exception, or a future server-side query param).
export function SearchBox({ value, onChange, placeholder = "Search…", ...rest }: SearchBoxProps) {
  return (
    <div className="relative w-full max-w-xs">
      <SearchIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-ink-faint light:text-light-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={rest["aria-label"] ?? placeholder}
        className="w-full rounded-xl border border-surface-border light:border-light-surface-border bg-surface-sunken light:bg-light-surface-sunken py-2 pl-9 pr-3 text-sm text-ink light:text-light-ink placeholder:text-ink-faint light:text-light-ink-faint light:placeholder:text-light-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      />
    </div>
  );
}
