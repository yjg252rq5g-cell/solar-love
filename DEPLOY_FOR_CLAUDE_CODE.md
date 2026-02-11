# Akino Solar Apps Script — Deployment Guide

## Overview

`akino_apps_script.js` is a Google Apps Script that connects all 5 Akino Solar Google Sheets into one automated system. It includes 30 functions for reading, writing, syncing, and exposing your sheet data as a JSON API.

## Google Sheet IDs

| Sheet | ID |
|---|---|
| Job Calculation for P&L | `1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE` |
| Main Route Optimization | `1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E` |
| Generac Job True Cost | `1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4` |
| Warranty Claims | `1hxIz6Qr7bgrHp559MRfUZ9ljkPsTlo1AfVj2K1ITEbc` |
| P&L Calculation (Doc) | `11--0Uodbm7hvY2XzXg5-TUipdSgh3DkcmkFPnA5StF4` |

## Deploy as Web App (lets Claude Code access your sheets)

1. Open any of your Google Sheets
2. Go to **Extensions > Apps Script**
3. Delete any existing code in `Code.gs`
4. Paste the entire contents of `akino_apps_script.js`
5. Click **Deploy > New deployment**
6. Select type: **Web app**
7. Set "Execute as": **Me**
8. Set "Who has access": **Anyone**
9. Click **Deploy**
10. Copy the URL — this is your API endpoint

## API Endpoints (GET)

Once deployed, append `?action=` to your URL:

| Action | Description |
|---|---|
| `?action=ping` | Check if API is live |
| `?action=snapshot` | Full business snapshot (all data from all sheets) |
| `?action=jobs` | All jobs from Route Optimization |
| `?action=personnel` | Employee roster with loaded rates |
| `?action=overhead` | Monthly overhead total |
| `?action=warranty` | All warranty claims (all months) |
| `?action=stale_warranty&days=30` | Unpaid claims older than N days |
| `?action=costing` | Job true cost data |
| `?action=routes` | Route summary |
| `?action=route_pnl` | Route P&L report |
| `?action=breakeven` | Break-even scenarios |
| `?action=assumptions` | Business assumptions |
| `?action=liabilities` | Liabilities |
| `?action=settings` | Route optimization settings |
| `?action=daily_report` | Morning briefing with action items |
| `?action=calculate_cost&tech=Sam&onsite_hrs=2&travel_hrs=2&miles=200&parts=0` | Calculate true cost for a job |

## API Endpoints (POST)

Send JSON body with `action` and `data`:

```bash
curl -X POST "YOUR_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"add_job","data":{"jobId":"597","customer":"Smith","tech":"Sam","type":"Service","onsiteHrs":2,"travelHrs":1.5,"miles":150,"partsCost":50,"revenue":3000,"priority":"Medium","city":"Knoxville","state":"TN"}}'
```

| Action | Description |
|---|---|
| `add_job` | Add job to ALL sheets at once |
| `add_job_route` | Add to Route Optimization only |
| `add_job_costing` | Add to True Cost sheet only |
| `add_warranty` | Add warranty claim |
| `add_job_log` | Add to Job Log only |
| `sync` | Run full sync (P&L + break-even + daily report) |
| `sync_pnl` | Recalculate P&L report |
| `sync_breakeven` | Recalculate break-even scenarios |

## Job Data Format

```json
{
  "jobId": "597",
  "customer": "Customer Name",
  "tech": "Sam",
  "type": "Service",
  "onsiteHrs": 2,
  "travelHrs": 1.5,
  "miles": 150,
  "partsCost": 50,
  "consumables": 0,
  "revenue": 3000,
  "priority": "Medium",
  "city": "Knoxville",
  "state": "TN",
  "date": "2026-02-11"
}
```

Valid tech names: `Sam`, `Lucas`, `Katie`, `Spencer`, `Lex`, `Caden`, `Jen`

Valid types: `Service`, `Warranty`, `Both`

Valid priorities: `High`, `Medium`, `Low`

## Function Reference

### Read Functions (1-13)
- `getSheet(id, tabName)` — Open any sheet by ID and tab
- `calculateTrueCost(tech, onsite, travel, miles, parts, consumables)` — Core cost calc
- `getMonthlyOverhead()` — Total monthly overhead from Overhead_Details
- `getPersonnel()` — Employee roster
- `getRouteJobs()` — All jobs from Route Optimization
- `getRouteSummary()` — Route summary data
- `getRoutePnL()` — Route P&L report
- `getRouteSettings()` — Settings tab
- `getAllWarrantyClaims()` — All warranty claims across all monthly tabs
- `getJobCostingData()` — Generac Job True Cost data
- `getBreakEvenScenarios()` — Break-even scenarios
- `getAssumptions()` — Business assumptions
- `getLiabilities()` — Liabilities

### Write Functions (14-17)
- `addJobToRouteOpt(jobData)` — Add to Route Optimization Jobs tab
- `addJobToTrueCost(jobData)` — Add to True Cost with auto-calculated cost
- `addWarrantyClaim(claimData)` — Add to current month's warranty tab
- `addToJobLog(jobData)` — Add to Job Calculation Job_Log

### Master Functions (18-22)
- `addJobEverywhere(jobData)` — Single entry point: writes to ALL sheets
- `generateDailyReport()` — Morning briefing with financials, pipeline, warranty stats
- `syncProfitLossReport()` — Recalculate P&L for all route jobs
- `syncBreakEven()` — Update break-even from current overhead
- `fullSync()` — Run all sync functions

### System Functions (23-30)
- `setupDailyTrigger()` — Create 7 AM daily trigger
- `onOpen()` — Add "Akino Solar" menu to Google Sheets
- `showAddJobDialog()` — Popup form for adding jobs
- `testAddJob()` — Test function
- `getBusinessSnapshot()` — Full JSON snapshot of all data
- `doGet(e)` — Web app GET handler (read endpoints)
- `doPost(e)` — Web app POST handler (write endpoints)
- `getStaleWarrantyClaims(days)` — Find unpaid claims older than N days
