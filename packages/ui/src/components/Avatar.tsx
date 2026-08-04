import { cn } from "../utils/cn";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

const STATUS_CLASSES: Record<AvatarStatus, string> = {
  online: "bg-success-500",
  offline: "bg-ink-faint",
  busy: "bg-danger-500",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

// dumb/presentational (CMP-002). Uses a plain `<img>`, not `next/image` —
// this package is framework-agnostic and doesn't assume a Next.js host;
// apps embedding large content images elsewhere still follow PERF-003
// at their own call sites.
export function Avatar({ name, src, size = "md", status, className }: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", SIZE_CLASSES[size], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          aria-label={name}
          className="flex h-full w-full items-center justify-center rounded-full bg-primary-500/20 font-medium text-primary-400"
        >
          {getInitials(name)}
        </span>
      )}
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-surface",
            STATUS_CLASSES[status],
          )}
        />
      )}
    </span>
  );
}
