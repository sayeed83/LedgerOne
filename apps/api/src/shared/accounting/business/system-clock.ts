import { IClock } from "../domain/interfaces/clock.interface";

// Business-layer collaborator, not a Domain object itself (it wraps a real
// side effect, `new Date()`) — mirrors Authentication's own
// `business/security/system-clock.ts` placement exactly.
export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
