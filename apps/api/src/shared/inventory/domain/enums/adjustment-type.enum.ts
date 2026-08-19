/** Mirrors 00_BUSINESS_RULES.md Ch.44.3's "adjustment quantity (positive or negative)" as an explicit direction flag (05_CODING_STANDARDS.md Ch.26.4), alongside an always-positive `quantity` magnitude on the entity itself. */
export enum AdjustmentType {
  Increase = "INCREASE",
  Decrease = "DECREASE",
}
