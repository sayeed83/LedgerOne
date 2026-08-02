# Release Checklist

**Purpose:** Final gate before releasing a build to staging/production — confirms all relevant reviews and checks have actually happened, not just that code compiles.

**When it should be used:** Before every release/deployment.

---

- [ ] All included modules pass [../implementation/module-checklist.md](../implementation/module-checklist.md)
- [ ] Backend, frontend, database, and security checklists satisfied for changed areas
- [ ] Performance review completed for performance-sensitive changes
- [ ] All automated tests passing in CI
- [ ] Migrations tested and rollback plan confirmed
- [ ] No open Critical/High severity findings in [../reviews/](../reviews/)
- [ ] Release notes/changelog updated
- [ ] Rollback plan for the release itself documented
