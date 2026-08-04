// Tiny classname joiner — avoids adding `clsx`/`tailwind-merge` as a new
// dependency (02_TECH_STACK.md is frozen); this is the entire feature set
// every component in this package actually needs.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
