"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDownIcon, SearchIcon } from "../icons";
import { cn } from "../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  // Toolbar/filter usage (alongside SearchBox, LoadingButton) — no visible
  // label row (an `aria-label` is used instead), and sized to match
  // SearchBox's compact height/typography instead of a full form field's.
  compact?: boolean;
}

// A searchable combobox (WAI-ARIA combobox pattern, hand-rolled — no new
// dependency added to the frozen stack, same rationale as Dialog/Tabs) —
// every dropdown in the app goes through this one shared primitive
// (FP6/CMP-002), so "make dropdowns searchable" is a single-component
// change rather than a per-screen one. Controlled only (`value`/
// `onChange(value)`) — callers wire this through RHF's `Controller`, not
// `register()` directly, since the visible text (the option's label) is
// never the same string as the underlying `value`.
export function Select({
  label,
  options,
  value,
  onChange,
  onBlur,
  name,
  placeholder = "Select…",
  error,
  hint,
  disabled = false,
  id,
  className,
  compact = false,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }
    const term = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  // Keep the visible text in sync with the controlled `value` while closed
  // — e.g. when a parent resets the field or options finish loading.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen, value]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function openList() {
    if (disabled) {
      return;
    }
    setIsOpen(true);
  }

  function commit(option: SelectOption) {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openList();
        return;
      }
      setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (isOpen && option) {
        commit(option);
      } else {
        openList();
      }
    } else if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setQuery("");
        setIsOpen(false);
      }
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  const displayValue = isOpen ? query : (selectedOption?.label ?? "");
  const activeDescendantId =
    isOpen && filteredOptions[highlightedIndex] ? `${listboxId}-option-${highlightedIndex}` : undefined;

  return (
    <div ref={containerRef} className={cn("flex flex-col", compact ? "gap-0" : "gap-1.5")}>
      {!compact && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink light:text-light-ink">
          {label}
        </label>
      )}
      <div className={cn("relative", compact && "w-full max-w-xs")}>
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center",
            "w-9",
            compact
              ? "text-ink-faint light:text-light-ink-faint"
              : "text-ink-muted light:text-light-ink-muted",
          )}
          aria-hidden="true"
        >
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          id={selectId}
          name={name}
          role="combobox"
          aria-label={compact ? label : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onFocus={openList}
          onClick={openList}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Let a click on an option register (via mousedown, above)
            // before the blur-triggered close/revert races it.
            window.setTimeout(() => {
              setIsOpen(false);
              setQuery("");
            }, 0);
            onBlur?.();
          }}
          className={cn(
            "w-full rounded-xl border bg-surface-sunken light:bg-light-surface-sunken py-2 pl-9 pr-8 text-sm text-ink light:text-light-ink transition-colors placeholder:text-ink-faint light:placeholder:text-light-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
              : "border-surface-border light:border-light-surface-border focus:border-primary-500",
            className,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            } else {
              openList();
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint light:text-light-ink-faint disabled:cursor-not-allowed"
        >
          <ChevronDownIcon className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-64 w-full min-w-[12rem] overflow-auto rounded-xl border border-surface-border light:border-light-surface-border bg-surface-card light:bg-light-surface-card py-1.5 shadow-lg"
          >
            {filteredOptions.length === 0 && (
              <li className="px-4 py-2.5 text-sm text-ink-muted light:text-light-ink-muted">No matches</li>
            )}
            {filteredOptions.map((option, index) => (
              <li
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={option.value === value}
                // mousedown (not click) so this fires before the input's
                // onBlur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm text-ink light:text-light-ink",
                  index === highlightedIndex && "bg-primary-500/10",
                  option.value === value && "font-medium",
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted light:text-light-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
