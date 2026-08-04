"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";

interface DropdownContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  triggerId: string;
  menuId: string;
  align: "left" | "right";
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext(component: string): DropdownContextValue {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error(`${component} must be used within a <Dropdown>.`);
  }
  return context;
}

export interface DropdownProps {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

// Hand-rolled accessible menu (MOD-002 without a new overlay dependency —
// no Radix/Headless UI added to the frozen stack). Closes on outside
// click and Escape (MOD-004); focus returns to the trigger on close.
export function Dropdown({ children, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const menuId = `${generatedId}-menu`;

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        document.getElementById(triggerId)?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close, triggerId]);

  return (
    <DropdownContext.Provider value={{ isOpen, open, close, triggerId, menuId, align }}>
      <div ref={rootRef} className={cn("relative inline-block", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function DropdownTrigger({ children, onClick, ...rest }: DropdownTriggerProps) {
  const { isOpen, open, close, triggerId, menuId } = useDropdownContext("DropdownTrigger");

  return (
    <button
      id={triggerId}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={menuId}
      onClick={(event) => {
        isOpen ? close() : open();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const { isOpen, close, triggerId, menuId, align } = useDropdownContext("DropdownMenu");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      close();
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-30 mt-2 min-w-[180px] rounded-xl border border-surface-border bg-surface-card p-1.5 shadow-dropdown",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  destructive?: boolean;
}

export function DropdownItem({ children, destructive, className, onClick, ...rest }: DropdownItemProps) {
  const { close } = useDropdownContext("DropdownItem");

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={(event) => {
        onClick?.(event);
        close();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:bg-white/[0.06]",
        destructive ? "text-danger-400 hover:bg-danger-500/10" : "text-ink hover:bg-white/[0.06]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
