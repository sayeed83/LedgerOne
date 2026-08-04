// Single, structured Pino logger instance for the whole app
// (05_CODING_STANDARDS.md Ch.23.1 — "Pino for all structured logging — no
// `console.log` in application code"). The `mixin` attaches the current
// request's correlation ID (correlation-context.ts) to every log line
// emitted while that request is in flight, without every call site having
// to pass it explicitly.
import pino from "pino";
import { getCorrelationId } from "./correlation-context";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  mixin() {
    const correlationId = getCorrelationId();
    return correlationId ? { correlationId } : {};
  },
});
