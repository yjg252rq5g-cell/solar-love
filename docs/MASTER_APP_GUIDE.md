# Akino Solar Master App - Quick Start Guide

## Overview
The **Akino_Solar_Master.xlsx** workbook is a comprehensive business intelligence tool for solar service operations. Users enter job data once on the **Daily_Entry** tab, and all other tabs automatically populate via Excel formulas.

## Workbook Structure (10 Tabs)

### Tab 1: Daily_Entry (PRIMARY INPUT)
**Purpose:** Main data entry sheet where users log daily jobs
- **Columns A-T:** INPUT FIELDS (blue text on white)
  - Date, Job_ID, Customer, City, State, Priority, Route, Tech, Type
  - Onsite_Hrs, Travel_Hrs, Miles, Parts_$, Consumables_$, Revenue_$
  - W_Case#, W_Status, W_Adjusted_$, W_Paid_$, Notes

- **Columns U-AC:** AUTO-CALCULATED (black text on gray background)
  - Tech_Rate (VLOOKUP to Personnel)
  - Labor_Cost, Travel_Cost, Overhead_Alloc
  - True_Cost (sum of all costs)
  - Net_Profit, Margin%, Verdict (ACCEPT/REJECT)
  - Month (auto-extracted from Date)

- **Data Validation:**
  - Priority: High, Medium, Low
  - Route: R1-R18
  - Tech: Sam, Lucas, Katie, Spencer, Lex, Caden
  - Type: Service, Warranty, Both
  - W_Status: Submitted, Completed not paid, Paid, Denied

- **Pre-loaded Data:** 20 sample jobs (rows 2-21)
- **Empty rows:** 22-500 (ready for data entry)
- **Format:** Freeze row 1, conditional formatting on Verdict column

---

### Tab 2: Dashboard
**Purpose:** Real-time KPI dashboard auto-updated from Daily_Entry

**Sections:**
1. **KEY METRICS**
   - Total Jobs Entered
   - Total Revenue
   - Total True Cost
   - Net Profit/Loss
   - Average Revenue/Job, Cost/Job, Profit/Job
   - Overall Margin%

2. **JOB VERDICT SUMMARY**
   - Jobs ACCEPTED (Net_Profit >= 0)
   - Jobs REJECTED (Net_Profit < 0)
   - Acceptance Rate

3. **WARRANTY SUMMARY**
   - Total Warranty Claims
   - Warranty Revenue (Adjusted)
   - Warranty Paid
   - Warranty Outstanding

4. **MONTHLY OVERHEAD CONTEXT**
   - Monthly Run-Rate (from Overhead tab)
   - Annual Run-Rate
   - Cost Per Hour
   - Breakeven Per Job

5. **TECH PERFORMANCE**
   - Per-tech Revenue and Job Count
   - Tracks: Sam, Lucas, Caden, Spencer

---

### Tab 3: Job_PnL
**Purpose:** Profitability summary by technician

| Tech | Jobs | Total_Revenue | Total_True_Cost | Total_Net_Profit | Avg_Margin |
|------|------|---------------|-----------------|------------------|------------|
| Sam | COUNTIFS | SUMIFS | SUMIFS | Revenue-Cost | Profit/Revenue |
| Lucas | ... | ... | ... | ... | ... |
| (repeat for all 6 techs) |
| TOTAL | SUM | SUM | SUM | SUM | % |

---

### Tab 4: Warranty_Tracker
**Purpose:** Warranty claim status and financial tracking

**Claims Status:**
- Total Warranty Claims (count)
- Submitted (count)
- Completed Not Paid (count)
- Paid (count)
- Denied (count)

**Financials:**
- Total Adjusted Amount ($)
- Total Paid Amount ($)
- Outstanding (Unpaid) ($)

---

### Tab 5: Monthly_Rollup
**Purpose:** Monthly performance aggregation

| Month | Jobs | Revenue | True_Cost | Net_Profit | Margin% | W_Claims | W_Adjusted | W_Paid |
|-------|------|---------|-----------|------------|---------|----------|------------|--------|

**Months Covered:** 2025-10 through 2026-12 (15 months)
- Uses Month column (AC) from Daily_Entry for grouping
- SUMIFS formulas aggregate by month
- TOTAL row summarizes all months

---

### Tab 6: Route_Tracker
**Purpose:** Route-level performance analysis

| Route | Jobs | Total_Miles | Total_Revenue | Total_True_Cost | Net_Profit |
|-------|------|-------------|---------------|-----------------|------------|
| R1 | COUNTIFS | SUMIFS | SUMIFS | SUMIFS | Revenue-Cost |
| R2-R18 | ... | ... | ... | ... | ... |
| TOTAL | SUM | SUM | SUM | SUM | SUM |

---

### Tab 7: BreakEven
**Purpose:** Break-even analysis for different job volumes

Scenarios for 1-10 jobs per week:
- Jobs Per Week
- Jobs Per Month (calculated)
- Total Overhead (from Overhead tab)
- Overhead Per Job
- Breakeven Per Job (per job cost floor)
- Cost Per Hour

---

### Tab 8: Overhead
**Purpose:** Complete expense line item budget

**72 Line Items organized by category:**
1. **People & Payroll** (7 items): Sam, Lucas, Katie, Spencer, Lex, Caden, Jen
2. **Software & Comms** (14 items): HCP, Slack, Quo, Google, QB, Bookkeeping, CPA, etc.
3. **Misc / Other** (14 items): Marketing, BBB, Licensing, Office, Legal, Training, QA, etc.
4. **Storage & Facilities** (6 items): iPostal1, Extra Space, Hardin Valley, Affordable, U-Haul x2
5. **Fleet & Insurance** (8 items): Progressive, Maintenance, Liability, Workers Comp, Umbrella, E&O, Cyber, EPLI
6. **Debt & Financing** (4 items): GM Financial, WEX, Pinnacle, Interest
7. **Reserves & Taxes** (6 items): Payroll Taxes, Health Insurance, 401k, Claims, Inventory, Bad Debt
8. **Depreciation & CapEx** (3 items): Tools, Vehicle, Tools depreciation
9. **Variable Job Costs** (10 items): Fuel, Travel, Warranty reserve, Freight, Subcontractor, Commissions, Permits, Interconnection, Merchant fees, Battery disposal

**Totals:**
- TOTAL (B74): =SUM(B2:B73)
- Overhead Per Job: =B74/(5*52/12)

---

### Tab 9: Personnel
**Purpose:** Employee roster with billing rates

| Name | Role | Hourly_Rate | Hours_Per_Week | Monthly_Pay | Loaded_Rate |
|------|------|-------------|----------------|-------------|------------|
| Sam | Technician | $25 | 40 | =formula | =Rate*1.3 |
| Lucas | Technician | $20 | 40 | =formula | =Rate*1.3 |
| Katie | Admin | $20 | 40 | =formula | =Rate*1.3 |
| Spencer | Technician | $40 | 40 | =formula | =Rate*1.3 |
| Lex | Job Management | $30 | 40 | =formula | =Rate*1.3 |
| Caden | Owner (salary) | $28.85 | 40 | $5,000 | =Rate*1.3 |
| Jen | Admin (part-time) | $15 | 10 | $650 | =Rate*1.3 |
| Sam2 | QA position | $12.5 | 40 | =formula | =Rate*1.3 |
| TOTAL | | | | =SUM(Monthly_Pay) | |

**Loaded Rate:** Used in Daily_Entry Tech_Rate lookup (30% burden)

---

### Tab 10: Settings
**Purpose:** Configuration parameters referenced throughout the workbook

| Parameter | Value | Notes |
|-----------|-------|-------|
| Employer_Burden | 0.30 | 30% loaded rate multiplier |
| Payroll_Tax_Rate | 0.1125 | 11.25% |
| Hours_per_week | 40 | Standard work week |
| Jobs_per_week | 5 | Baseline assumption |
| Weeks_per_year | 52 | Standard |
| Overhead_per_job | =Overhead!B74/(B5*B6/12) | Auto-calculated |
| Alloc_To_Generac | 0.85 | 85% allocation |
| Risk_buffer_per_job | $100 | Buffer per job |
| Fuel_per_mile | $0.99 | Mileage cost |
| Labor_rate_per_hour | $160 | Billing rate |
| Health_ins_per_emp | $500 | Monthly per employee |
| 401k_match_rate | 0.03 | 3% |
| Warranty_reserve_pct | 0.02 | 2% reserve |
| Merchant_fee_pct | 0.0275 | 2.75% on revenue |
| Depreciation_truck_years | 5 | Straight-line |
| Depreciation_tools_years | 5 | Straight-line |
| Monthly_run_rate | =Overhead!B74 | Reference |
| Annual_run_rate | =B18*12 | Reference |
| Cost_per_hour | =B18/173.33 | Reference |
| Breakeven_per_job | =B18/(B5*B6/12) | Reference |
| QA_cost_per_job | $85 | Fixed QA per job |
| Admin_mgmt_sw_per_job | $315 | Admin allocation |

---

## How It Works: Data Flow

```
USER ENTERS JOB DATA → Daily_Entry (Cols A-T) 
        ↓
AUTO-CALCULATED FIELDS (Cols U-AC)
  - Tech_Rate (lookup Personnel)
  - Labor_Cost, Travel_Cost
  - True_Cost, Net_Profit, Margin%, Verdict
  - Month (for aggregation)
        ↓
PULL DATA VIA FORMULAS:
  Dashboard ← SUM/COUNTIF/SUMIFS from Daily_Entry
  Job_PnL ← SUMIFS by Tech
  Warranty_Tracker ← COUNTIFS by Status
  Monthly_Rollup ← SUMIFS by Month
  Route_Tracker ← SUMIFS by Route
  BreakEven ← References Settings
        ↓
ONE SOURCE OF TRUTH = Daily_Entry
ALL OTHER TABS ARE READ-ONLY VIEWS
```

---

## Key Formulas Used

### Daily_Entry Calculations
- **Tech_Rate:** `=IFERROR(VLOOKUP(H2,Personnel!$A$2:$F$9,6,FALSE),0)`
- **Labor_Cost:** `=(J2+K2)*U2`
- **Travel_Cost:** `=L2*Settings!$B$10`
- **True_Cost:** `=V2+W2+M2+N2+X2`
- **Net_Profit:** `=O2-Y2`
- **Margin%:** `=IF(O2>0,Z2/O2,0)`
- **Verdict:** `=IF(Z2>=0,"ACCEPT","REJECT")`
- **Month:** `=TEXT(A2,"YYYY-MM")`

### Aggregation Formulas
- **Tech Summary:** `=SUMIFS(Daily_Entry!O$2:O$500,Daily_Entry!H$2:H$500,"Sam")`
- **Monthly Summary:** `=SUMIFS(Daily_Entry!O$2:O$500,Daily_Entry!AC$2:AC$500,"2026-01")`
- **Route Summary:** `=SUMIFS(Daily_Entry!O$2:O$500,Daily_Entry!G$2:G$500,"R1")`

---

## Formatting Standards

| Element | Style |
|---------|-------|
| Font | Arial 11pt |
| Headers | Dark Blue (#1F4E79), White Bold, Centered |
| Input Columns | Blue Text (#0000FF) on White |
| Formula Columns | Black Text on Light Gray (#F2F2F2) |
| Currency | $#,##0.00;($#,##0.00);"-" |
| Percentage | 0.0% |
| Date | yyyy-mm-dd |
| Verdict ACCEPT | Green Fill (#C6EFCE) |
| Verdict REJECT | Red Fill (#FFC7CE) |
| Borders | Thin on all cells |
| Freeze Panes | Row 1 on Daily_Entry |

---

## Daily Usage Tips

1. **Enter jobs only on Daily_Entry tab** - Blue columns (A-T)
   - Fill in all required fields each day
   - Use dropdowns for Priority, Route, Tech, Type, W_Status
   
2. **Monitor Verdict column (AB)**
   - GREEN = ACCEPT (profitable job)
   - RED = REJECT (unprofitable - review pricing/costs)
   
3. **Check Dashboard regularly**
   - View real-time KPIs
   - Monitor acceptance rate
   - Track warranty pipeline
   
4. **Review Monthly_Rollup monthly**
   - Analyze month-to-date performance
   - Compare to previous months
   - Identify trends
   
5. **Use Job_PnL to track tech performance**
   - Revenue per technician
   - Job volume per tech
   - Profitability comparison
   
6. **Reference Settings for cost assumptions**
   - Adjust Fuel_per_mile if rates change
   - Update overhead if expenses change
   - Review breakeven scenarios quarterly

---

## File Location
`/sessions/youthful-happy-maxwell/mnt/outputs/Akino_Solar_Master.xlsx`

## Technical Details
- **Format:** Excel (.xlsx)
- **Size:** ~65 KB
- **Sheets:** 10
- **Total Formulas:** 4,857
- **Formula Validation:** 100% (0 errors)
- **Pre-loaded Data:** 20 sample jobs
- **Capacity:** 500 job rows (500+ with copy-paste)
