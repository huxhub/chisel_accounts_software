# Chisel — Vendor/Customer Ledger System Implementation Plan

## 0. Goal (recap)

Replace the current disconnected "Vendor Tally" (Purchase/Sale list with no bank link) with a real
double-entry style Ledger system where:

- Every **Purchase** posts to a **Vendor ledger** (amount owed *to* them).
- Every **Sale** posts to a **Customer ledger** (amount owed *by* them).
- **Payment** (to vendor) and **Receipt** (from customer) are the only actions that touch a
  Bank/Cash **Account**, and they do it automatically — reducing/increasing the account balance and
  creating a normal transaction row in that account's existing table (same as Image 4's bank page).
- **Profit** = Total Sales − Total Purchases over a period, computed via a report, not stored on
  any single row.
- **Transaction Summary** (all-transactions-across-everything view) stays — it's useful and unrelated
  to the Vendor Tally problem. It just needs to also include Payment/Receipt vouchers once those exist,
  since they generate real Transaction rows.

---

## 1. What gets REMOVED

| Item | Location | Why |
|---|---|---|
| "Vendor Tally" sidebar link | Sidebar (Image 1) | Replaced by "Ledgers" |
| "Vendors" top-bar button | Top bar (Image 4) | Replaced by "Ledgers" |
| Vendor Tally page (Purchased/Sold/Receivable summary table) | Full page (Image 2) | No bank linkage, manual receivable calc — replaced by per-ledger statement pages |
| "Add Vendor Entry" modal (Purchase/Sale toggle only, no account field) | Modal (Image 3) | Replaced by 4-way Voucher modal with account field for Payment/Receipt |
| `Vendor` + `VendorEntry` tables (as currently structured) | Backend/DB | Replaced by `Ledger` + `Voucher` (migrated, not deleted — see §3) |
| `/api/vendors`, `/api/vendors/:id/entries` routes | Backend | Replaced by `/api/ledgers`, `/api/vouchers` |

**Keep as-is, no changes needed:**
- Dashboard, Reminders, **Transaction Summary**, Companies/Banks/Cash/Overdrafts sidebar sections,
  Inter-Company Transfer, Monthly Report, Bank detail page layout (Image 4) — this layout is reused,
  not replaced.

---

## 2. What gets ADDED

### 2.1 Sidebar
```
LEDGERS                          [+]
  Vendors    ›
  Customers  ›
```
Same collapsible style as COMPANIES/BANKS/CASH.

### 2.2 Top bar
Replace "Vendors" button with **"Ledgers"**.

### 2.3 New "Ledgers" page (two tabs)
**Vendors tab**
| Vendor | Total Purchased | Total Paid | Balance Due |
|---|---|---|---|

**Customers tab**
| Customer | Total Sold | Total Received | Balance Due |
|---|---|---|---|

Click a row → **Ledger Statement** page, same visual pattern as the Bank detail page (Image 4):
- Cards: Opening Balance / Total Dr / Total Cr / Closing Balance
- Table: Date, Description, Voucher Type, Ref No, Debit, Credit, Running Balance

### 2.4 New "Add Entry" modal (replaces old Add Vendor Entry modal)
```
SELECT LEDGER  [Vendor ▾ / Customer ▾]
[Purchase] [Sale] [Payment] [Receipt]     ← 4-way toggle

Purchase / Sale fields:
  Date, Item Name, Amount, Note

Payment / Receipt fields:
  Date, Amount
  PAY FROM / RECEIVE INTO: [Bank/Cash Account ▾]   ← new, this is what auto-updates the bank
  Note
```

### 2.5 Reports — Profit card
Add to Monthly Report (or a new Reports section):
- Total Purchases, Total Sales, **Gross Profit** (Sales − Purchases), filterable by date range and
  optionally by Program.

### 2.6 Bank/Cash detail page (Image 4)
No structural change — Payment/Receipt vouchers simply create rows here automatically, same pattern
as Inter-Company Transfer's `EX-xxxxxx` ref style (use `PAY-xxxxxx` / `REC-xxxxxx`).

### 2.7 Transaction Summary
No structural change — since Payment/Receipt vouchers create real `Transaction` rows, they'll appear
here automatically once wired up. Just confirm the filter dropdown includes the new description/ref
patterns (`PAY-`, `REC-`) as recognizable types.

---

## 3. Database changes

```
Ledger                                    (replaces Vendor)
  id              PK
  name            string
  type            enum('vendor','customer')
  openingBalance  double   default 0
  openingType     enum('debit','credit')
  createdAt / updatedAt

Voucher                                   (replaces VendorEntry)
  id              PK
  type            enum('purchase','sale','payment','receipt')
  date            string
  ledgerId        FK -> Ledger
  accountId       FK -> Account   (nullable — only used for payment/receipt)
  itemName        string          (purchase/sale only)
  amount          double
  reference       string          (e.g. PAY-759492, mirrors existing Exchange ref pattern)
  note            string
  programId       FK -> Program   (nullable, reuse existing cost-tagging)
  document        json            (reuse existing attachment support)
  createdAt / updatedAt
```

**Migration steps:**
1. Create `Ledger`, `Voucher` tables.
2. Migrate existing `Vendor` rows → `Ledger` rows with `type='vendor'`.
3. Migrate existing `VendorEntry` rows → `Voucher` rows (`purchase`/`sale` types), `accountId=null`.
4. Keep old tables until migration is verified, then drop.

**Balance formulas (computed on read, not stored):**
```
Vendor ledger balance   = openingBalance + Σ(purchase amounts) − Σ(payment amounts)
Customer ledger balance = openingBalance + Σ(sale amounts) − Σ(receipt amounts)
```

---

## 4. Backend logic

### Posting rules

| Voucher | Ledger effect | Account effect |
|---|---|---|
| Purchase | + to Vendor balance owed | none |
| Payment | − from Vendor balance owed | − from Account, auto `Transaction` row (`"Payment to <vendor>"`) |
| Sale | + to Customer balance owed | none |
| Receipt | − from Customer balance owed | + to Account, auto `Transaction` row (`"Receipt from <customer>"`) |

Payment/Receipt must be wrapped in a single DB transaction so the `Voucher` insert and the `Account`
`Transaction` insert succeed or fail together — same pattern already used for Inter-Company Transfer.

### New API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/ledgers?type=vendor\|customer` | list/create ledgers |
| `GET` | `/api/ledgers/:id/statement` | running Dr/Cr/balance table |
| `POST` | `/api/vouchers` | create voucher, does the posting per table above |
| `GET` | `/api/vouchers?ledgerId=` | list vouchers for a ledger |
| `DELETE` | `/api/vouchers/:id` | reverse posting; delete linked `Transaction` if payment/receipt |
| `GET` | `/api/reports/profit?from=&to=` | Σsales − Σpurchases for period |

### Removed endpoints
- `/api/vendors`, `POST/DELETE /api/vendors/:id/entries` (superseded by `/api/ledgers`, `/api/vouchers`)

---

## 5. Frontend changes

- New hook `useLedgerController` (mirrors `useAccountsController`): `ledgers`, `vouchers`,
  `createVoucher`, `getStatement`, `createLedger`.
- New components: `LedgersPage`, `LedgerStatementView`, `VoucherModal` (4-way type switcher).
- Remove: `VendorsPage` (Vendor Tally), `VendorEntryModal`.
- Sidebar: swap "Vendor Tally" link for "Ledgers" section (Vendors/Customers).
- Top bar: swap "Vendors" button for "Ledgers".
- Reports/Monthly Report: add Profit card.
- Account detail page & Transaction Summary: no changes, just confirm new `PAY-`/`REC-` rows render
  and filter correctly.

---

## 6. Build order

1. DB migration: `Ledger`, `Voucher` tables + data migration from `Vendor`/`VendorEntry`.
2. Backend: voucher posting logic for all 4 types (Payment/Receipt wrapped with Account transaction insert).
3. Backend: `GET /api/ledgers/:id/statement` (running balance query).
4. Backend: `GET /api/reports/profit`.
5. Frontend: `LedgersPage` (Vendors/Customers tabs) + `LedgerStatementView`.
6. Frontend: `VoucherModal` (Purchase/Sale first, then wire Payment/Receipt with Account picker).
7. Frontend: sidebar + top-bar swap (remove Vendor Tally, add Ledgers).
8. Frontend: Profit card in Monthly Report.
9. Verify Transaction Summary and Bank detail pages correctly display auto-generated Payment/Receipt rows.
10. Remove old `VendorsPage`, `VendorEntryModal`, and deprecated `/api/vendors` routes once verified.
