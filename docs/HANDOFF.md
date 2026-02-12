# AKINO SOLAR — COMPLETE SYSTEM HANDOFF FOR CLAUDE CODE

## Owner
**Caden Montgomery** — caden@akinosolar.com
Akino Solar is a Generac service company operating across TN, GA, KY, VA, and NC with ~8 employees.

---

## GOOGLE SHEET IDs (All Live Production Sheets)

| Sheet | ID | Description |
|-------|-----|-------------|
| Job Calculation P&L | `1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE` | Personnel, Overhead, Assumptions, Job_Log, Job_Archive, Reconciliation, BreakEven_Scenario, Liabilities |
| Main Route Optimization | `1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E` | Jobs tab, Dashboard, Route Summary, Routes, Profit_Loss_Report, Settings |
| Generac Job True Cost | `1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4` | Job costing tab with true cost formulas |
| WARRANTY CLAIMS (ORIGINAL) | `1ZqTK21k4S6htIFpFO_ZL1KZ06vPcxR07jtn15fa5j54` | Monthly tabs (Dec 2024 — Jan 2026), 20-column layout |
| P&L Document | `11--0Uodbm7hvY2XzXg5-TUipdSgh3DkcmkFPnA5StF4` | AKINO SOLAR TRUE COST P&L CALCULATION |

## APPS SCRIPT PROJECT

- **Project ID:** `18qzkjFbjryFuevyl2TO-6B6uRmhhrX_fj1fnGb-NDbw0KNIPsNb8yDf1`
- **Editor URL:** https://script.google.com/home/projects/18qzkjFbjryFuevyl2TO-6B6uRmhhrX_fj1fnGb-NDbw0KNIPsNb8yDf1/edit
- **Script file:** See `akino_apps_script.js` (1,507+ lines, 41+ functions)
- **Status:** Code needs to be pasted into the Apps Script editor and deployed as web app

### How to Deploy:
1. Open the Apps Script editor at the URL above
2. Delete the default `function myFunction() {}`
3. Paste the entire contents of `akino_apps_script.js`
4. Click Deploy → New Deployment → Web App
5. Set "Execute as: Me" and "Who has access: Anyone"
6. Copy the deployed URL and paste it into the Settings page of the Command Center app

---

## PERSONNEL & RATES

| Name | Role | Hourly | Loaded Rate | Monthly Pay | Annual Pay |
|------|------|--------|-------------|-------------|------------|
| Sam | Technician | $25 | $35.21 | $4,333 | $51,999 |
| Lucas | Technician | $20 | $28.17 | $3,467 | $41,599 |
| Katie | Admin | $20 | $28.17 | $3,467 | $41,599 |
| Spencer | Technician | $40 | $56.33 | $6,933 | $83,198 |
| Lex | Job Management | $30 | $42.25 | $5,200 | $62,399 |
| Caden | Owner (salary) | — | $40.63 | $5,000 | $60,000 |
| Jen | Admin (part-time) | — | $5.28 | $650 | $7,800 |
| Andrew | Technician | $25 | $32.50 | — | — |
| QA | QA position | — | $17.60 | $2,167 | $26,000 |

---

## KEY FINANCIAL CONSTANTS

```
EMPLOYER_BURDEN: 30%
PAYROLL_TAX_RATE: 11.25%
FUEL_PER_MILE: $0.99
JOBS_PER_WEEK: 5
QA_COST_PER_JOB: $85
ADMIN_MGMT_SW_PER_JOB: $315
HEALTH_INS_PER_EMP: $500/mo
401K_MATCH: 3%
WARRANTY_RESERVE: 2%
MERCHANT_FEE: 2.75%
BAD_DEBT: 1%
RISK_BUFFER: $100/job
ALLOC_TO_GENERAC: 85%
MONTHLY_OVERHEAD: ~$43,480 (full) / ~$41,505 (idle)
BREAKEVEN_PER_JOB: ~$2,698 at 5 jobs/week
COST_PER_HOUR: ~$250.85
```

## TRUE COST FORMULA
```
True Cost = Labor (loaded_rate × total_hours)
          + Travel (miles × $0.99/mi)
          + Parts $ + Consumables $
          + Overhead Allocation (monthly overhead / jobs per month)

Profit = Revenue - True Cost
Verdict = Profit > 0 ? "Accept" : "Reject"
Break-even = Monthly Overhead / (jobs/week × 52/12) + Risk Buffer
```

---

## WARRANTY CLAIMS — 20-COLUMN LAYOUT

Columns in order: STATUS, CUSTOMER NAME, DATE OF JOB, CASE#, TECH NAME, ALLOTTED TRAVEL, ACTUAL TRAVEL TIME, DISTANCE MILEAGE, ACTUAL MILEAGE, ALLOTTED TECH TIME, ACTUAL TECH TIME, ALLOTTED AMOUNT, ADJUSTED AMOUNT, PAID AMOUNT, DATE CHECK CUT, SVN#, COMPANY COST, PROFIT AMOUNT, LOSS AMOUNT, NOTES

**Note:** Some tabs (May 2025, Form Responses 1) have only 18 columns — missing DISTANCE MILEAGE and ACTUAL MILEAGE. The script uses dynamic header mapping to handle both formats.

**16 Status Values:** Paid, Needs Attention, Scheduled, Submitted, Completed not paid, Waiting RMA, Waiting Go Back, Parts Ordered, RMA Approved, RMA Denied, Go Back Scheduled, Go Back Complete, In Progress, Pending Review, Denied, Cancelled

**Monthly Tabs:** Form Responses 1, May 2025, Dec 2024, Nov 2024, Jan 2025, Feb 2025, Mar 2025, April 2025, July 2025, AUGUST 2025, September 2025, October 2025, November 2025, December 2025, January 2026

---

## ROUTE OPTIMIZATION ENGINE (from V62.0 Apps Script)

### Algorithm: Nearest-Neighbor Greedy
1. Start from depot (35.9641, -83.9201 — Knoxville, TN)
2. Filter jobs by date range, GPS availability, status (exclude done/completed/archived)
3. Sort remaining jobs by proximity to last stop
4. Group into routes (max 6 jobs per route)
5. Calculate per stop: miles (Haversine), drive time, service time, total time
6. Flag OT if total > 480 minutes (8-hour day)
7. Calculate true cost including tech pay, fuel, materials, overhead
8. Determine verdict: ✅ profitable, ⚠️ marginal, ❌ loss

### Key Functions:
- `optimizeRoutes(startDate, endDate)` — Build optimized routes
- `forceGeocodeBacklog()` — Geocode addresses missing GPS coordinates
- `findBestFitForJob(address)` — Find nearest existing route for a new job
- `addJobToRoute(customer, address, routeId, lat, lng)` — Insert job
- `archiveRoutes()` — Freeze current routes as snapshot
- `generateProfitLossReport()` — P&L from route data
- `exportFleetPDFs()` — PDF manifests to Google Drive
- `showQuickMap()` — Static map preview via Google Maps API
- `createDashboard()` — Mileage, revenue, profit summary

### Haversine Distance Formula:
```javascript
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const a = Math.sin(((lat2-lat1)*toRad)/2)**2 +
              Math.cos(lat1*toRad) * Math.cos(lat2*toRad) *
              Math.sin(((lon2-lon1)*toRad)/2)**2;
    return 2 * 3958.8 * Math.asin(Math.sqrt(a)); // miles
}
```

---

## ROUTE OPTIMIZATION SHEET COLUMNS

Jobs tab: Job#, Priority (High/Medium/Low), Customer, City, St, Zip, Requested Date, Route Date, Tech, Tags (Scheduled/Needs Scheduling/Go-Back), Revenue, Notes, Job Flags (Troubleshoot/Upgrade/BMU/DCB/Overnight), Assigned Route

Routes tab: Route, Seq, Job#, Customer, Address, Est Mi, Drive, Work, Total, Warning, MAP LINK, |, Tech, Rev $, True Cost, PROFIT, Verdict, Lat, Lng

Settings tab: Google Maps API Key, Depot Lat/Lng, Fuel $/mile, Max Jobs Per Route, Risk buffer %, QA cost, Admin cost, Generac Overhead, Tech-specific costs

---

## DEV APPS (Reference Implementations)

### 1. Solar Asset Manager (Lovable)
- URL: https://lovable.dev/projects/ac83dafc-dd1d-475b-ae86-b4f0f9831b51
- Features: Inventory management, RMA tracking, technician checkout system, jobs (scheduled/unscheduled), RBAC roles, Supabase DB

### 2. Route Genius (Lovable)
- URL: https://lovable.dev/projects/95be6ee4-a09b-4c05-a757-92468d05a26b
- Features: Route analytics dashboard (4 tabs), GPS tracking simulation, weather integration (Open-Meteo), route comparison, Google Sheet integration, CSV import, Mapbox maps

### 3. RouteMaster (Base44)
- URL: https://app.base44.com/apps/6982bcf8eac8e2f626a07a76/editor/preview
- Features: Fleet Command dashboard, nearest-neighbor optimization, Leaflet maps, AI task prioritization, technician management, P&L analytics

---

## APPS SCRIPT WEB APP API ENDPOINTS

### GET Requests (append `?action=XXX` to deployed URL):
- `all_jobs` — All jobs from Route Optimization sheet
- `personnel` — All personnel with rates from Job Calc sheet
- `overhead` — Overhead details from Job Calc sheet
- `job_log` — All jobs from Job Log tab
- `true_cost_log` — All entries from Job True Cost sheet
- `warranty_claims` — All warranty claims across all monthly tabs
- `warranty_by_month&month=MONTH_NAME` — Claims for specific month
- `warranty_by_status&status=STATUS` — Claims filtered by status
- `warranty_summary` — Summary counts and dollars by status
- `warranty_tabs` — List of all monthly tab names
- `waiting_rma` — All claims with Waiting RMA status
- `waiting_goback` — All claims with Waiting Go Back status
- `daily_report` — Comprehensive daily report with all metrics
- `break_even` — Break-even analysis
- `monthly_overhead` — Monthly overhead calculation

### POST Requests (JSON body with `action` field):
- `add_job` — Add new job (fields: customer, address, city, state, zip, revenue, tech, priority, status, notes)
- `log_job` — Log completed job to Job Log
- `add_true_cost` — Add true cost entry
- `add_warranty_claim` — Add warranty claim with all 20 fields
- `update_warranty_status` — Update claim status
- `update_warranty_financials` — Update claim financial fields
- `calculate_true_cost` — Calculate true cost for given parameters

---

## COMMAND CENTER APP

**File:** `Akino_Solar_Command.html` (2,700+ lines)

### 8 Tabs:
1. **Dashboard** — KPIs, charts, alerts, activity feed
2. **Jobs** — Full job management with filters, search, add/edit
3. **Routes** — Leaflet map, route optimization, analytics, weather
4. **Warranty** — Monthly tabs, 20-column layout, RMA/go-back tracking
5. **Inventory** — Parts management, RMA, checkout tracking
6. **Technicians** — Personnel, rates, performance, workload charts
7. **Financials** — P&L, true cost calculator, break-even, overhead
8. **Settings** — Apps Script URL, depot location, rates, configuration

### Claude AI Sidebar:
- Chat tab — Ask questions about any aspect of the business
- Scan & Fix tab — Automatic system scan finding issues across all modules
- Auto-Actions tab — Email monitoring, job reminders, discrepancy detection, auto to-do generation
- FAB button with alert badge count

---

## AUTOMATION (Cowork Daily Shortcut)

**File:** `.claude/shortcuts/akino-daily-check.json`
**Schedule:** Every day at 7 AM (`0 7 * * *`)

### What it does:
1. Scans Gmail for Generac/warranty/RMA/service/payment emails
2. Checks P&L document for financial metrics
3. Reviews warranty claims for stale/waiting items
4. Checks job pipeline for unscheduled/unassigned jobs
5. Reviews job true cost for loss-making jobs
6. Produces a morning briefing with specific action items

---

## HOW TO ACCESS SHEETS PROGRAMMATICALLY

### Via Apps Script Web App:
```javascript
// GET request
fetch('YOUR_DEPLOYED_URL?action=daily_report')
  .then(r => r.json())
  .then(data => console.log(data));

// POST request
fetch('YOUR_DEPLOYED_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'add_job', customer: 'Smith', city: 'Atlanta', revenue: 800 })
}).then(r => r.json()).then(data => console.log(data));
```

### Via Google Sheets CSV Export (read-only, no auth needed if sheet is shared):
```
https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=TAB_NAME
```

---

## FILES CREATED IN THIS PROJECT

| File | Description |
|------|-------------|
| `Akino_Solar_Command.html` | Comprehensive 8-tab command center with Claude AI sidebar |
| `akino_apps_script.js` | Google Apps Script V2.0 (1,507+ lines, 41+ functions) |
| `Akino_Solar_Consolidated.xlsx` | 16-tab consolidated workbook from all source sheets |
| `Akino_Solar_Master.xlsx` | Master workbook (4,857 formulas, 10 tabs) |
| `Akino_Solar_App.html` | Earlier standalone HTML app (7 tabs, Chart.js) |
| `DEPLOY_FOR_CLAUDE_CODE.md` | Deployment instructions |
| `CLAUDE_CODE_SETUP.md` | Earlier setup guide |
| `CLAUDE_CODE_HANDOFF.md` | This document |
