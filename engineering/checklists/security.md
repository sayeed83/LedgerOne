# Security Checklist

**Purpose:** Reusable checklist applied when writing or reviewing any code that touches authentication, authorization, sensitive data, or external input.

**When it should be used:** For any change touching auth, tenancy, financial data, or input handling, and during reviews logged in [../reviews/security/](../reviews/security/).

---

- [ ] No injection vulnerabilities (SQL, command, XSS) in new code paths
- [ ] Authorization checks present on every endpoint/action that needs them, not just authentication
- [ ] Multi-tenant data access properly scoped (no cross-tenant data leakage)
- [ ] Secrets/credentials not committed or logged
- [ ] Sensitive financial/PII data encrypted at rest and in transit where required
- [ ] Dependencies free of known critical vulnerabilities
- [ ] Input from users/external systems validated and sanitized
- [ ] Audit trail preserved for financially significant actions
