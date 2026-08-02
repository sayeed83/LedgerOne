# Database Checklist

**Purpose:** Reusable checklist applied when designing schema or writing migrations.

**When it should be used:** Whenever a schema change or migration is written, and during reviews logged in [../reviews/database/](../reviews/database/).

---

- [ ] Schema change documented (see [../templates/database.md](../templates/database.md))
- [ ] Migration is reversible or a rollback plan is documented
- [ ] Constraints (NOT NULL, foreign keys, unique) reflect actual business rules
- [ ] Indexes added for new query patterns; no redundant indexes
- [ ] Migration tested against a realistic data volume, not just an empty database
- [ ] No destructive operations (drops, truncations) without explicit confirmation and backup plan
- [ ] Ledger/financial integrity constraints preserved (no changes that could break double-entry invariants)
