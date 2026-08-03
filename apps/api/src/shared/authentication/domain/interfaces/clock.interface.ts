// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2) —
// lets Business-layer logic ask "what time is it" without depending on the
// system clock directly, per 05_CODING_STANDARDS.md Ch.20's `deps.clock.now()`
// pattern. Kept trivial on purpose so tests can supply a fixed instant.
export interface IClock {
  now(): Date;
}
