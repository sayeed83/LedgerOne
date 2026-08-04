import type { SVGProps } from "react";

// Minimal, hand-authored line icons — no icon-library dependency added to
// the frozen tech stack (02_TECH_STACK.md). Every icon is purely
// decorative/supplementary (`aria-hidden`); it is never the sole carrier of
// meaning (A11Y-003) — each usage site pairs it with text.
type IconProps = SVGProps<SVGSVGElement>;

function baseProps(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="11" width="15" height="9.5" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9.5 3.5 6.5 20.5M17.5 3.5l-3 17M4 8.5h16.5M3.2 15.5h16.5" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.6 13.6 0 0 1-3.1 3.7M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 3-.5" />
      <path d="M9.9 14.1a3 3 0 0 0 4.2-4.2" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)} className={`animate-spin ${props.className ?? ""}`}>
      <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 12.5 9 17l10.5-10.5" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 12.3 11 15l5-5.5" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6Z" />
      <path d="M9 12.2 11.2 14.5 15.3 10" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function LockClosedBadgeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4.5" y="11" width="15" height="9.5" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      <path d="M12 15v1.5" />
    </svg>
  );
}

// The LedgerOne wordmark's icon lockup — an abstract, stacked "ledger
// lines" glyph inside a rounded badge. Deliberately geometric/abstract,
// not a real trademark, so it's safe to ship as a first-party mark.
export function LedgerOneMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path
        d="M9 21V11a2 2 0 0 1 2-2h5.5"
        stroke="#F8FAFC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M9 15.5h9" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 21h14" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21.5" cy="9.5" r="2" fill="#F8FAFC" />
    </svg>
  );
}
