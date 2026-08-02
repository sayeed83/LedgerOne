# prompts/

## Purpose
Houses the AI prompts used to drive implementation of LedgerOne, organized by module and engineering phase so that prompt history mirrors the build order of the system.

## Contents
Numbered subfolders, one per phase/module area, plus an `archive/` for retired prompts:

| Folder | Purpose |
|---|---|
| [00_setup/](00_setup/) | Repository, tooling, environment, and project scaffolding prompts |
| [01_foundation/](01_foundation/) | Core domain primitives shared across the system (e.g. base entities, ledger fundamentals) |
| [02_platform/](02_platform/) | Cross-cutting platform concerns (auth, tenancy, config, infrastructure) |
| [03_accounting/](03_accounting/) | Accounting module prompts (chart of accounts, journal entries, ledgers) |
| [04_inventory/](04_inventory/) | Inventory module prompts (items, stock, warehouses) |
| [05_sales/](05_sales/) | Sales module prompts (invoices, customers, sales orders) |
| [06_purchase/](06_purchase/) | Purchase module prompts (bills, vendors, purchase orders) |
| [07_banking/](07_banking/) | Banking module prompts (accounts, reconciliation, transactions) |
| [08_reports/](08_reports/) | Reporting and analytics prompts |
| [09_testing/](09_testing/) | Test generation and test-strategy prompts |
| [10_refactoring/](10_refactoring/) | Prompts for refactors, cleanups, and technical-debt work |
| [11_reviews/](11_reviews/) | Prompts used to drive AI-assisted code review sessions |
| [archive/](archive/) | Retired or superseded prompts, kept for historical reference |

## When to use
- Add a new prompt file to the relevant numbered folder before starting AI-assisted implementation work on that area.
- Follow the numeric order for foundational/sequential work — later modules generally assume earlier ones exist.
- When a prompt has been fully executed and is no longer the current approach, move it to `archive/` instead of deleting it.
