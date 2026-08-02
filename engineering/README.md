# LedgerOne Engineering

This directory is the engineering knowledge base for LedgerOne. It holds AI prompts, architecture decisions, implementation plans, code reviews, checklists, and templates used to build and evolve the system.

It contains **no application code**. It exists alongside the application source so that engineering process, decisions, and history live in the same repository as the code they govern, version-controlled and reviewable like everything else.

## Why this exists

- Give AI assistants (and human engineers) a consistent, structured place to find prompts, standards, and prior decisions instead of re-deriving them each session.
- Preserve the reasoning behind architectural choices (ADRs) so decisions aren't silently reversed or forgotten.
- Track implementation progress against a roadmap so "what phase are we in" has one authoritative answer.
- Standardize code review and quality checks across backend, frontend, database, security, and performance concerns.

## Structure

| Folder | Purpose |
|---|---|
| [prompts/](prompts/) | AI prompts organized by module/phase, used to drive implementation work with AI assistants |
| [architecture-decisions/](architecture-decisions/) | ADRs — durable records of significant architectural decisions and their rationale |
| [implementation/](implementation/) | Roadmap, milestones, current phase tracking, and module completion checklist |
| [reviews/](reviews/) | Point-in-time code review records, organized by discipline |
| [checklists/](checklists/) | Reusable checklists applied before merging or releasing work |
| [templates/](templates/) | Blank templates for creating new modules, ADRs, reviews, and API/database specs |

Each subfolder has its own README (or is documented below/in this file) describing its purpose, contents, and when to use it in more detail.

## How to use this directory

- **Starting new work?** Check [implementation/current-phase.md](implementation/current-phase.md) and the relevant [prompts/](prompts/) subfolder.
- **Making an architectural choice?** Write an ADR in [architecture-decisions/](architecture-decisions/) using [TEMPLATE.md](architecture-decisions/TEMPLATE.md).
- **Reviewing code?** Use the matching checklist in [checklists/](checklists/) and log the review in [reviews/](reviews/).
- **Starting a new module?** Copy [templates/module.md](templates/module.md) and follow [implementation/module-checklist.md](implementation/module-checklist.md).

See [CLAUDE.md](CLAUDE.md) for AI-assistant-specific operating instructions when working within this repository.
