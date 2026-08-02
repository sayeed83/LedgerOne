# API Template

**Purpose:** Blank template for documenting a single API endpoint's contract.

**When it should be used:** Copy this file when designing or documenting a new API endpoint. Pair with [../checklists/api.md](../checklists/api.md) during review.

---

## `<METHOD> /path/to/resource`

### Description
What this endpoint does and why it exists.

### Authentication / Authorization
Who can call this and what permissions are required.

### Request

```
<headers, path/query params, body shape>
```

### Response

```
<success response shape, status code>
```

### Errors

| Status | Condition |
|---|---|
| 400 | |
| 401 | |
| 403 | |
| 404 | |
| 409 | |

### Notes
Edge cases, rate limits, pagination behavior, idempotency guarantees.
