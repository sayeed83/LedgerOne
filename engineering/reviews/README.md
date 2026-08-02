# reviews/

## Purpose
Point-in-time records of code reviews performed on LedgerOne, organized by discipline. These are the *findings and outcomes* of reviews — the prompts used to conduct AI-assisted reviews live separately in [../prompts/11_reviews/](../prompts/11_reviews/).

## Contents
| Folder | Purpose |
|---|---|
| [architecture/](architecture/) | Reviews of overall system design, module boundaries, and cross-cutting structure |
| [backend/](backend/) | Reviews of server-side/application logic |
| [frontend/](frontend/) | Reviews of UI/client-side code |
| [database/](database/) | Reviews of schema design, migrations, and query patterns |
| [security/](security/) | Security-focused reviews (auth, data exposure, input handling, dependencies) |
| [performance/](performance/) | Performance-focused reviews (query plans, load behavior, bottlenecks) |

Each review should be a dated file (e.g. `2026-08-03-invoice-module-backend-review.md`) using [../templates/review.md](../templates/review.md).

## When it should be used
Log a review here immediately after conducting it — whether AI-assisted or human — so findings and their resolution status are traceable. Reference the relevant [../checklists/](../checklists/) file used during the review.
