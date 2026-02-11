# Give Claude Code Access to Your Google Sheets

## The Problem
Google Sheets are locked behind your Google login. Claude Code runs in a terminal with no browser session, so it can't see your sheets.

## The Fix
Deploy the Apps Script as a **web app**. This gives you a URL that returns your sheet data as JSON. Claude Code can then `curl` that URL to read and write everything.

---

## Step-by-Step Deploy (takes 2 minutes)

1. Open any of your 5 Google Sheets
2. Click **Extensions** → **Apps Script**
3. Delete everything in the default `Code.gs` file
4. Open `akino_apps_script.js` and copy **the entire file**
5. Paste it into the Apps Script editor
6. Click the **Save** button (disk icon)
7. Click **Deploy** → **New deployment**
8. Click the gear icon → select **Web app**
9. Set these options:
   - **Description**: `Akino Solar API`
   - **Execute as**: `Me (caden@akinosolar.com)`
   - **Who has access**: `Anyone` (this makes the URL work without login — only you'll have the URL)
10. Click **Deploy**
11. Click **Authorize access** → choose your Google account → click **Allow**
12. **Copy the web app URL** — it looks like: `https://script.google.com/macros/s/ABCDEF.../exec`

That URL is your API. Give it to Claude Code.

---

## Tell Claude Code This

Once you have the URL, paste this into Claude Code:

> Here's my Akino Solar Google Sheets API. The URL is:
> `https://script.google.com/macros/s/YOUR_URL_HERE/exec`
>
> **To READ data** — use GET requests:
> - `curl "URL?action=snapshot"` — gets everything (all jobs, personnel, overhead, warranty, routes)
> - `curl "URL?action=jobs"` — just the jobs from Route Optimization
> - `curl "URL?action=warranty"` — all warranty claims
> - `curl "URL?action=daily_report"` — morning briefing with action items
> - `curl "URL?action=overhead"` — monthly overhead number
> - `curl "URL?action=costing"` — job true cost data
> - `curl "URL?action=breakeven"` — breakeven scenarios
> - `curl "URL?action=routes"` — route summaries
> - `curl "URL?action=personnel"` — all employees and rates
> - `curl "URL?action=stale_warranty&days=30"` — unpaid warranty claims older than 30 days
> - `curl "URL?action=calculate_cost&tech=Sam&onsite_hrs=2&travel_hrs=1.5&miles=150&parts=50"` — calculate true cost for a job
>
> **To WRITE data** — use POST requests:
> - Add job to ALL sheets at once:
>   `curl -X POST "URL" -H "Content-Type: application/json" -d '{"action":"add_job","data":{"jobId":"601","customer":"John Smith","tech":"Sam","type":"Service","onsiteHrs":2,"travelHrs":1.5,"miles":150,"partsCost":50,"revenue":3000,"priority":"Medium","city":"Knoxville","state":"TN"}}'`
> - Add warranty claim: `{"action":"add_warranty","data":{...}}`
> - Run full sync: `{"action":"sync","data":{}}`
> - Sync P&L only: `{"action":"sync_pnl","data":{}}`

---

## Quick Test

After deploying, open your terminal and run:

```
curl "YOUR_URL?action=ping"
```

You should get back:
```json
{"status":"ok","timestamp":"2026-02-11T...","message":"Akino Solar API is live"}
```

Then try:
```
curl "YOUR_URL?action=snapshot" | python3 -m json.tool
```

This dumps your entire business data as formatted JSON. If Claude Code can see that, it can see everything.

---

## Available GET Actions

| Action | What It Returns |
|--------|----------------|
| `snapshot` | Everything — all data from all 5 sheets |
| `jobs` | All jobs from Route Optimization |
| `personnel` | All 8 employees with hourly/loaded rates |
| `overhead` | Monthly overhead total |
| `warranty` | All warranty claims (all months) |
| `stale_warranty` | Unpaid warranty claims (add `&days=30`) |
| `costing` | Job true cost data |
| `routes` | Route summaries (18 routes) |
| `route_pnl` | Profit/loss by route |
| `breakeven` | Breakeven scenarios at different job volumes |
| `assumptions` | Business assumptions |
| `liabilities` | Outstanding liabilities |
| `settings` | Route configuration |
| `daily_report` | Full morning briefing with action items |
| `calculate_cost` | Calculate true cost (add `&tech=Sam&onsite_hrs=2&travel_hrs=2&miles=200&parts=0`) |
| `ping` | Health check |

## Available POST Actions

| Action | What It Does |
|--------|-------------|
| `add_job` | Adds job to ALL 4 sheets at once |
| `add_job_route` | Adds to Route Optimization only |
| `add_job_costing` | Adds to Job True Cost only |
| `add_warranty` | Adds warranty claim to current month |
| `add_job_log` | Adds to Job Calculation log |
| `sync` | Full sync — recalculates P&L + breakeven + daily report |
| `sync_pnl` | Sync P&L report only |
| `sync_breakeven` | Sync breakeven scenarios only |

---

## Security Note

The URL uses "Anyone" access so Claude Code can reach it without a Google login. The URL itself acts as the password — only someone with the URL can access it. Don't share the URL publicly. If you ever want to revoke access, go to Apps Script → Deploy → Manage deployments → Archive.
