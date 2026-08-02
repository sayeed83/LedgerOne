# Backend Checklist

**Purpose:** Reusable checklist applied when writing or reviewing server-side/application code, to catch common issues before merge.

**When it should be used:** During self-review before opening a PR, and during formal reviews logged in [../reviews/backend/](../reviews/backend/).

---

- [ ] Business rules match [00_BUSINESS_RULES.md](../../00_BUSINESS_RULES.md) and any relevant ADRs
- [ ] Inputs validated at system boundaries (API layer), not re-validated deep in internal code
- [ ] Errors handled explicitly; no silently swallowed exceptions
- [ ] Transactions/atomicity correct for multi-step ledger-affecting operations
- [ ] No hardcoded secrets, credentials, or environment-specific values
- [ ] Logging present for key operations without leaking sensitive data
- [ ] Unit and integration tests cover the happy path and key edge cases
- [ ] No dead code or leftover debug statements
