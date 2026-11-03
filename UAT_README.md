# UAT Testing Kit — MoonindieStore

## 📁 Files

| File | Description |
|------|-------------|
| `UAT_Test_Cases.csv` | **Main test cases** — import to Google Sheets / Excel / LibreOffice Calc |
| `UAT_Test_Cases.md` | **Human-readable version** — view in GitHub/GitLab, includes summary & instructions |

---

## 🚀 Quick Start

### 1. Prepare Staging Environment
```bash
# Deploy to Netlify Preview / separate Firebase project
# Ensure firestore.rules, storage.rules deployed to staging

# Seed test data
npm run seed:users
# Then manually add via Firebase Console:
# - 10+ products (various jenis, satuan, with/without images)
# - 3 pelanggan (uid linked to Auth users)
# - 5 orders: menunggu, diproses, produksi, selesai, dibatalkan
# - 2 estimasi harga
# - Produksi & tracking records for processed orders
# - Design files in Storage (desain/ & produk/)
```

### 2. Import Test Cases
**Google Sheets** (recommended for collaboration):
1. Open Google Sheets → New Spreadsheet
2. File → Import → Upload → Select `UAT_Test_Cases.csv`
3. Import location: **Replace spreadsheet**
4. Share with team (Viewer/Commenter/Editor as needed)

**Excel / LibreOffice Calc**:
1. Open CSV directly → Save as `.xlsx` / `.ods`

### 3. Add Execution Columns (if not present)
| Column | Type | Values |
|--------|------|--------|
| `Status` | Dropdown | `Not Run`, `In Progress`, `Pass`, `Fail`, `Blocked` |
| `Actual Result` | Text | Free text |
| `Bug ID` | Text | GitHub Issue link (e.g., `#42`) |
| `Evidence` | Text | Screenshot path or drive link |
| `Tester` | Text | Name |
| `Date Tested` | Date | `YYYY-MM-DD` |
| `Notes` | Text | Free text |

### 4. Create Filter Views (Google Sheets)
- **By Priority**: Filter Priority = P1, P2, P3, P4
- **By Role**: Filter Role = Customer / Admin / Owner / All
- **By Module**: Filter Module = Authentication / Customer / Admin / Owner / Estimasi / Non-Functional
- **By Status**: Filter Status = Not Run / In Progress / Pass / Fail / Blocked

### 5. Execute & Track
```markdown
Daily flow:
1. Filter: Priority = P1, Status = Not Run
2. Pick next case → Set Status = In Progress
3. Execute on staging
4. Set Status = Pass / Fail / Blocked
5. If Fail: Create GitHub Issue (label: uat-bug), fill Bug ID, Evidence
6. Repeat
```

### 6. Bug Reporting
**GitHub Issue Template** (create `.github/ISSUE_TEMPLATE/uat-bug.yml`):
```yaml
name: UAT Bug
description: Bug found during User Acceptance Testing
labels: ["uat-bug"]
body:
  - type: input
    id: test_case_id
    attributes:
      label: Test Case ID
      placeholder: "CUST-06"
    validations:
      required: true
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options: [P1 - Blocker, P2 - Major, P3 - Minor, P4 - Cosmetic]
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      placeholder: |
        1. Login as customer@test
        2. Open /customer/pesan
        3. ...
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Result
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual Result
    validations:
      required: true
  - type: input
    id: evidence
    attributes:
      label: Evidence (screenshot/video link)
  - type: input
    id: environment
    attributes:
      label: Environment
      placeholder: "Staging, Chrome 120, macOS 14"
```

---

## 📊 Progress Dashboard (Google Sheets)

Create a **Pivot Table** on a separate sheet:

**Rows**: `Module`, `Priority`
**Columns**: `Status`
**Values**: `COUNTA(Test Case ID)`
**Filters**: None

→ Shows real-time pass/fail/blocked count per module & priority.

---

## ✅ Sign-Off Checklist

Before release, verify:

- [ ] All **P1** cases: **Pass** (18/18)
- [ ] **P2** cases: ≤ 2 Fail (with documented workaround)
- [ ] **Happy paths** covered: AUTH, CUST-01..10, ADM-01..11
- [ ] **Accessibility**: Keyboard nav, focus rings, contrast — manual pass
- [ ] **Responsive**: Mobile (≤639px), Tablet (640-1023px), Desktop (≥1024px) — no horizontal scroll
- [ ] **Security Rules**: Firebase Simulator — all role scenarios pass
- [ ] **Performance**: LCP < 2.5s on staging (Lighthouse)

**Sign-Off**:
| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Product Owner | | | |
| Tech Lead | | | |

---

## 🔄 Maintenance

| Trigger | Action |
|---------|--------|
| New feature added | Add test cases to CSV + MD |
| Bug fixed in related area | Add regression case |
| Firebase rules changed | Re-run NF-06 + affected cases |
| Major refactor | Full regression on affected module |

---

## 📞 Contacts

| Role | Name | Channel |
|------|------|---------|
| QA Lead | Nandra | GitHub / Slack |
| Product Owner | - | - |
| Tech Lead | - | - |
| Firebase Admin | - | Firebase Console |

---

> **Version**: 1.0 (2026-10-23) — Sync with `CHANGELOG.md` recent changes