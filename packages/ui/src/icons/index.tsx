import type { SVGProps } from "react";

// Minimal, hand-authored line icons — no icon-library dependency added to
// the frozen tech stack (02_TECH_STACK.md, 12_MODULE_DEVELOPMENT_GUIDE.md).
// Every icon is purely decorative/supplementary (`aria-hidden` by default);
// it must never be the sole carrier of meaning at a call site (A11Y-003).
export type IconProps = SVGProps<SVGSVGElement>;

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

export function InfoIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.1" />
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

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m5.5 8.5 6.5 7 6.5-7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m8.5 5.5 7 6.5-7 6.5" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </svg>
  );
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)} strokeWidth={2.5}>
      <path d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <path d="M9 7.5h1.5M13.5 7.5H15M9 11.5h1.5M13.5 11.5H15M9 15.5h1.5M13.5 15.5H15" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M2.8 19c1-3 3.3-4.5 6.2-4.5s5.2 1.5 6.2 4.5" />
      <path d="M15.5 6a2.7 2.7 0 0 1 0 5.3" />
      <path d="M16.7 14.7c2.3.4 4 1.8 4.8 4.3" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5 19.5 4M16.5 6.5l2 2M13.5 9.5l1.7 1.7" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <ellipse cx="9.5" cy="8" rx="6" ry="3.2" />
      <path d="M3.5 8v4.5c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2V8" />
      <path d="M18 10.3c1.5.5 2.5 1.4 2.5 2.5 0 1.8-2.7 3.2-6 3.2-1.2 0-2.4-.2-3.3-.5" />
      <path d="M9.5 15.7v2c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2v-4.9" />
    </svg>
  );
}

export function ArrowsRightLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3.5 8h15M14.5 4.5 18.5 8l-4 3.5" />
      <path d="M20.5 16h-15M9.5 12.5 5.5 16l4 3.5" />
    </svg>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3.5 4 8l8 4.5 8-4.5Z" />
      <path d="M4 12.5 12 17l8-4.5" />
      <path d="M4 16.5 12 21l8-4.5" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 6.5c-1.6-1.3-3.7-2-6-2-1 0-2 .1-2.5.3v13c.5-.2 1.5-.3 2.5-.3 2.3 0 4.4.7 6 2" />
      <path d="M12 6.5c1.6-1.3 3.7-2 6-2 1 0 2 .1 2.5.3v13c-.5-.2-1.5-.3-2.5-.3-2.3 0-4.4.7-6 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" />
    </svg>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 20.5V13M11 20.5V6.5M18 20.5v-9" />
      <path d="M3 20.5h18" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 10.5a6 6 0 1 1 12 0v3.5l1.5 3H4.5l1.5-3Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 4.5v15M4.5 12h15" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 20l.9-4.2L15.6 5.1a1.8 1.8 0 0 1 2.5 0l.8.8a1.8 1.8 0 0 1 0 2.5L8.2 19.1 4 20Z" />
      <path d="M13.8 6.9l3.3 3.3" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 5.5h16L14 13v6l-4 2v-8Z" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m15.5 5.5-7 6.5 7 6.5" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
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
