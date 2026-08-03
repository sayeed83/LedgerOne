import { IClock } from "../../domain/interfaces/clock.interface";

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
