# CLAUDE.md - Akino Solar Command Center

## Project Overview

Akino Solar Command Center is a business management system for **Akino Solar**, a Generac service company based in Knoxville, TN. It manages job costing, route optimization, warranty claims, technician scheduling, and financial analytics across TN, GA, KY, VA, and NC.

## Repository Status

- **State**: Active development
- **Source control**: Git
- **Architecture**: Single-page HTML app + Google Apps Script backend

## Getting Started

1. Open `index.html` in a browser for the frontend (works standalone with demo data)
2. To connect to live Google Sheets, paste the Apps Script URL in Settings
3. For the backend, copy `apps-script/Code.gs` into a Google Apps Script project

## Project Structure

```
solar-love/
├── CLAUDE.md              # This file
├── index.html             # Main production app (consolidated from v3)
├── apps-script/
│   ├── Code.gs            # Main Apps Script backend (41+ functions, 5 Google Sheets)
│   ├── ProfitEngine.gs    # Profit Engine module (calculations)
│   ├── MasterCommand.gs   # Route dispatching module
│   └── Reconciliation.gs  # Payment reconciliation module
├── docs/
│   ├── HANDOFF.md         # Technical handoff documentation
│   ├── MASTER_APP_GUIDE.md # Excel workbook guide
│   ├── SETUP.md           # Apps Script setup instructions
│   └── DEPLOY.md          # Web app deployment guide
├── archive/               # Previous app versions (reference only)
│   ├── Akino_Solar_Command.html      # v1 (orange theme)
│   ├── Akino_Solar_Command_v2.html   # v2 (BROKEN, dark theme)
│   ├── Akino_Solar_App.html          # Standalone reference app
│   ├── Akino_Solar_Command_Center.jsx # React component
│   ├── Sidebar_ProfitEngine.html     # GAS sidebar
│   └── Sidebar_Dispatch.html         # GAS sidebar
└── data/
    └── sample_data_job_log.tsv       # Sample job log data
```

## Architecture & Key Patterns

- **Frontend**: Single HTML file with inline CSS/JS, Tailwind CSS (CDN), Chart.js, Leaflet.js
- **Backend**: Google Apps Script connecting 5 production Google Sheets via web app API (doGet/doPost)
- **State**: In-memory DataStore with localStorage persistence, optional backend sync
- **Navigation**: Sidebar with 9 tabs, `switchTab()` function renders each tab dynamically
- **Cost Engine**: True cost = Labor + Travel + Parts + Consumables + QA + Admin + Risk + Overhead

## Key Financial Constants (must stay in sync between frontend and backend)

| Constant | Value | Notes |
|----------|-------|-------|
| Monthly Overhead | $48,704.79 | Sum of 10 overhead categories (synced from Google Sheet) |
| Fuel Per Mile | $0.99 | |
| QA Cost Per Job | $85 | |
| Admin/Mgmt Per Job | $315 | |
| Risk Buffer | $100 | |
| Employer Burden | ~40.8% | Includes health ins, 401k, payroll tax (varies by employee) |
| Jobs Per Week | 5 | Current baseline |
| Overhead Per Job | ~$2,248 | = $48,704.79 / (5 * 52/12) |
| Breakeven Per Job | ~$2,348 | = Overhead/Job + Risk Buffer |

## Personnel Loaded Rates

| Name | Hourly | Loaded | Multiplier | Role |
|------|--------|--------|------------|------|
| Sam | $25.00 | $35.21 | 1.408x | Technician |
| Lucas | $20.00 | $28.17 | 1.409x | Technician |
| Katie | $20.00 | $28.17 | 1.409x | Admin |
| Spencer | $40.00 | $56.33 | 1.408x | Technician |
| Lex | $30.00 | $42.25 | 1.408x | Job Management |
| Caden | $28.85 | $40.63 | 1.408x | Owner |
| Jen | $15.00 | $5.28 | PT | Admin (PT) |
| Andrew | $25.00 | $35.21 | 1.408x | Technician |
| QA | $13.54 | $17.60 | 1.300x | QA Lead |

## Code Conventions

- Write clear, self-documenting code; avoid unnecessary comments
- Keep changes focused and minimal
- Follow existing patterns in the codebase
- Financial constants in `index.html` CONFIG object must match `apps-script/Code.gs` CONFIG/TECH_RATES
- All monetary display uses the `fmt()` helper function
- Tab content is rendered dynamically by `render*()` functions

## Apps Script Backend API

**GET endpoints** (append `?action=XXX` to deployed URL):
- `ping` — Health check
- `snapshot` — Full business data dump
- `jobs`, `personnel`, `overhead`, `routes`, `costing`, `breakeven`
- `warranty`, `warranty_summary`, `warranty_by_month`, `warranty_by_status`
- `daily_report`, `calculate_cost`

**POST endpoints** (JSON body with `action` field):
- `add_job` — Add to all sheets
- `add_warranty` — Add warranty claim
- `update_warranty_status` — Update claim status
- `sync` — Full sync all reports

## Google Sheet IDs

| Sheet | ID |
|-------|-----|
| Job Calculation P&L | `1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE` |
| Route Optimization | `1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E` |
| Job True Cost | `1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4` |
| Warranty Claims | `1ZqTK21k4S6htIFpFO_ZL1KZ06vPcxR07jtn15fa5j54` |
| P&L Document | `11--0Uodbm7hvY2XzXg5-TUipdSgh3DkcmkFPnA5StF4` |

## Git Workflow

- Use descriptive commit messages that explain the "why"
- Keep commits focused on a single logical change
- Branch naming: feature branches should be descriptive of the change
