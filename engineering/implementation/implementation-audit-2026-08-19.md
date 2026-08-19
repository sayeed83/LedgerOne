# LedgerOne Implementation Status
As of: 19 August 2026

**Source:** Compiled strictly from `engineering/implementation/current-phase.md` and `00_BUSINESS_RULES.md`. Only work explicitly recorded as completed in those two files is listed here. Where a detail is not itemized in the source (e.g. exact Organization/Authentication table names, Chart of Accounts routes, Accounting screen names), it is flagged rather than guessed.

---

## Module Progress

| Module | Status |
|---|---|
| Organization (Tenant, Company, Branch, Department) | ✅ Completed |
| Authentication (credentials, sessions, login, passwords, MFA) | ✅ Completed |
| User Management (profile, status, personal information) | ✅ Completed |
| Authorization (roles, permissions) | ✅ Completed |
| Accounting (Financial Year → Ledger, Financial Reports) | ✅ Completed |
| Inventory (Product Category, Unit, Product, Warehouse, Stock, Stock Movement, Inventory Adjustment) | 🟡 In Progress |
| Batch / Serial Numbers / Reorder Levels / Stock Valuation, Sales, Purchases, Banking, GST extensions, CRM, HR/Payroll, Reports/Dashboards, Platform utilities | ⬜ Not Started |

---

## Inventory Progress

| Chapter | Database | Repository | Business | Presentation | Integration Tests | Frontend |
|---|---|---|---|---|---|---|
| Ch.34 – Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ch.35 – Product Categories | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ |
| Ch.36 – Units | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ch.37 – Warehouses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ch.38 – Stock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ch.39 – Stock Movement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (view-only, no edit — immutable) |
| Ch.44 – Inventory Adjustment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Additional: Stock Movement → Stock on-hand quantity propagation (atomic transaction wiring stock movement postings into real `stocks` balance changes) is complete.

Not started: Ch.40 Batch, Ch.41 Serial Numbers, Ch.42 Reorder Levels, Ch.43 Stock Valuation.

---

## Completed Database Tables

| # | Table | Module |
|---|---|---|
| 1 | product_categories | Inventory |
| 2 | units | Inventory |
| 3 | products | Inventory |
| 4 | warehouses | Inventory |
| 5 | stocks | Inventory |
| 6 | inventory_adjustments | Inventory |
| 7 | stock_movements | Inventory |
| 8 | financial_years | Accounting |
| 9 | fiscal_periods | Accounting |
| 10 | currencies | Accounting |
| 11 | exchange_rates | Accounting |
| 12 | tax_groups | Accounting |
| 13 | tax_rules | Accounting |
| 14 | account_groups | Accounting |
| 15 | accounts | Accounting |
| 16 | journal_entries | Accounting |
| 17 | journal_entry_lines | Accounting |
| 18 | ledger_entries | Accounting |
| 19 | roles | Authorization |
| 20 | permissions | Authorization |
| 21 | role_permissions | Authorization |
| 22 | user_roles | Authorization |
| 23 | users | User Management |

*(Organization's Tenant/Company/Branch/Department tables and Authentication's tables exist and are frozen, but current-phase.md does not spell out their literal table names.)*

---

## Completed API Endpoints

| Module / Entity | Endpoints |
|---|---|
| Product Categories | POST /product-categories · GET /product-categories · GET /product-categories/:uuid · PUT /product-categories/:uuid |
| Units | POST /units · GET /units · GET /units/base-units · GET /units/:uuid · PUT /units/:uuid |
| Products | POST /products · GET /products · GET /products/:uuid · PUT /products/:uuid |
| Warehouses | POST /warehouses · GET /warehouses · GET /warehouses/:uuid · PUT /warehouses/:uuid |
| Stock | POST /stocks · GET /stocks · GET /stocks/:uuid · PUT /stocks/:uuid |
| Stock Movements | POST /stock-movements · GET /stock-movements · GET /stock-movements/:uuid *(no update/delete — immutable)* |
| Inventory Adjustments | POST /adjustments · GET /adjustments · GET /adjustments/:uuid · PUT /adjustments/:uuid |
| Financial Year | create/get/update/list, open/close/reopen (7) |
| Fiscal Period | create/get/update/list, soft-close/close/reopen (7) |
| Currency | create/get/update/list, activate/deactivate (6, no X-Tenant-Id) |
| Exchange Rate | create/get/list (3, no update/delete — immutable) |
| Tax Group | create/get/update/list (4) |
| Tax Rule | create/get/list (3, no update/delete — immutable) |
| Journal Entry | create/get/update/list, submit/reject/post/reverse (8) |
| Ledger (read-only) | GET /ledger · GET /ledger/accounts/:uuid · GET /ledger/entries/:uuid |
| Chart of Accounts | Complete per 2026-08-18 correction entry; routes not itemized |
| Role | create/get/update/retire/list |
| Permission | GET /permissions (?moduleName=) |
| Role Permissions | list/assign/remove |
| User Roles | list/assign/remove |
| User Management | create, invite, get, update, activate, suspend, deactivate, list, search (9) |

---

## Completed Frontend Screens

| Entity | Screens |
|---|---|
| Units | List, Detail (with edit) |
| Products | List, Detail (with edit) |
| Warehouses | List, Detail (with edit) |
| Stock | List, Detail (with edit) |
| Stock Movement | List, Detail (view-only, immutable) |
| Inventory Adjustment | List, Detail (with edit) |
| Product Category | None — not started |
| Accounting | Screens exist per correction entry; names not itemized |

---

## Completed Shared Types

| File | Notes |
|---|---|
| unit.dto.ts | |
| product.dto.ts | |
| product-category.dto.ts | Response DTO only — backs ProductCategorySelect |
| warehouse.dto.ts | |
| stock.dto.ts | |
| stock-movement.dto.ts | |
| inventory-adjustment.dto.ts | |
| index.ts | Aggregate export |

---

## Completed Hooks

| Entity | Hooks |
|---|---|
| Unit | use-units, use-unit, use-create-unit, use-update-unit, use-base-units |
| Product | use-products, use-product, use-create-product, use-update-product |
| Warehouse | use-warehouses, use-warehouse, use-create-warehouse, use-update-warehouse |
| Stock | use-stocks, use-stock, use-create-stock, use-update-stock |
| Stock Movement | use-stock-movements, use-stock-movement, use-create-stock-movement |
| Inventory Adjustment | use-inventory-adjustments, use-inventory-adjustment, use-create-inventory-adjustment, use-update-inventory-adjustment |
| Shared | use-companies-for-select (module-local duplicate, ARCH-004) |

---

## Completed Forms

| Form | Notes |
|---|---|
| UnitForm.tsx | |
| ProductForm.tsx | |
| WarehouseForm.tsx | |
| StockForm.tsx | |
| StockMovementForm.tsx | Create-only — immutable |
| InventoryAdjustmentForm.tsx | |

Supporting: BaseUnitSelect, ProductCategorySelect, UnitSelect, WarehouseSelect, ProductSelect, CompanySelect, CompanyContextBar.

---

## Completed Integration Tests

| Suite | Tests |
|---|---|
| inventory.routes.spec.ts (Product Category) | 18 |
| unit.routes.spec.ts | 24 |
| product.routes.spec.ts | 22 |
| warehouse.routes.spec.ts | 19 |
| stock.routes.spec.ts | — |
| stock-movement.routes.spec.ts | — |
| inventory-adjustment.routes.spec.ts | — |
| accounting.routes.spec.ts | Continuously extended (Financial Year, Fiscal Period, Currency/Exchange Rate, Tax, Journal Entry, Ledger) |
| authorization.routes.spec.ts | Dedicated suite |
| user-management routes.spec.ts | Dedicated suite |

Latest recorded total: **1,053 tests, 168 suites** passing.

---

## Current Statistics

| Metric | Value |
|---|---|
| Database Tables | 22 explicitly named (Organization/Authentication not itemized) |
| Domain Entities/Aggregates | 23 explicitly named |
| Repositories | 4 named repository classes |
| Business Services | Not determinable as one total (per-entity only) |
| API Endpoints | ≈90+ determinable (Chart of Accounts/Authentication not itemized) |
| Integration Test Suites | 7 Inventory + 1 Accounting + Authorization + User Management |
| Frontend Screens | 12 (6 Inventory entities × List+Detail) |
| React Hooks | 25 (Inventory) |
| Shared DTOs | 8 (Inventory) |
| Navigation Pages | 6 (Inventory) |

---

## Remaining Work

(exact chapter order per `00_BUSINESS_RULES.md`, picking up immediately after the last completed items)

| Order | Chapter |
|---|---|
| 1 | Ch.8 — Time Zone |
| 2 | Ch.9 — Business Locations |
| 3 | Ch.13 — Approval Workflow |
| 4 | Ch.14 — Delegation |
| 5 | Ch.15 — Accounting Principles |
| 6 | Ch.16 — Double Entry System |
| 7 | Ch.21 — Voucher |
| 8 | Ch.22 — Voucher Types |
| 9 | Ch.23 — Posting Rules |
| 10 | Ch.24 — Trial Balance |
| 11 | Ch.25 — Profit & Loss |
| 12 | Ch.26 — Balance Sheet |
| 13 | Ch.27 — Cash Flow |
| 14 | Ch.28 — Cost Centers |
| 15 | Ch.29 — Budgets |
| 16 | Ch.30 — Multi Currency |
| 17 | Ch.32 — Financial Closing |
| 18 | Ch.33 — Audit Trail |
| 19 | Ch.35 — Product Categories (Frontend only) |
| 20 | Ch.40 — Batch |
| 21 | Ch.41 — Serial Numbers |
| 22 | Ch.42 — Reorder Levels |
| 23 | Ch.43 — Stock Valuation |
| 24 | Ch.45 — Customer |
| 25 | Ch.46 — Price List |
| 26 | Ch.47 — Quotation |
| 27 | Ch.48 — Sales Order |
| 28 | Ch.49 — Delivery |
| 29 | Ch.50 — Invoice |
| 30 | Ch.51 — Credit Note |
| 31 | Ch.52 — Sales Return |
| 32 | Ch.53 — Collections |
| 33 | Ch.54 — Vendor |
| 34 | Ch.55 — Purchase Request |
| 35 | Ch.56 — Purchase Order |
| 36 | Ch.57 — Goods Receipt |
| 37 | Ch.58 — Purchase Invoice |
| 38 | Ch.59 — Debit Note |
| 39 | Ch.60 — Purchase Return |
| 40 | Ch.61 — Bank Accounts |
| 41 | Ch.62 — Receipts |
| 42 | Ch.63 — Payments |
| 43 | Ch.64 — Reconciliation |
| 44 | Ch.65 — Cheques |
| 45 | Ch.66 — GST |
| 46 | Ch.69 — Reverse Charge |
| 47 | Ch.70 — Input Tax Credit |
| 48 | Ch.71 — Leads |
| 49 | Ch.72 — Opportunities |
| 50 | Ch.73 — Activities |
| 51 | Ch.74 — Customers (CRM Context) |
| 52 | Ch.75 — Employees |
| 53 | Ch.76 — Attendance |
| 54 | Ch.77 — Leave |
| 55 | Ch.78 — Payroll |
| 56 | Ch.79 — Salary |
| 57 | Ch.80 — Payslip |
| 58 | Ch.82 — Operational Reports |
| 59 | Ch.83 — Dashboards |
| 60 | Ch.84 — KPIs |
| 61 | Ch.85 — Audit |
| 62 | Ch.86 — Notifications |
| 63 | Ch.87 — Attachments |
| 64 | Ch.88 — Imports |
| 65 | Ch.89 — Exports |
| 66 | Ch.90 — API Integrations |
