# CLAUDE.md — engineering/

This file gives Claude (and other AI assistants) operating instructions specific to the `engineering/` directory.

## Scope

`engineering/` is documentation and process only:
- No application source code belongs here.
- No changes to application architecture should be made *from* this directory — architectural decisions are *recorded* here (as ADRs) but *implemented* in the application source tree.
- Prompts, plans, reviews, checklists, and templates are the only expected content types.

## How to work in this directory

1. **Before starting implementation work**, read [implementation/current-phase.md](implementation/current-phase.md) and the corresponding numbered folder under [prompts/](prompts/).
2. **Before making an architectural decision** (new pattern, new dependency, schema-affecting change, cross-module contract), check [architecture-decisions/](architecture-decisions/) for an existing ADR. If none exists and the decision is significant, create one using [architecture-decisions/TEMPLATE.md](architecture-decisions/TEMPLATE.md).
3. **When a prompt is executed and superseded** (module shipped, approach changed), move it to [prompts/archive/](prompts/archive/) rather than deleting it — prior prompts are useful history for understanding why code looks the way it does.
4. **After a code review**, record findings under [reviews/](reviews/) in the matching discipline folder (architecture, backend, frontend, database, security, performance), using [templates/review.md](templates/review.md).
5. **Before merging or releasing**, run through the relevant [checklists/](checklists/) file.

## Conventions

- File naming: numbered prefixes (`00_`, `01_`, ...) indicate sequence, not priority — follow them in order for foundational work.
- ADRs are numbered sequentially (`ADR-001.md`, `ADR-002.md`, ...) and are never renumbered or deleted once accepted; a superseded ADR is marked as such in its own file and linked to its replacement.
- Keep entries concise and dated. This is a working engineering log, not marketing copy.
- Do not fabricate history — only record decisions, reviews, and plans that actually occurred or are actually planned.
