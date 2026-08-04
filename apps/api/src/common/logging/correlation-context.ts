// Request-scoped correlation ID storage (05_CODING_STANDARDS.md Ch.23.2 —
// "log at module/request boundaries with correlation/request IDs for
// traceability"). AsyncLocalStorage so any code running within a request's
// call stack — including code that doesn't have `req` in scope, e.g. a
// Repository or a background `await` chain — can still attach the current
// request's correlation ID to a log line, without threading it through
// every function signature.
import { AsyncLocalStorage } from "async_hooks";

const correlationIdStorage = new AsyncLocalStorage<string>();

export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationIdStorage.run(correlationId, fn);
}

export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}
