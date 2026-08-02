# Database Template

**Purpose:** Blank template for documenting a schema change or new table before/alongside implementing a migration.

**When it should be used:** Copy this file when adding or significantly altering a table. Pair with [../checklists/database.md](../checklists/database.md) during review.

---

## Table: `<table_name>`

### Purpose
What this table represents and why it exists.

### Columns

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | | PK | |

### Relationships
Foreign keys and what they reference.

### Indexes
Which columns are indexed and why (query patterns they support).

### Migration Notes
Reversibility, data backfill needs, expected volume/performance impact.
