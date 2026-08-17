"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { XIcon } from "../icons";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

// Hand-rolled side-panel Drawer (MOD-001/MOD-002 — no Radix/Headless UI
// added to the frozen stack), for viewing/editing a record's detail
// without leaving list context, distinct from Dialog's centered
// single-task pattern. A11Y-004/MOD-005: `role="dialog"`/`aria-modal`,
// focus trapped while open and returned to the trigger on close.
// MOD-004: Escape closes.
export function Drawer({ isOpen, onClose, title, description, children, footer, className }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    const container = drawerRef.current;
    const focusable = container ? getFocusableElements(container) : [];
    (focusable[0] ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !container) {
        return;
      }
      const elements = getFocusableElements(container);
      if (elements.length === 0) {
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ledgerone-drawer-title"
        aria-describedby={description ? "ledgerone-drawer-description" : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface-card shadow-dialog focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-5">
          <div>
            <h2 id="ledgerone-drawer-title" className="text-lg font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id="ledgerone-drawer-description" className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-white/[0.06] hover:text-ink"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-surface-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
