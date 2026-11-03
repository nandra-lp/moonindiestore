# MoonindieStore — UAT Test Cases Template

> **Format**: Markdown table (viewable in GitHub/GitLab) + CSV export for spreadsheet tools (Excel, Google Sheets, LibreOffice Calc).

---

## 📋 Test Case Summary

| Metric | Count |
|--------|-------|
| **Total Test Cases** | 42 |
| **Authentication** | 8 |
| **Customer (Pesan, Orders, Estimasi)** | 11 |
| **Admin (Product, Order Management)** | 11 |
| **Owner (Dashboard, Orders, Estimasi)** | 3 |
| **Non-Functional (Responsive, A11y, Security, etc.)** | 6 |
| **P1 (Blocker/Critical)** | 18 |
| **P2 (Major)** | 19 |
| **P3 (Minor)** | 3 |
| **P4 (Cosmetic)** | 2 |

---

## 🎯 Priority Legend

| Priority | Meaning | SLA |
|----------|---------|-----|
| **P1** | Blocker — core flow broken, no workaround | Fix before release |
| **P2** | Major — feature works but with significant issue | Fix before release or documented workaround |
| **P3** | Minor — cosmetic / edge case / nice-to-have | Can release with known issue |
| **P4** | Cosmetic — typo, alignment, micro-copy | Backlog |

---

## 📊 Test Cases

### Authentication (8 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| AUTH-01 | Authentication | Customer | Login | Valid login redirects to customer dashboard | P1 |
| AUTH-02 | Authentication | Customer | Login | Invalid credentials show error | P1 |
| AUTH-03 | Authentication | Customer | Register | New customer registration creates profile and logs in | P1 |
| AUTH-04 | Authentication | Customer | Authorization | Accessing admin page redirects to unauthorized | P1 |
| AUTH-05 | Authentication | Customer | Session | Session persists after refresh | P2 |
| AUTH-06 | Authentication | Customer | Logout | Logout clears session and redirects to login | P2 |
| AUTH-07 | Authentication | Admin | Login | Valid admin login redirects to admin dashboard | P1 |
| AUTH-08 | Authentication | Owner | Login | Valid owner login redirects to owner dashboard | P1 |

---

### Customer — Pesan Produk (6 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| CUST-01 | Customer | Customer | Product Catalog | Catalog displays products with images, prices, units | P1 |
| CUST-02 | Customer | Customer | Product Selection | Selecting product enables form fields | P1 |
| CUST-03 | Customer | Customer | File Upload | Reject file > 10 MB | P1 |
| CUST-04 | Customer | Customer | File Upload | Accept valid design file (JPG/PNG/PDF ≤ 10 MB) | P1 |
| CUST-05 | Customer | Customer | Validation | Submit without product shows error | P2 |
| CUST-06 | Customer | Customer | Create Order | Valid submission creates order and redirects | P1 |
| CUST-10 | Customer | Customer | Estimasi Link | `?estimasi=` param pre-fills form | P2 |
| CUST-11 | Customer | Customer | Direct Product Link | `?produk=` param selects product | P2 |

---

### Customer — Order List & Detail (4 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| CUST-07 | Customer | Customer | List Orders | Only logged-in customer's orders shown | P1 |
| CUST-08 | Customer | Customer | View Detail | Order detail shows progress, timeline, cost, items, design | P1 |
| CUST-09 | Customer | Customer | Cancel Order | Cancel button works for 'menunggu' status | P2 |

---

### Admin — Product Management (4 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| ADM-01 | Admin | Admin | List Products | Grid with realtime search & filter by jenis | P1 |
| ADM-02 | Admin | Admin | Add Product | Create product with image ≤ 2 MB | P1 |
| ADM-03 | Admin | Admin | Edit Product | Update product & replace image deletes old from Storage | P1 |
| ADM-04 | Admin | Admin | Delete Product | Confirmation modal deletes product & image | P1 |

---

### Admin — Order Management (7 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| ADM-05 | Admin | Admin | View Order Detail | Full detail: meta, progress, cost, manage, status, tracking, designs | P1 |
| ADM-06 | Admin | Admin | Progress Tracking | Progress bar % & timeline update correctly | P1 |
| ADM-07 | Admin | Admin | Mark Stage Complete | `'Tandai selesai'` updates existing `'berjalan'` record (no duplicate) | P1 |
| ADM-08 | Admin | Admin | Change Order Status | Pill buttons update status & auto-add tracking | P1 |
| ADM-09 | Admin | Admin | Manual Tracking | Add custom tracking entry appears in timeline | P2 |
| ADM-10 | Admin | Admin | Delete Order | Cascade delete: order, detail, produksi, tracking, design files | P1 |
| ADM-11 | Admin | Admin | Cleanup Obsolete Stages | Warning shows for non-standard tahap, cleanup removes them | P2 |

---

### Owner (3 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| OWN-01 | Owner | Owner | View Dashboard | Owner dashboard shows summary widgets | P2 |
| OWN-02 | Owner | Owner | View Order Detail Read-Only | Owner can view order detail but not edit progress/status | P2 |
| OWN-03 | Owner | Owner | View Estimasi List | Owner sees all customer estimasi | P2 |

---

### Estimasi (2 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| EST-01 | Estimasi | Customer | Calculate Estimate | Form calculates total_estimasi correctly | P2 |
| EST-02 | Estimasi | Customer | Save Estimate | Saved estimasi appears in list & usable for pesan | P2 |

---

### Non-Functional (6 cases)

| ID | Module | Role | Feature | Scenario | Priority |
|----|--------|------|---------|----------|----------|
| NF-01 | Non-Functional | All | Responsive Design | Layout works on mobile, tablet, desktop | P2 |
| NF-02 | Non-Functional | All | Accessibility | Keyboard nav, focus rings, ARIA, contrast | P2 |
| NF-03 | Non-Functional | All | Reduced Motion | Animations disabled when prefers-reduced-motion | P3 |
| NF-04 | Non-Functional | Customer | Error Handling | Permission denied shows actionable message | P2 |
| NF-05 | Non-Functional | All | Loading States | Skeleton loaders show during fetch | P2 |
| NF-06 | Non-Functional | All | Security Rules | Firestore rules enforce role-based access | P1 |

---

## 📥 CSV Columns (for Spreadsheet Import)

```csv
Test Case ID,Module,Role,Feature,Scenario,Preconditions,Test Steps,Expected Result,Test Data,Priority,Status,Actual Result,Bug ID,Evidence,Tester,Date Tested,Notes
```

**Columns explained:**

| Column | Purpose | Example |
|--------|---------|---------|
| **Test Case ID** | Unique identifier | `CUST-06` |
| **Module** | Functional area | `Customer`, `Admin`, `Authentication` |
| **Role** | User role executing test | `Customer`, `Admin`, `Owner`, `All` |
| **Feature** | Feature/sub-module | `Pesan Produk`, `Order Detail`, `Product Management` |
| **Scenario** | Short description | `Valid submission creates order and redirects` |
| **Preconditions** | Required state before test | `Product selected, valid inputs, linkage OK` |
| **Test Steps** | Numbered steps to execute | `1. Fill jumlah: 50\n2. Fill spesifikasi...` |
| **Expected Result** | Pass criteria | `Order created with status "menunggu"...` |
| **Test Data** | Specific data to use | `Valid form data`, `Seeded estimasi doc` |
| **Priority** | P1/P2/P3/P4 | `P1` |
| **Status** | **Fill during execution** | `Pass` / `Fail` / `Blocked` / `Not Run` |
| **Actual Result** | **Fill during execution** | `Order created but redirect failed` |
| **Bug ID** | Link to GitHub Issue | `#42` or `UAT-BUG-001` |
| **Evidence** | Screenshot/video path | `evidence/CUST-06_fail.png` |
| **Tester** | Name of tester | `Nandra` |
| **Date Tested** | Execution date | `2026-10-24` |
| **Notes** | Additional observations | `Works on Chrome, fails on Safari` |

---

## 🚀 How to Use

### 1. Import to Google Sheets / Excel
```bash
# Download CSV
cp UAT_Test_Cases.csv ~/Downloads/
# Open in Google Sheets: File → Import → Upload → Replace spreadsheet
```

### 2. Add Execution Columns
After import, add these columns if not present:
- `Status` (dropdown: Pass, Fail, Blocked, Not Run)
- `Actual Result` (text)
- `Bug ID` (text, link to GitHub Issue)
- `Evidence` (text, link to screenshot)
- `Tester` (text)
- `Date Tested` (date)
- `Notes` (text)

### 3. Filter Views (Recommended)
Create filter views per:
- **By Priority**: P1 first
- **By Role**: Customer / Admin / Owner / All
- **By Module**: Authentication, Customer, Admin, Owner, Estimasi, Non-Functional
- **By Status**: Not Run → In Progress → Pass/Fail

### 4. Daily Standup Dashboard
Add a pivot table:
```
Rows: Module, Priority
Values: Count of Test Case ID (group by Status)
```
→ Shows progress per area.

---

## ✅ Acceptance Criteria (Go/No-Go)

| Criteria | Threshold | Current |
|----------|-----------|---------|
| **P1 Pass Rate** | 100% (18/18) | — |
| **P2 Pass Rate** | ≥ 90% (≤ 2 fails with workaround) | — |
| **All Happy Paths** | 100% (AUTH, CUST-01..10, ADM-01..11) | — |
| **Accessibility** | Manual check pass | — |
| **Responsive** | 3 breakpoints pass | — |
| **Security Rules** | Simulator all green | — |

---

## 🐛 Bug Reporting (GitHub Issue Template)

```markdown
## UAT Bug: [TEST_CASE_ID] Short Title
**Test Case**: CUST-06
**Role**: Customer
**Feature**: Pesan Produk → Create Order
**Severity**: P1 (Blocker)
**Environment**: Staging (https://moonindiestore-staging.netlify.app), Chrome 120, macOS 14
**Steps to Reproduce**:
1. Login as customer@test
2. Open /customer/pesan
3. Select "Paper Bag Kraft"
4. Fill jumlah: 50, spesifikasi: "test"
5. Click "Kirim pesanan"
**Expected**: Order created, redirect to /customer/orders/[id]
**Actual**: Spinner spins forever, console shows `permission-denied`
**Evidence**: ![screenshot](evidence/CUST-06_permission_denied.png)
**Workaround**: None
**Related Rules**: firestore.rules may need deploy
```

---

## 📅 Suggested Execution Schedule (3 Days)

| Day | Focus | Target Cases |
|-----|-------|--------------|
| **Day 1 AM** | Setup + Smoke | AUTH-01..08, CUST-01, ADM-01, NF-06 |
| **Day 1 PM** | Customer Happy Path | CUST-02..11, EST-01..02 |
| **Day 2 AM** | Admin Product Management | ADM-02..04 |
| **Day 2 PM** | Admin Order Management | ADM-05..11 |
| **Day 3 AM** | Owner + Non-Functional | OWN-01..03, NF-01..05 |
| **Day 3 PM** | Retest P1/P2 fixes + Sign-off | All failed cases |

---

## 🔗 Related Files

- `UAT_Test_Cases.csv` — Importable spreadsheet
- `firestore.rules` — Security rules to verify (NF-06)
- `scripts/seed-users.mjs` — Seed test accounts
- `CHANGELOG.md` — Recent changes affecting test cases (e.g., ADM-07 fix)

---

## 📝 Notes for Testers

1. **Use Staging Only** — Never test on production Firebase project
2. **Seed Data First** — Run `npm run seed:users` + manual seed for products/orders
3. **Test All 3 Roles** — Use incognito/private windows for parallel sessions
4. **Document Evidence** — Screenshot on every Fail; video for complex flows
5. **Link Bugs** — Create GitHub Issue with label `uat-bug` and reference Test Case ID
6. **Communicate Blockers** — If P1 blocked, escalate immediately

---

> **Generated for MoonindieStore v0.1.0** — Update when features change.
> Last sync with CHANGELOG: 2026-10-23