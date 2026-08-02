# API Checklist

**Purpose:** Reusable checklist applied when designing or reviewing API endpoints/contracts.

**When it should be used:** When adding or changing an API endpoint, and during backend or architecture reviews that touch API contracts.

---

- [ ] Endpoint follows existing naming and resource conventions
- [ ] Request/response shapes documented (see [../templates/api.md](../templates/api.md))
- [ ] Authentication and authorization requirements defined
- [ ] Input validation and error responses are consistent with existing API error format
- [ ] Backward compatibility considered; breaking changes are versioned or flagged
- [ ] Pagination/filtering defined for list endpoints where relevant
- [ ] Rate limiting/abuse considerations addressed where relevant
- [ ] Tests cover success, validation failure, and authorization failure cases
