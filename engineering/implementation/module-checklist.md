# Module Checklist

**Purpose:** A repeatable checklist applied to every module (accounting, inventory, sales, purchase, banking, reports, etc.) to confirm it is genuinely complete — not just "code written" but reviewed, tested, and documented.

**Contents:** A per-module checklist template plus a tracking table of which modules have satisfied it.

**When it should be used:** Run through this checklist before declaring a module "Done" in [roadmap.md](roadmap.md). Use [../templates/module.md](../templates/module.md) when starting a module, and this checklist when finishing one.

---

## Checklist (per module)

- [ ] Domain model and business rules documented
- [ ] Relevant ADR(s) written for any non-trivial design decisions
- [ ] Implementation complete against the module's prompt(s) in [../prompts/](../prompts/)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Backend review completed ([../reviews/backend/](../reviews/backend/))
- [ ] Database review completed, if schema changed ([../reviews/database/](../reviews/database/))
- [ ] Frontend review completed, if UI involved ([../reviews/frontend/](../reviews/frontend/))
- [ ] Security review completed ([../reviews/security/](../reviews/security/))
- [ ] Performance review completed, if performance-sensitive ([../reviews/performance/](../reviews/performance/))
- [ ] Relevant [../checklists/](../checklists/) items satisfied
- [ ] Documentation updated

## Module Status

| Module | Checklist Complete | Notes |
|---|---|---|
| Foundation | No | |
| Platform | No | |
| Accounting | No | |
| Inventory | No | |
| Sales | No | |
| Purchase | No | |
| Banking | No | |
| Reports | No | |
