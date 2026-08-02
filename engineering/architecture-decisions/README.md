# architecture-decisions/

## Purpose
Durable, numbered records of significant architectural decisions made on LedgerOne — the "why" behind the system's structure, so decisions aren't silently reversed, re-litigated, or forgotten as the team and codebase change over time.

## Contents
- [TEMPLATE.md](TEMPLATE.md) — the blank ADR template to copy for a new decision.
- `ADR-001.md`, `ADR-002.md`, ... — individual ADRs, numbered sequentially in the order they were accepted. Each covers one decision: the context, the options considered, the decision made, and its consequences.

## When it should be used
Create a new ADR when:
- Choosing between materially different architectural approaches (e.g. a data model shape, a module boundary, a sync vs. async processing model).
- Making a decision that will be expensive to reverse or that future contributors are likely to question ("why did we do it this way?").
- Introducing or removing a significant dependency, framework, or cross-cutting pattern.

Do **not** create an ADR for routine implementation choices, bug fixes, or anything easily reversible — those belong in code comments, PR descriptions, or [../prompts/](../prompts/).

## Conventions
- Number sequentially; never reuse or renumber a number, even if a decision is later reversed.
- Never delete an ADR. If a decision is superseded, mark the old ADR's status as "Superseded by ADR-XXX" and link to the replacement.
- Keep each ADR focused on a single decision.
