# Website Navigation Flow Documentation
## https://www.hambalifadib.my.id/

**Test Date:** April 4, 2026  
**Tester:** AI QA Explorer Agent  
**Website Type:** Personal Portfolio / QA Professional Site

---

## Navigation Flow Diagram

```
                            ┌─────────────────┐
                            │     HOMEPAGE    │
                            │       (/)       │
                            └────────┬────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│    PROJECTS     │        │    THINKING     │        │     ABOUT       │
│  (/projects)    │        │(/quality-thinking)       │   (/about)      │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │    CONTACT      │
                            │   (/contact)    │
                            └─────────────────┘
```

### Footer Links (Accessible from all pages)
```
┌────────────────────────────────────────────────────────────┐
│  Email (mailto:)  │  LinkedIn  │  GitHub  │  Instagram    │
└────────────────────────────────────────────────────────────┘
```

---

## List of Accessible Pages

| # | Page Name | URL | Status | Notes |
|---|-----------|-----|--------|-------|
| 1 | Homepage | `/` | ✅ PASS | Landing page with hero section |
| 2 | Projects | `/projects` | ✅ PASS | Case studies and decision framework |
| 3 | Thinking | `/quality-thinking` | ✅ PASS | QA philosophy and methodology |
| 4 | About | `/about` | ✅ PASS | Profile, experience, skills |
| 5 | Contact | `/contact` | ✅ PASS | Contact form and social links |
| 6 | CV/Resume | `/cv.pdf` | ✅ PASS | PDF document accessible |
| 7 | Email | `mailto:fadibhambali@gmail.com` | ✅ PASS | Opens mail client |
| 8 | LinkedIn | External | ✅ PASS | https://linkedin.com/in/hambalifadib |
| 9 | GitHub Profile | External | ⚠️ PARTIAL | GitHub profile loads but shows errors |
| 10 | Instagram | External | ⚠️ PARTIAL | Link present but not tested |

---

## External Resource Links Found

### Projects Page - Built Systems Section
| Project | Linked URL | Status |
|---------|------------|--------|
| AI QA Automation Platform | `https://github.com/hambaliFadib/ai-qa-automation-platform` | ❌ 404 |
| Telegram QA Bug Tracker Bot | `https://github.com/hambaliFadib/telegram-qa-bug-tracker-bot` | ❌ 404 |
| QA Workflow Automation Engine | `https://github.com/hambaliFadib/qa-workflow-automation-engine` | ❌ 404 |

### Actual GitHub Repositories (hambaliFadib)
| Repo Name | URL | Status |
|-----------|-----|--------|
| qa-architecture | `https://github.com/hambaliFadib/qa-architecture` | ⚠️ Error loading |
| fadibFolio | `https://github.com/hambaliFadib/fadibFolio` | ⚠️ Error loading |
| me | `https://github.com/hambaliFadib/me` | ⚠️ Error loading |

---

## Issues Found with Severity Levels

### 🔴 CRITICAL

| Issue ID | Location | Description |
|----------|----------|-------------|
| CRIT-001 | Projects Page | **3 GitHub repo links return 404** - The projects page links to `ai-qa-automation-platform`, `telegram-qa-bug-tracker-bot`, and `qa-workflow-automation-engine` but these repositories do not exist on GitHub. Actual repos are different: `qa-architecture`, `fadibFolio`, `me`. |

### 🟡 MEDIUM

| Issue ID | Location | Description |
|----------|----------|-------------|
| MED-001 | Projects Page | **Real Decision Cases section is empty** - "Reserved Decision Case 01" and "Reserved Decision Case 02" show placeholder text with no actual content. May need future updates. |
| MED-002 | GitHub Profile | **GitHub repos show error loading** - When viewing https://github.com/hambaliFadib, the pinned and repository sections show "Uh oh! There was an error while loading." This may be a GitHub-side issue or rate limiting. |

### 🟢 LOW

| Issue ID | Location | Description |
|----------|----------|-------------|
| LOW-001 | Contact Page | **Contact form opens mail client (mailto:)** - The "Send Message" form uses `mailto:` protocol instead of actual backend submission. Form fields are: Full Name, Email, Phone Number, Subject, Message. |
| LOW-002 | Contact Page | **WhatsApp number partially masked** - Contact shows `+62xxx-xxxx-xxxx` instead of full number. The actual number exists (wa.me/6281321506229). |
| LOW-003 | General | **"Ask AI" button appears in nav** - `[Ask AI](/#assistant)` link scrolls to AI assistant section. This is a functional feature but may not work as intended if the AI is not implemented. |

### ℹ️ INFO

| Issue ID | Location | Description |
|----------|----------|-------------|
| INFO-001 | All Pages | **Consistent header/footer** - Navigation menu and footer remain consistent across all pages. |
| INFO-002 | Homepage | **Dark/Light mode toggle present** - "Toggle color mode" button exists but functional testing not performed. |
| INFO-003 | About Page | **CV download available** - `/cv.pdf` link works correctly. |

---

## Screenshot Reference Points

### Homepage
- Hero section with profile image and intro text
- AI assistant section (Ask AI widget)
- Core capabilities section (5 capability cards)
- Entry points section (3 navigation cards)
- Footer with social links

### Projects Page
- Projects header with guidance text
- 5 Enterprise case studies (Billing, Workflow, Transaction, Storage, Monitoring)
- 3 Built systems with GitHub links (AI Platform, Telegram Bot, QA Engine)
- Release Decision Integrity Framework (4-step process)
- Real Decision Cases section (empty placeholders)

### Quality Thinking Page
- Core principles section (4 principles)
- Problem breakdown (4 steps)
- Risk thinking model
- Decision patterns
- Anti-patterns section
- Thinking snapshot

### About Page
- Profile section with photo
- Career progression (3 positions)
- Academic background (2 institutions)
- Hard skills (37 skills across 4 categories)
- Personal foundation section
- Professional journey photos (5 images)

### Contact Page
- Contact options (Email, LinkedIn, GitHub, Instagram, WhatsApp)
- Message form (5 fields + Send button)

---

## Summary

| Metric | Count |
|--------|-------|
| Total Pages Tested | 5 internal + 6 external |
| Pages Fully Accessible | 5 internal, 4 external |
| Broken Links | 3 (GitHub repos) |
| Functional Issues | 1 (GitHub loading errors) |
| Critical Issues | 1 |
| Medium Issues | 2 |
| Low Issues | 3 |
| Info Items | 3 |

**Overall Assessment:** The website is functional and well-structured. Main navigation works correctly. The primary issue is mismatched GitHub repository links in the Projects page that need to be updated to point to the actual repositories.

---

# Transaction Mapping - Happy Path Exploration

**Exploration Date:** 2026-04-04  
**Session User:** qaempat (End User)  
**Role:** Submitter  
**Status:** ⚠️ PARTIAL - Dropdown fields not filling correctly

---

## Target

| Item | Value |
|------|-------|
| Menu Path | System Setup → Master Data → Transaction Mapping |
| URL | /system-setup/billing-item |
| Flow | List → Create → Save |

---

## Navigation Path

```
1. Login to https://dev-energy.pgn.co.id
2. Navigate: System Setup → Master Data (expand) → Transaction Mapping
3. URL: https://dev-energy.pgn.co.id/system-setup/billing-item
```

---

## Baseline Akses

### Access Status
| Item | Value |
|------|-------|
| Session | ✅ ACCESS_STABLE |
| Redirect to Login | ❌ No |
| Sidebar | ✅ Visible |
| Topbar | ✅ Visible |
| Avatar/Profile | ✅ Visible |

### Page Elements
| Element | Status |
|---------|--------|
| Data Table | ✅ |
| Toolbar: Create Transaction Mapping | ✅ |
| Toolbar: Download List | ✅ |
| Toolbar: Refresh | ✅ |
| Toolbar: Advanced Search | ✅ |
| Action menu per row | ✅ |

### Table Info
- **Rows:** 72 records
- **Columns:** NO, TYPE, CODE, CATEGORY, NAME, BILL TYPE, START DATE, END DATE, LATE CHARGE, PAYMENT WARRANTY, INSTALMENT, DESCRIPTION, STATUS, STATUS APPROVAL, ACTION

---

## Create Form - Mandatory Fields

### 8 Mandatory Fields (Confirmed via validation)
| # | Field | Type | Validation Message |
|---|-------|------|-------------------|
| 1 | Category | search/dropdown | "Please input your Category!" |
| 2 | Type | search/dropdown | "Please input your Type!" |
| 3 | Name | text | "Please input your Name!" |
| 4 | Bill Type | search/dropdown | "Please input your Bill Type!" |
| 5 | Criteria | search/dropdown | "Please input your Criteria!" |
| 6 | Start Date | date | "Please input your Start Date!" |
| 7 | Description | textarea | "Please input your Description!" |
| 8 | Approval Hierarchy | search/dropdown | "Please input your Approval Hierarchy!" |

### Optional Fields
| # | Field | Type |
|---|-------|------|
| 9 | Transaction Mapping Code | text (auto-generated) |
| 10 | End Date | date |
| 11 | Late Charge | checkbox |
| 12 | Payment Warranty | checkbox |
| 13 | Installment / Restructure | checkbox |

### Form Actions
| Button | Action |
|--------|--------|
| Cancel | Close modal |
| Clear Data | Reset form |
| Save as Draft | Save with DRAFT status |
| Previous | Previous step |
| Next | Next step |

---

## API Endpoints

| Method | Endpoint | Status | Function |
|--------|----------|--------|----------|
| GET | /rbi/v1/dbs/api/billingitem/get-paging | 200 ✅ | List table data |
| POST | /rbi/v1/dbs/api/billingitem | ❌ Not called | Create record (blocked by validation) |

---

## Test Results

### Fillable Fields
| Field | Status |
|-------|--------|
| Name | ✅ Fills correctly |
| Description | ✅ Fills correctly |
| Start Date | ✅ Fills correctly (keyboard.type) |

### Problematic Fields (Custom Dropdowns)
| Field | Input Type | Issue |
|-------|-----------|-------|
| Category | search | Not selecting |
| Type | search | Not selecting |
| Bill Type | search | Not selecting |
| Criteria | search | Not selecting |
| Approval Hierarchy | search | Not selecting |

### Validation Result
When Save clicked without dropdowns:
```
"Please input your Category!"
"Please input your Type!"
"Please input your Bill Type!"
"Please input your Criteria!"
"Please input your Approval Hierarchy!"
```

---

## Blocker

Dropdown fields use custom rc-select component that doesn't respond to:
- `page.click()` + `keyboard.type()` + `keyboard.press('Enter')`
- `page.fill()` 

**Need:** DOM inspection to find correct selection method.
| GET | /rbi/v1/dbs/api/billingitem/{id} | Get single record |
| POST | /rbi/v1/dbs/api/billingitem | Create new |
| PUT | /rbi/v1/dbs/api/billingitem/{id} | Update existing |
| DELETE | /rbi/v1/dbs/api/billingitem/{id} | Delete |

### Expected Dependency Endpoints
| Endpoint | For |
|----------|-----|
| /api/transaction-mapping-category | Category dropdown |
| /api/bill-type | Bill Type dropdown |
| /api/type | Type dropdown |

---

## Happy Path Flow (Expected)

```
1. Click "Create Transaction Mapping" button
2. Modal opens with form
3. Fill mandatory fields:
   - Type (dropdown)
   - Transaction Mapping Code
   - Transaction Mapping Category (dropdown)
   - Name
   - Bill Type (dropdown)
   - Start Date
4. Leave optional fields as default
5. Click "Save"
6. Expect: Success toast, modal closes, new row in table
```

---

## Session Status

| Component | Value | Status |
|-----------|-------|--------|
| Auth File | dev-energy-auth.json | ❌ Expired |
| NOTIF_SESSION | 817DD8... | ❌ Invalid |
| JSESSIONID | 2F36A... | ❌ Invalid |
| Last Valid Test | Earlier session | ✅ Received table data |

**Resolution:** Get fresh session via manual login and export

---

## Test Artifacts

| File | Location |
|------|----------|
| Detailed Report | `artifacts/adhoc-notes/transaction-mapping-create.md` |
| API Calls | `artifacts/adhoc-notes/transaction-mapping-api-new.json` |

---

## Next Steps

1. **Login manually** via browser to get fresh session
2. **Navigate** to Transaction Mapping
3. **Export session** using DevTools (Application → Storage → Copy as JSON)
4. **Save** new auth to `auth/state/dev-energy-auth.json`
5. **Re-run** automation test

---

## Issue for Logger (if any)

*No issues found yet - session expired before testing could begin.*

---

# Run Update - 2026-04-05

## Session Info

| Item | Value |
|------|-------|
| CDP URL | ws://localhost:9222/devtools/browser/d6c44a88-647c-47e1-b413-1b7720fd8b69 |
| Target Page | billing-item (11FE9DA0F006DFAD8BB26AE5BF87047C) |
| Pages Found | 3 (billing-item, home, about:blank) |

## Script Updates

**cdp-create-v4.js** - Key changes:
- Added `fs` require at top
- Added `OUTPUT_DIR` constant
- Updated CDP URL to current session
- Changed navigation to use existing page (not goto)
- Added page reload fallback on error pages
- Changed finally block: disconnect instead of close

## Network Issue

```
Error: net::ERR_NAME_NOT_RESOLVED: 'dev-energy.pgn.co.id'
Cause: VPN disconnected / Network unavailable
```

Browser pages show `chrome-error://chromewebdata/` due to network failure.

## Next Steps (Updated)

1. **Verify VPN** - Ensure connectivity to dev-energy.pgn.co.id
2. **Refresh CDP** - Pages need reload after VPN restore
3. **Retry test** - Run `node cdp-create-v4.js`
4. **Focus:** Select valid dropdown values using correct rc-select interaction
