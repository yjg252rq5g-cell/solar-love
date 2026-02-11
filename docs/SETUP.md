# Akino Solar — Google Apps Script Setup for Claude Code

## What This Is

`akino_apps_script.js` is a complete Google Apps Script that connects all 5 of your original Google Sheets into one automated system. It has 27 functions that can read from, write to, and sync across every sheet.

---

## Your 5 Google Sheets (IDs already hardcoded in the script)

| Sheet | ID |
|-------|-----|
| Job Calculation for Profit and Loss | `1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE` |
| Main Route Optimization | `1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E` |
| Copy of Generac Job True Cost | `1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4` |
| Copy of $ Generac Service Warranty Claims | `1hxIz6Qr7bgrHp559MRfUZ9ljkPsTlo1AfVj2K1ITEbc` |
| AKINO SOLAR TRUE COST P&L CALCULATION (Doc) | `11--0Uodbm7hvY2XzXg5-TUipdSgh3DkcmkFPnA5StF4` |

---

## How to Deploy

### Option A: Paste Into Google Apps Script Editor

1. Open any of your Google Sheets
2. Go to **Extensions → Apps Script**
3. Delete everything in the default `Code.gs` file
4. Paste the entire contents of `akino_apps_script.js`
5. Click **Save** (disk icon)
6. Click **Run** → select `onOpen` to test it loads
7. Go back to your Sheet — you'll see a new **"Akino Solar"** menu in the toolbar

### Option B: Give to Claude Code

Copy-paste the entire script into Claude Code and tell it:

> "Here's my Google Apps Script that connects all 5 of my Akino Solar Google Sheets. The script has 27 functions — read functions for every tab, write functions to add jobs and warranty claims across all sheets at once, sync functions, and a daily report generator. Use this as the foundation for the solar profit engine you're building."

---

## What Each Function Does

### READ functions (pull data from sheets)
- `getPersonnel()` — all 8 employees with hourly/loaded rates
- `getMonthlyOverhead()` — full overhead breakdown (~$56K/mo)
- `getAssumptions()` — business assumptions (burden rate, fuel cost, etc.)
- `getLiabilities()` — outstanding liabilities
- `getRouteJobs()` — all jobs from Route Optimization → Jobs tab
- `getRouteSummary()` — route-level summaries (18 routes)
- `getRoutePnL()` — profit/loss by route
- `getRouteSettings()` — route configuration
- `getAllWarrantyClaims()` — warranty claims across all monthly tabs (Apr 2025 – Jan 2026)
- `getStaleWarrantyClaims(days)` — claims that are "Completed not paid" for 30+ days
- `getJobCostingData()` — job costing from Generac Job True Cost sheet
- `getBreakEvenScenarios()` — breakeven analysis at different job volumes

### WRITE functions (push data to sheets)
- `addJobEverywhere(jobData)` — **THE BIG ONE**: adds a job to Route Optimization + True Cost + Job Log + Warranty (if applicable) in a single call
- `addJobToRouteOpt(jobData)` — write to Route Optimization Jobs tab
- `addJobToTrueCost(jobData)` — write to Generac Job True Cost with auto-calculated true cost
- `addWarrantyClaim(claimData)` — write to current month's warranty tab
- `addToJobLog(jobData)` — write to Job Calculation Job_Log tab

### CALCULATE functions
- `calculateTrueCost(tech, onsiteHrs, travelHrs, miles, parts, consumables)` — returns full cost breakdown (labor, travel, overhead, total, cost/hr)
- `calculateBreakEven(overhead, jobsPerWeek)` — returns breakeven price per job

### SYNC functions
- `syncProfitLossReport()` — recalculates P&L for all route jobs
- `syncBreakEven()` — updates breakeven scenarios
- `fullSync()` — runs all sync functions at once

### REPORT functions
- `generateDailyReport()` — morning briefing with pipeline stats, stale warranty alerts, action items
- `getBusinessSnapshot()` — full JSON dump of everything across all 5 sheets

### SETUP functions
- `onOpen()` — adds "Akino Solar" custom menu to Google Sheets
- `setupDailyTrigger()` — creates a 7 AM daily trigger for the report
- `showAddJobDialog()` — popup form for entering jobs from within Google Sheets

### TEST
- `testAddJob()` — test function that adds a sample job to verify everything works

---

## Job Data Format

When calling `addJobEverywhere()`, pass an object like this:

```javascript
{
  jobId: 'JOB-001',
  customer: 'John Smith',
  tech: 'Sam',              // Must match: Sam, Lucas, Katie, Spencer, Lex, Caden, Jen
  type: 'Service',          // Service, Install, Warranty, Maintenance
  onsiteHrs: 2,
  travelHrs: 1.5,
  miles: 150,
  partsCost: 50,
  consumables: 10,
  revenue: 3000,
  priority: 'Medium',       // High, Medium, Low
  city: 'Knoxville',
  state: 'TN',
  route: 'R1',
  date: new Date(),
  isWarranty: false,         // set true to also create warranty claim
  warrantyStatus: 'Submitted'
}
```

---

## Key Business Numbers (hardcoded in CONFIG)

- Employer burden: 30%
- Payroll tax: 11.25%
- Fuel per mile: $0.99
- Jobs per week: 5
- QA cost per job: $85
- Admin/mgmt/software per job: $315
- Health insurance per employee: $500/mo
- 401k match: 3%
- Warranty reserve: 2%
- Merchant fee: 2.75%
- Bad debt reserve: 1%

---

## Quick Test

After pasting the script, run `testAddJob()` from the Apps Script editor. Check your Route Optimization and Job True Cost sheets — you should see a new "TEST-001" row in both.
