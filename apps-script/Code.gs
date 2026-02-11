// ============================================================================
// AKINO SOLAR — MASTER GOOGLE APPS SCRIPT V2.0
// Connects all 6 source sheets into one automated system
// Enhanced warranty tracking with materials, RMA, go-back, detailed financials
// ============================================================================

// SHEET IDs (your actual Google Sheets):
const SHEET_IDS = {
  JOB_CALC: '1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE',       // Job Calculation for Profit and Loss
  ROUTE_OPT: '1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E',      // Main Route Optimization
  JOB_TRUE_COST: '1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4',   // Copy of Generac Job True Cost
  WARRANTY: '1ZqTK21k4S6htIFpFO_ZL1KZ06vPcxR07jtn15fa5j54',         // ORIGINAL $ Generac Service Warranty Claims
  PNL_DOC: '11--0Uodbm7hvY2XzXg5-TUipdSgh3DkcmkFPnA5StF4'          // AKINO SOLAR TRUE COST P&L CALCULATION (Doc)
};

// SETTINGS — pulled from your actual data
const CONFIG = {
  EMPLOYER_BURDEN: 0.30,
  PAYROLL_TAX_RATE: 0.1125,
  FUEL_PER_MILE: 0.99,
  JOBS_PER_WEEK: 5,
  WEEKS_PER_YEAR: 52,
  HOURS_PER_MONTH: 173.33,
  ALLOC_TO_GENERAC: 0.85,
  RISK_BUFFER: 100,
  QA_COST_PER_JOB: 85,
  ADMIN_MGMT_SW_PER_JOB: 315,
  HEALTH_INS_PER_EMP: 500,
  MATCH_401K: 0.03,
  WARRANTY_RESERVE_PCT: 0.02,
  MERCHANT_FEE_PCT: 0.0275,
  BAD_DEBT_PCT: 0.01,
};

// TECH LOADED RATES
const TECH_RATES = {
  'Sam': { hourly: 25, loaded: 32.50 },
  'Lucas': { hourly: 20, loaded: 26.00 },
  'Katie': { hourly: 20, loaded: 26.00 },
  'Spencer': { hourly: 40, loaded: 52.00 },
  'Lex': { hourly: 30, loaded: 39.00 },
  'Caden': { hourly: 28.85, loaded: 37.51 },
  'Jen': { hourly: 15, loaded: 19.50 },
  'Andrew': { hourly: 25, loaded: 32.50 },
};

// WARRANTY STATUS VALUES — all possible statuses for warranty claims
const WARRANTY_STATUSES = [
  'Paid',
  'Needs Attention',
  'Scheduled',
  'Submitted',
  'Completed not paid',
  'Waiting RMA',
  'Waiting Go Back',
  'Parts Ordered',
  'RMA Approved',
  'RMA Denied',
  'Go Back Scheduled',
  'Go Back Complete',
  'In Progress',
  'Pending Review',
  'Denied',
  'Cancelled',
];

// FULL WARRANTY COLUMN HEADERS (20-column layout used by most monthly tabs)
const WARRANTY_HEADERS_FULL = [
  'STATUS:', 'CUSTOMER NAME:', 'DATE OF JOB:', 'CASE#', 'TECH NAME:',
  'ALLOTTED TRAVEL:', 'ACTUAL TRAVEL TIME:', 'DISTANCE MILEAGE:',
  'ACTUAL MILEAGE:', 'ALLOTTED TECH TIME:', 'ACTUAL TECH TIME:',
  'ALLOTTED AMOUNT:', 'ADJUSTED AMOUNT:', 'PAID AMOUNT:',
  'DATE CHECK CUT:', 'SVN#:', 'COMPANY COST:', 'PROFIT AMOUNT:',
  'LOSS AMOUNT:', 'NOTES:'
];

// ============================================================================
// 1. OPEN SPREADSHEETS
// ============================================================================
function getSheet(id, tabName) {
  const ss = SpreadsheetApp.openById(id);
  return tabName ? ss.getSheetByName(tabName) : ss.getSheets()[0];
}

function getJobCalcSS() { return SpreadsheetApp.openById(SHEET_IDS.JOB_CALC); }
function getRouteOptSS() { return SpreadsheetApp.openById(SHEET_IDS.ROUTE_OPT); }
function getJobTrueCostSS() { return SpreadsheetApp.openById(SHEET_IDS.JOB_TRUE_COST); }
function getWarrantySS() { return SpreadsheetApp.openById(SHEET_IDS.WARRANTY); }

// ============================================================================
// 2. CORE: CALCULATE TRUE COST FOR ANY JOB
// ============================================================================
function calculateTrueCost(techName, onsiteHrs, travelHrs, miles, partsCost, consumables) {
  const rate = TECH_RATES[techName] ? TECH_RATES[techName].loaded : 30;
  const laborCost = (onsiteHrs + travelHrs) * rate;
  const travelCost = miles * CONFIG.FUEL_PER_MILE;
  const overheadPerJob = getMonthlyOverhead() / (CONFIG.JOBS_PER_WEEK * CONFIG.WEEKS_PER_YEAR / 12);

  const trueCost = laborCost + travelCost + (partsCost || 0) + (consumables || 0) + overheadPerJob;

  return {
    techRate: rate,
    laborCost: laborCost,
    travelCost: travelCost,
    partsCost: partsCost || 0,
    consumables: consumables || 0,
    overheadAlloc: overheadPerJob,
    trueCost: trueCost,
  };
}

// ============================================================================
// 3. READ MONTHLY OVERHEAD FROM JOB CALCULATION SHEET
// ============================================================================
function getMonthlyOverhead() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'Overhead_Details');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'Total_Monthly_All' || data[i][0] === 'TOTAL') {
      return data[i][1];
    }
  }
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    if (typeof data[i][1] === 'number') total += data[i][1];
  }
  return total;
}

// ============================================================================
// 4. READ ALL PERSONNEL FROM JOB CALCULATION
// ============================================================================
function getPersonnel() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'Personnel');
  const data = sheet.getDataRange().getValues();
  const people = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      people.push({
        name: data[i][0],
        role: data[i][1],
        hourly: data[i][2],
        monthlyPay: data[i][3],
        annualPay: data[i][4],
        loadedRate: data[i][5],
      });
    }
  }
  return people;
}

// ============================================================================
// 5. READ ALL JOBS FROM ROUTE OPTIMIZATION
// ============================================================================
function getRouteJobs() {
  const sheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Jobs');
  const data = sheet.getDataRange().getValues();
  const jobs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] || data[i][2]) {
      jobs.push({
        jobId: data[i][0],
        priority: data[i][1],
        customer: data[i][2],
        city: data[i][3],
        state: data[i][4],
        zip: data[i][5],
        requestedDate: data[i][6],
        routeDate: data[i][7],
        tech: data[i][8],
        tags: data[i][9],
        revenue: data[i][10] || 0,
        notes: data[i][11],
        jobFlags: data[i][12],
        row: i + 1,
      });
    }
  }
  return jobs;
}

// ============================================================================
// 6. READ ROUTE SUMMARY
// ============================================================================
function getRouteSummary() {
  const sheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Route Summary');
  const data = sheet.getDataRange().getValues();
  const routes = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      routes.push({
        routeId: data[i][0],
        numJobs: data[i][1],
        totalMiles: data[i][2],
        totalDriveMin: data[i][3],
        routeValue: data[i][4],
      });
    }
  }
  return routes;
}

// ============================================================================
// 7. READ ROUTE P&L REPORT
// ============================================================================
function getRoutePnL() {
  const sheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Profit_Loss_Report');
  const data = sheet.getDataRange().getValues();
  const report = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      report.push({
        jobId: data[i][0],
        tech: data[i][1],
        revenue: data[i][2] || 0,
        trueCost: data[i][3] || 0,
        netProfit: data[i][4] || 0,
        verdict: data[i][5],
      });
    }
  }
  return report;
}

// ============================================================================
// 8. READ SETTINGS FROM ROUTE OPTIMIZATION
// ============================================================================
function getRouteSettings() {
  const sheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Settings');
  const data = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i][0]) settings[data[i][0]] = data[i][1];
  }
  return settings;
}

// ============================================================================
// 9. READ WARRANTY CLAIMS — DYNAMIC HEADER MAPPING (handles 18 or 20 col)
// Reads ALL fields from EVERY monthly tab in the ORIGINAL warranty sheet
// ============================================================================
function getAllWarrantyClaims() {
  const ss = getWarrantySS();
  const sheets = ss.getSheets();
  const allClaims = [];

  sheets.forEach(function(sheet) {
    const name = sheet.getName();
    // Skip non-month tabs
    if (name === 'Form Responses 1') return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    // Build header map dynamically — maps column name to index
    const headerMap = {};
    for (let c = 0; c < data[0].length; c++) {
      const h = data[0][c].toString().trim().toUpperCase().replace(/:$/, '');
      headerMap[h] = c;
    }

    // Helper to get value by header name
    function val(row, headerName) {
      const idx = headerMap[headerName];
      return idx !== undefined ? row[idx] : '';
    }

    for (let i = 1; i < data.length; i++) {
      // Skip empty rows
      if (!val(data[i], 'CUSTOMER NAME') && !val(data[i], 'CASE#')) continue;

      allClaims.push({
        // Source tracking
        month: name,
        sourceSheet: name,
        row: i + 1,
        // Core fields
        status: val(data[i], 'STATUS'),
        customerName: val(data[i], 'CUSTOMER NAME'),
        dateOfJob: val(data[i], 'DATE OF JOB'),
        caseNum: val(data[i], 'CASE#'),
        techName: val(data[i], 'TECH NAME'),
        // Travel details
        allottedTravel: val(data[i], 'ALLOTTED TRAVEL'),
        actualTravelTime: val(data[i], 'ACTUAL TRAVEL TIME'),
        distanceMileage: val(data[i], 'DISTANCE MILEAGE'),
        actualMileage: val(data[i], 'ACTUAL MILEAGE'),
        // Tech time details
        allottedTechTime: val(data[i], 'ALLOTTED TECH TIME'),
        actualTechTime: val(data[i], 'ACTUAL TECH TIME'),
        // Financial details
        allottedAmount: val(data[i], 'ALLOTTED AMOUNT'),
        adjustedAmount: val(data[i], 'ADJUSTED AMOUNT'),
        paidAmount: val(data[i], 'PAID AMOUNT'),
        // Payment tracking
        dateCheckCut: val(data[i], 'DATE CHECK CUT'),
        svnNum: val(data[i], 'SVN#'),
        // Company financials
        companyCost: val(data[i], 'COMPANY COST'),
        profitAmount: val(data[i], 'PROFIT AMOUNT'),
        lossAmount: val(data[i], 'LOSS AMOUNT'),
        // Notes
        notes: val(data[i], 'NOTES'),
      });
    }
  });
  return allClaims;
}

// ============================================================================
// 10. WARRANTY: Get claims for a specific month tab
// ============================================================================
function getWarrantyByMonth(monthName) {
  const ss = getWarrantySS();
  const sheet = ss.getSheetByName(monthName);
  if (!sheet) return { error: 'Tab not found: ' + monthName, availableTabs: getWarrantyTabNames() };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headerMap = {};
  for (let c = 0; c < data[0].length; c++) {
    const h = data[0][c].toString().trim().toUpperCase().replace(/:$/, '');
    headerMap[h] = c;
  }
  function val(row, headerName) {
    const idx = headerMap[headerName];
    return idx !== undefined ? row[idx] : '';
  }

  const claims = [];
  for (let i = 1; i < data.length; i++) {
    if (!val(data[i], 'CUSTOMER NAME') && !val(data[i], 'CASE#')) continue;
    claims.push({
      row: i + 1,
      month: monthName,
      status: val(data[i], 'STATUS'),
      customerName: val(data[i], 'CUSTOMER NAME'),
      dateOfJob: val(data[i], 'DATE OF JOB'),
      caseNum: val(data[i], 'CASE#'),
      techName: val(data[i], 'TECH NAME'),
      allottedTravel: val(data[i], 'ALLOTTED TRAVEL'),
      actualTravelTime: val(data[i], 'ACTUAL TRAVEL TIME'),
      distanceMileage: val(data[i], 'DISTANCE MILEAGE'),
      actualMileage: val(data[i], 'ACTUAL MILEAGE'),
      allottedTechTime: val(data[i], 'ALLOTTED TECH TIME'),
      actualTechTime: val(data[i], 'ACTUAL TECH TIME'),
      allottedAmount: val(data[i], 'ALLOTTED AMOUNT'),
      adjustedAmount: val(data[i], 'ADJUSTED AMOUNT'),
      paidAmount: val(data[i], 'PAID AMOUNT'),
      dateCheckCut: val(data[i], 'DATE CHECK CUT'),
      svnNum: val(data[i], 'SVN#'),
      companyCost: val(data[i], 'COMPANY COST'),
      profitAmount: val(data[i], 'PROFIT AMOUNT'),
      lossAmount: val(data[i], 'LOSS AMOUNT'),
      notes: val(data[i], 'NOTES'),
    });
  }
  return claims;
}

// ============================================================================
// 11. WARRANTY: Get all tab names from warranty sheet
// ============================================================================
function getWarrantyTabNames() {
  const ss = getWarrantySS();
  return ss.getSheets().map(function(s) { return s.getName(); });
}

// ============================================================================
// 12. WARRANTY: Filter claims by status (Waiting RMA, Waiting Go Back, etc.)
// ============================================================================
function getWarrantyByStatus(status) {
  const allClaims = getAllWarrantyClaims();
  return allClaims.filter(function(c) {
    if (!c.status) return false;
    return c.status.toString().toLowerCase().includes(status.toLowerCase());
  });
}

// ============================================================================
// 13. WARRANTY: Financial summary across all months
// ============================================================================
function getWarrantySummary() {
  const allClaims = getAllWarrantyClaims();
  const byMonth = {};
  const byTech = {};
  const byStatus = {};

  let totalAllotted = 0;
  let totalAdjusted = 0;
  let totalPaid = 0;
  let totalCompanyCost = 0;
  let totalProfit = 0;
  let totalLoss = 0;

  allClaims.forEach(function(c) {
    // Parse dollar amounts
    function parseDollar(val) {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      return parseFloat(val.toString().replace(/[$,]/g, '')) || 0;
    }

    const allotted = parseDollar(c.allottedAmount);
    const adjusted = parseDollar(c.adjustedAmount);
    const paid = parseDollar(c.paidAmount);
    const companyCost = parseDollar(c.companyCost);
    const profit = parseDollar(c.profitAmount);
    const loss = parseDollar(c.lossAmount);

    totalAllotted += allotted;
    totalAdjusted += adjusted;
    totalPaid += paid;
    totalCompanyCost += companyCost;
    totalProfit += profit;
    totalLoss += loss;

    // By month
    if (!byMonth[c.month]) {
      byMonth[c.month] = { claims: 0, allotted: 0, adjusted: 0, paid: 0, companyCost: 0, profit: 0, loss: 0 };
    }
    byMonth[c.month].claims++;
    byMonth[c.month].allotted += allotted;
    byMonth[c.month].adjusted += adjusted;
    byMonth[c.month].paid += paid;
    byMonth[c.month].companyCost += companyCost;
    byMonth[c.month].profit += profit;
    byMonth[c.month].loss += loss;

    // By tech
    const tech = c.techName ? c.techName.toString().trim() : 'Unknown';
    if (!byTech[tech]) {
      byTech[tech] = { claims: 0, allotted: 0, adjusted: 0, paid: 0, companyCost: 0, profit: 0, loss: 0 };
    }
    byTech[tech].claims++;
    byTech[tech].allotted += allotted;
    byTech[tech].paid += paid;
    byTech[tech].companyCost += companyCost;
    byTech[tech].profit += profit;

    // By status
    const status = c.status ? c.status.toString().trim() : 'Unknown';
    if (!byStatus[status]) byStatus[status] = 0;
    byStatus[status]++;
  });

  return {
    totalClaims: allClaims.length,
    totals: {
      allottedAmount: totalAllotted,
      adjustedAmount: totalAdjusted,
      paidAmount: totalPaid,
      companyCost: totalCompanyCost,
      profitAmount: totalProfit,
      lossAmount: totalLoss,
      netResult: totalProfit - Math.abs(totalLoss),
    },
    byMonth: byMonth,
    byTech: byTech,
    byStatus: byStatus,
    availableStatuses: WARRANTY_STATUSES,
  };
}

// ============================================================================
// 14. WARRANTY: Get stale claims (unpaid for X+ days)
// ============================================================================
function getStaleWarrantyClaims(days) {
  days = days || 30;
  const allClaims = getAllWarrantyClaims();
  const today = new Date();
  return allClaims.filter(function(c) {
    // Check for any unpaid/pending status
    if (!c.status) return false;
    const s = c.status.toString().toLowerCase();
    const isUnpaid = s.includes('completed not paid') || s.includes('needs attention') ||
                     s.includes('submitted') || s.includes('waiting') || s.includes('pending');
    if (!isUnpaid) return false;
    if (!c.dateOfJob) return false;
    const jobDate = new Date(c.dateOfJob);
    if (isNaN(jobDate.getTime())) return false;
    const diffDays = (today - jobDate) / (1000 * 60 * 60 * 24);
    return diffDays > days;
  });
}

// ============================================================================
// 15. WARRANTY: Get claims waiting for RMA
// ============================================================================
function getWaitingRMA() {
  return getWarrantyByStatus('Waiting RMA');
}

// ============================================================================
// 16. WARRANTY: Get claims waiting for go-back
// ============================================================================
function getWaitingGoBack() {
  return getWarrantyByStatus('Waiting Go Back');
}

// ============================================================================
// 17. WARRANTY: Update claim status in a specific month tab
// ============================================================================
function updateWarrantyStatus(monthName, rowNum, newStatus, notes) {
  const ss = getWarrantySS();
  const sheet = ss.getSheetByName(monthName);
  if (!sheet) return { error: 'Tab not found: ' + monthName };

  // Find STATUS column (always A = col 1)
  sheet.getRange(rowNum, 1).setValue(newStatus);

  // Update NOTES if provided (find notes column dynamically)
  if (notes) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (let c = 0; c < headers.length; c++) {
      if (headers[c].toString().toUpperCase().includes('NOTES')) {
        const existing = sheet.getRange(rowNum, c + 1).getValue();
        const timestamp = new Date().toLocaleDateString('en-US');
        const updated = existing ? existing + ' | ' + timestamp + ': ' + notes : timestamp + ': ' + notes;
        sheet.getRange(rowNum, c + 1).setValue(updated);
        break;
      }
    }
  }
  return { success: true, month: monthName, row: rowNum, newStatus: newStatus };
}

// ============================================================================
// 18. WARRANTY: Update financial fields on a claim
// ============================================================================
function updateWarrantyFinancials(monthName, rowNum, financials) {
  const ss = getWarrantySS();
  const sheet = ss.getSheetByName(monthName);
  if (!sheet) return { error: 'Tab not found: ' + monthName };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let c = 0; c < headers.length; c++) {
    headerMap[headers[c].toString().trim().toUpperCase().replace(/:$/, '')] = c + 1;
  }

  const updates = {};
  if (financials.paidAmount !== undefined && headerMap['PAID AMOUNT']) {
    sheet.getRange(rowNum, headerMap['PAID AMOUNT']).setValue(financials.paidAmount);
    updates.paidAmount = financials.paidAmount;
  }
  if (financials.adjustedAmount !== undefined && headerMap['ADJUSTED AMOUNT']) {
    sheet.getRange(rowNum, headerMap['ADJUSTED AMOUNT']).setValue(financials.adjustedAmount);
    updates.adjustedAmount = financials.adjustedAmount;
  }
  if (financials.companyCost !== undefined && headerMap['COMPANY COST']) {
    sheet.getRange(rowNum, headerMap['COMPANY COST']).setValue(financials.companyCost);
    updates.companyCost = financials.companyCost;
  }
  if (financials.profitAmount !== undefined && headerMap['PROFIT AMOUNT']) {
    sheet.getRange(rowNum, headerMap['PROFIT AMOUNT']).setValue(financials.profitAmount);
    updates.profitAmount = financials.profitAmount;
  }
  if (financials.lossAmount !== undefined && headerMap['LOSS AMOUNT']) {
    sheet.getRange(rowNum, headerMap['LOSS AMOUNT']).setValue(financials.lossAmount);
    updates.lossAmount = financials.lossAmount;
  }
  if (financials.dateCheckCut !== undefined && headerMap['DATE CHECK CUT']) {
    sheet.getRange(rowNum, headerMap['DATE CHECK CUT']).setValue(financials.dateCheckCut);
    updates.dateCheckCut = financials.dateCheckCut;
  }
  if (financials.svnNum !== undefined && headerMap['SVN#']) {
    sheet.getRange(rowNum, headerMap['SVN#']).setValue(financials.svnNum);
    updates.svnNum = financials.svnNum;
  }

  return { success: true, month: monthName, row: rowNum, updated: updates };
}

// ============================================================================
// 19. READ GENERAC JOB TRUE COST (job costing sheet)
// ============================================================================
function getJobCostingData() {
  const sheet = getSheet(SHEET_IDS.JOB_TRUE_COST, 'job costing');
  const data = sheet.getDataRange().getValues();
  const jobs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2]) {
      jobs.push({
        jobId: data[i][0],
        customer: data[i][1],
        tech: data[i][2],
        onsiteHrs: data[i][3] || 0,
        travelHrs: data[i][4] || 0,
        partsCost: data[i][5] || 0,
        consumables: data[i][6] || 0,
        totalRevenue: data[i][7] || 0,
        trueCost: data[i][8] || 0,
        profitLoss: data[i][9] || 0,
        accept: data[i][10],
        lossReason: data[i][11],
      });
    }
  }
  return jobs;
}

// ============================================================================
// 20. READ BREAK-EVEN SCENARIOS
// ============================================================================
function getBreakEvenScenarios() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'BreakEven_Scenario');
  const data = sheet.getDataRange().getValues();
  const scenarios = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      scenarios.push({
        jobsPerWeek: data[i][0],
        jobsPerMonth: data[i][1],
        overhead: data[i][2],
        overheadPerJob: data[i][3],
        breakEvenPerJob: data[i][4],
        costPerHour: data[i][5],
      });
    }
  }
  return scenarios;
}

// ============================================================================
// 21. READ ASSUMPTIONS
// ============================================================================
function getAssumptions() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'Assumptions');
  const data = sheet.getDataRange().getValues();
  const assumptions = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) assumptions[data[i][0]] = data[i][1];
  }
  return assumptions;
}

// ============================================================================
// 22. READ LIABILITIES
// ============================================================================
function getLiabilities() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'Liabilities');
  const data = sheet.getDataRange().getValues();
  const liabilities = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      liabilities.push({
        name: data[i][0],
        balance: data[i][1],
        rate: data[i][2],
        payment: data[i][3],
      });
    }
  }
  return liabilities;
}

// ============================================================================
// 23. WRITE: ADD NEW JOB TO ROUTE OPTIMIZATION (Jobs tab)
// ============================================================================
function addJobToRouteOpt(jobData) {
  const sheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Jobs');
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, 14).setValues([[
    jobData.jobId || '',
    jobData.priority || 'Medium',
    jobData.customer || '',
    jobData.city || '',
    jobData.state || 'TN',
    jobData.zip || '',
    jobData.requestedDate || new Date(),
    jobData.routeDate || '',
    jobData.tech || '',
    jobData.tags || 'Needs Scheduling',
    jobData.revenue || 0,
    jobData.notes || '',
    jobData.jobFlags || '',
    jobData.assigned || '',
  ]]);
  return lastRow + 1;
}

// ============================================================================
// 24. WRITE: ADD JOB TO TRUE COST SHEET (job costing tab)
// ============================================================================
function addJobToTrueCost(jobData) {
  const sheet = getSheet(SHEET_IDS.JOB_TRUE_COST, 'job costing');
  const cost = calculateTrueCost(
    jobData.tech,
    jobData.onsiteHrs || 0,
    jobData.travelHrs || 0,
    jobData.miles || 0,
    jobData.partsCost || 0,
    jobData.consumables || 0
  );
  const profit = (jobData.revenue || 0) - cost.trueCost;
  const accept = profit >= 0 ? 'YES' : 'NO';
  const lossReason = profit < 0 ? 'Overhead exceeds revenue' : '';

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, 12).setValues([[
    jobData.jobId || '',
    jobData.customer || '',
    jobData.tech || '',
    jobData.onsiteHrs || 0,
    jobData.travelHrs || 0,
    jobData.partsCost || 0,
    jobData.consumables || 0,
    jobData.revenue || 0,
    cost.trueCost,
    profit,
    accept,
    lossReason,
  ]]);
  return { row: lastRow + 1, cost: cost, profit: profit, accept: accept };
}

// ============================================================================
// 25. WRITE: ADD WARRANTY CLAIM — FULL 20-COLUMN with materials & RMA
// Adds to the correct monthly tab, creates tab if needed
// ============================================================================
function addWarrantyClaim(claimData) {
  const ss = getWarrantySS();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const tabName = claimData.month || (monthNames[now.getMonth()] + ' ' + now.getFullYear());

  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    // Use full 20-column header
    sheet.getRange(1, 1, 1, 20).setValues([WARRANTY_HEADERS_FULL]);
    sheet.getRange(1, 1, 1, 20).setFontWeight('bold');
    // Color code financial columns
    sheet.getRange(1, 17).setFontColor('#FF0000'); // Company Cost red
    sheet.getRange(1, 18).setFontColor('#008000'); // Profit green
    sheet.getRange(1, 19).setFontColor('#FF0000'); // Loss red
  }

  // Calculate company cost if we have tech info
  let companyCost = claimData.companyCost || 0;
  if (!companyCost && claimData.techName) {
    const rate = TECH_RATES[claimData.techName] ? TECH_RATES[claimData.techName].loaded : 30;
    const onsiteHrs = parseTimeToHours(claimData.actualTechTime) || 2;
    const travelHrs = parseTimeToHours(claimData.actualTravelTime) || 2;
    companyCost = (onsiteHrs + travelHrs) * rate;
  }

  // Calculate profit/loss
  const allotted = parseDollarAmount(claimData.allottedAmount);
  const adjusted = parseDollarAmount(claimData.adjustedAmount);
  const revenue = adjusted || allotted;
  const profitAmount = revenue > companyCost ? revenue - companyCost : 0;
  const lossAmount = companyCost > revenue ? companyCost - revenue : 0;

  // Build notes with materials and RMA tracking
  let notes = claimData.notes || '';
  if (claimData.materials) {
    notes += (notes ? ' | ' : '') + 'MATERIALS: ' + claimData.materials;
  }
  if (claimData.rmaNumber) {
    notes += (notes ? ' | ' : '') + 'RMA#: ' + claimData.rmaNumber;
  }
  if (claimData.rmaStatus) {
    notes += (notes ? ' | ' : '') + 'RMA STATUS: ' + claimData.rmaStatus;
  }
  if (claimData.goBackReason) {
    notes += (notes ? ' | ' : '') + 'GO-BACK: ' + claimData.goBackReason;
  }
  if (claimData.goBackDate) {
    notes += (notes ? ' | ' : '') + 'GO-BACK DATE: ' + claimData.goBackDate;
  }
  if (claimData.partsOrdered) {
    notes += (notes ? ' | ' : '') + 'PARTS ORDERED: ' + claimData.partsOrdered;
  }
  if (claimData.partsETA) {
    notes += (notes ? ' | ' : '') + 'PARTS ETA: ' + claimData.partsETA;
  }

  // Determine how many columns this tab has
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let c = 0; c < headerRow.length; c++) {
    headerMap[headerRow[c].toString().trim().toUpperCase().replace(/:$/, '')] = c;
  }

  // Build row based on actual header positions
  const numCols = headerRow.length;
  const newRow = new Array(numCols).fill('');

  function setCol(headerName, value) {
    const idx = headerMap[headerName];
    if (idx !== undefined) newRow[idx] = value;
  }

  setCol('STATUS', claimData.status || 'Submitted');
  setCol('CUSTOMER NAME', claimData.customerName || '');
  setCol('DATE OF JOB', claimData.dateOfJob || new Date());
  setCol('CASE#', claimData.caseNum || '');
  setCol('TECH NAME', claimData.techName || '');
  setCol('ALLOTTED TRAVEL', claimData.allottedTravel || '');
  setCol('ACTUAL TRAVEL TIME', claimData.actualTravelTime || '');
  setCol('DISTANCE MILEAGE', claimData.distanceMileage || '');
  setCol('ACTUAL MILEAGE', claimData.actualMileage || '');
  setCol('ALLOTTED TECH TIME', claimData.allottedTechTime || '');
  setCol('ACTUAL TECH TIME', claimData.actualTechTime || '');
  setCol('ALLOTTED AMOUNT', claimData.allottedAmount || '');
  setCol('ADJUSTED AMOUNT', claimData.adjustedAmount || '');
  setCol('PAID AMOUNT', claimData.paidAmount || '');
  setCol('DATE CHECK CUT', claimData.dateCheckCut || '');
  setCol('SVN#', claimData.svnNum || '');
  setCol('COMPANY COST', companyCost || claimData.companyCost || '');
  setCol('PROFIT AMOUNT', claimData.profitAmount || profitAmount || '');
  setCol('LOSS AMOUNT', claimData.lossAmount || lossAmount || '');
  setCol('NOTES', notes);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, numCols).setValues([newRow]);

  return lastRow + 1;
}

// ============================================================================
// 26. HELPER: Parse time strings like "3hrs 30min", "2 hours", "45 minutes"
// ============================================================================
function parseTimeToHours(timeStr) {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  const str = timeStr.toString().toLowerCase();

  let hours = 0;
  let minutes = 0;

  // Match hours
  const hrMatch = str.match(/(\d+\.?\d*)\s*(?:hrs?|hours?)/);
  if (hrMatch) hours = parseFloat(hrMatch[1]);

  // Match minutes
  const minMatch = str.match(/(\d+\.?\d*)\s*(?:min(?:utes?)?)/);
  if (minMatch) minutes = parseFloat(minMatch[1]);

  // If nothing matched, try to parse as number
  if (hours === 0 && minutes === 0) {
    const num = parseFloat(str);
    if (!isNaN(num)) hours = num;
  }

  return hours + (minutes / 60);
}

// ============================================================================
// 27. HELPER: Parse dollar amounts like "$1,280.00" to number
// ============================================================================
function parseDollarAmount(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(val.toString().replace(/[$,]/g, '')) || 0;
}

// ============================================================================
// 28. WRITE: UPDATE JOB LOG IN JOB CALCULATION SHEET
// ============================================================================
function addToJobLog(jobData) {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'Job_Log');
  const cost = calculateTrueCost(
    jobData.tech,
    jobData.onsiteHrs || 0,
    jobData.travelHrs || 0,
    jobData.miles || 0,
    jobData.partsCost || 0,
    jobData.consumables || 0
  );
  const profit = (jobData.revenue || 0) - cost.trueCost;
  const margin = jobData.revenue > 0 ? profit / jobData.revenue : 0;

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, 11).setValues([[
    jobData.priority || 'Medium',
    jobData.jobId || '',
    jobData.customer || '',
    jobData.tech || '',
    jobData.onsiteHrs || 0,
    jobData.miles || 0,
    jobData.partsCost || 0,
    jobData.revenue || 0,
    cost.trueCost,
    profit,
    margin,
  ]]);
  return { row: lastRow + 1, cost: cost, profit: profit, margin: margin };
}

// ============================================================================
// 29. MASTER: ADD JOB EVERYWHERE — with materials & warranty detail
// ============================================================================
function addJobEverywhere(jobData) {
  const results = {};

  // 1. Add to Route Optimization
  results.routeRow = addJobToRouteOpt(jobData);
  Logger.log('Added to Route Optimization: row ' + results.routeRow);

  // 2. Add to Generac Job True Cost
  results.trueCost = addJobToTrueCost(jobData);
  Logger.log('Added to True Cost: ' + results.trueCost.accept + ' (profit: $' + results.trueCost.profit.toFixed(2) + ')');

  // 3. Add to Job Log
  results.jobLog = addToJobLog(jobData);
  Logger.log('Added to Job Log: row ' + results.jobLog.row);

  // 4. If warranty job, add detailed warranty claim
  if (jobData.type === 'Warranty' || jobData.type === 'Both') {
    results.warrantyRow = addWarrantyClaim({
      status: jobData.warrantyStatus || 'Submitted',
      customerName: jobData.customer,
      dateOfJob: jobData.date || new Date(),
      caseNum: jobData.warrantyCaseNum || '',
      techName: jobData.tech,
      allottedTravel: jobData.allottedTravel || '',
      actualTravelTime: jobData.travelHrs ? jobData.travelHrs + ' hrs' : '',
      distanceMileage: jobData.distanceMileage || '',
      actualMileage: jobData.miles ? jobData.miles + ' miles' : '',
      allottedTechTime: jobData.allottedTechTime || '',
      actualTechTime: jobData.onsiteHrs ? jobData.onsiteHrs + ' hrs' : '',
      allottedAmount: jobData.allottedAmount || '',
      adjustedAmount: jobData.adjustedAmount || jobData.revenue || 0,
      paidAmount: jobData.paidAmount || '',
      dateCheckCut: jobData.dateCheckCut || '',
      svnNum: jobData.svnNum || '',
      companyCost: jobData.companyCost || '',
      profitAmount: jobData.profitAmount || '',
      lossAmount: jobData.lossAmount || '',
      notes: jobData.notes || '',
      // Extended fields
      materials: jobData.materials || '',
      rmaNumber: jobData.rmaNumber || '',
      rmaStatus: jobData.rmaStatus || '',
      goBackReason: jobData.goBackReason || '',
      goBackDate: jobData.goBackDate || '',
      partsOrdered: jobData.partsOrdered || '',
      partsETA: jobData.partsETA || '',
      month: jobData.warrantyMonth || '',
    });
    Logger.log('Added warranty claim: row ' + results.warrantyRow);
  }

  return results;
}

// ============================================================================
// 30. DAILY REPORT: Enhanced with detailed warranty analytics
// ============================================================================
function generateDailyReport() {
  const routeJobs = getRouteJobs();
  const claims = getAllWarrantyClaims();
  const overhead = getMonthlyOverhead();
  const personnel = getPersonnel();

  // Job pipeline stats
  const needsScheduling = routeJobs.filter(function(j) {
    return j.tags && j.tags.toString().includes('Needs S');
  }).length;
  const scheduled = routeJobs.filter(function(j) {
    return j.tags && j.tags.toString().includes('Scheduled');
  }).length;
  const unassigned = routeJobs.filter(function(j) {
    return !j.tech && j.tags && j.tags.toString().includes('Scheduled');
  }).length;
  const highPriUnassigned = routeJobs.filter(function(j) {
    return j.priority === 'High' && !j.tech;
  }).length;

  // Warranty stats — much more detailed
  const unpaidClaims = claims.filter(function(c) {
    return c.status && c.status.toString().includes('Completed not paid');
  });
  const submittedClaims = claims.filter(function(c) {
    return c.status && c.status.toString().includes('Submitted');
  });
  const waitingRMA = claims.filter(function(c) {
    return c.status && c.status.toString().toLowerCase().includes('waiting rma');
  });
  const waitingGoBack = claims.filter(function(c) {
    return c.status && c.status.toString().toLowerCase().includes('waiting go back');
  });
  const needsAttention = claims.filter(function(c) {
    return c.status && c.status.toString().toLowerCase().includes('needs att');
  });
  const partsOrdered = claims.filter(function(c) {
    return c.status && c.status.toString().toLowerCase().includes('parts ordered');
  });
  const paidClaims = claims.filter(function(c) {
    return c.status && c.status.toString().toLowerCase() === 'paid';
  });

  // Stale claims
  const today = new Date();
  const staleClaims = claims.filter(function(c) {
    if (!c.status) return false;
    const s = c.status.toString().toLowerCase();
    if (s === 'paid') return false;
    if (!c.dateOfJob) return false;
    const jobDate = new Date(c.dateOfJob);
    if (isNaN(jobDate.getTime())) return false;
    return (today - jobDate) / (1000 * 60 * 60 * 24) > 30;
  });

  // Financial totals
  let totalAllotted = 0;
  let totalPaid = 0;
  let totalCompanyCost = 0;
  let outstandingRevenue = 0;
  claims.forEach(function(c) {
    totalAllotted += parseDollarAmount(c.allottedAmount);
    totalPaid += parseDollarAmount(c.paidAmount);
    totalCompanyCost += parseDollarAmount(c.companyCost);
    if (c.status && !c.status.toString().toLowerCase().includes('paid')) {
      outstandingRevenue += parseDollarAmount(c.adjustedAmount) || parseDollarAmount(c.allottedAmount);
    }
  });

  // Route revenue
  let totalRouteRevenue = 0;
  routeJobs.forEach(function(j) { totalRouteRevenue += (j.revenue || 0); });

  const breakeven = overhead / (CONFIG.JOBS_PER_WEEK * CONFIG.WEEKS_PER_YEAR / 12);

  const report = {
    date: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    financials: {
      monthlyRunRate: overhead,
      annualRunRate: overhead * 12,
      costPerHour: overhead / CONFIG.HOURS_PER_MONTH,
      breakEvenPerJob: breakeven,
      totalPipelineRevenue: totalRouteRevenue,
    },
    pipeline: {
      totalJobs: routeJobs.length,
      needsScheduling: needsScheduling,
      scheduled: scheduled,
      unassigned: unassigned,
      highPriorityUnassigned: highPriUnassigned,
    },
    warranty: {
      totalClaims: claims.length,
      paid: paidClaims.length,
      unpaid: unpaidClaims.length,
      submitted: submittedClaims.length,
      waitingRMA: waitingRMA.length,
      waitingGoBack: waitingGoBack.length,
      needsAttention: needsAttention.length,
      partsOrdered: partsOrdered.length,
      staleCount: staleClaims.length,
      financials: {
        totalAllotted: totalAllotted,
        totalPaid: totalPaid,
        totalCompanyCost: totalCompanyCost,
        outstandingRevenue: outstandingRevenue,
      },
      staleClaims: staleClaims.map(function(c) {
        return {
          customer: c.customerName,
          date: c.dateOfJob,
          caseNum: c.caseNum,
          tech: c.techName,
          status: c.status,
          allotted: c.allottedAmount,
          adjusted: c.adjustedAmount,
          month: c.month,
        };
      }),
      waitingRMAClaims: waitingRMA.map(function(c) {
        return {
          customer: c.customerName,
          caseNum: c.caseNum,
          tech: c.techName,
          date: c.dateOfJob,
          notes: c.notes,
          month: c.month,
        };
      }),
      waitingGoBackClaims: waitingGoBack.map(function(c) {
        return {
          customer: c.customerName,
          caseNum: c.caseNum,
          tech: c.techName,
          date: c.dateOfJob,
          notes: c.notes,
          month: c.month,
        };
      }),
    },
    actionItems: [],
  };

  // Generate action items
  if (staleClaims.length > 0) {
    staleClaims.forEach(function(c) {
      report.actionItems.push('Follow up on ' + c.customerName + ' warranty claim (Case ' + c.caseNum + ') from ' + c.dateOfJob + ' — still ' + c.status);
    });
  }
  if (waitingRMA.length > 0) {
    report.actionItems.push('Check on ' + waitingRMA.length + ' warranty claims waiting for RMA');
  }
  if (waitingGoBack.length > 0) {
    report.actionItems.push('Schedule ' + waitingGoBack.length + ' warranty go-back visits');
  }
  if (needsAttention.length > 0) {
    report.actionItems.push('Review ' + needsAttention.length + ' warranty claims flagged as Needs Attention');
  }
  if (highPriUnassigned > 0) {
    report.actionItems.push('Assign tech to ' + highPriUnassigned + ' high-priority jobs with no tech assigned');
  }
  if (needsScheduling > 0) {
    report.actionItems.push('Schedule ' + needsScheduling + ' jobs currently in "Needs Scheduling" status');
  }

  Logger.log('=== AKINO SOLAR DAILY BRIEFING ===');
  Logger.log(report.date);
  Logger.log('Monthly Run-Rate: $' + report.financials.monthlyRunRate.toFixed(2));
  Logger.log('Breakeven/Job: $' + report.financials.breakEvenPerJob.toFixed(2));
  Logger.log('Jobs needing scheduling: ' + report.pipeline.needsScheduling);
  Logger.log('Total warranty claims: ' + report.warranty.totalClaims);
  Logger.log('Unpaid claims: ' + report.warranty.unpaid);
  Logger.log('Waiting RMA: ' + report.warranty.waitingRMA);
  Logger.log('Waiting Go Back: ' + report.warranty.waitingGoBack);
  Logger.log('Stale claims (30+ days): ' + report.warranty.staleCount);
  Logger.log('Action items: ' + report.actionItems.length);
  report.actionItems.forEach(function(item, i) { Logger.log((i+1) + '. ' + item); });

  return report;
}

// ============================================================================
// 31. SYNC: Update P&L Report from Route Jobs
// ============================================================================
function syncProfitLossReport() {
  const routeJobs = getRouteJobs();
  const pnlSheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Profit_Loss_Report');

  const lastRow = pnlSheet.getLastRow();
  if (lastRow > 1) {
    pnlSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }

  const rows = [];
  routeJobs.forEach(function(job) {
    const techName = job.tech ? job.tech.toString().split(' ')[0] : 'Generic Tech';
    const estimatedHrs = 2;
    const estimatedTravelHrs = 2;
    const miles = 200;

    const cost = calculateTrueCost(techName, estimatedHrs, estimatedTravelHrs, miles, 0, 0);
    const revenue = job.revenue || 0;
    const profit = revenue - cost.trueCost;
    const verdict = profit >= 0 ? '\u2713' : '\u2717';

    rows.push([job.jobId || '', techName, revenue, cost.trueCost, profit, verdict]);
  });

  if (rows.length > 0) {
    pnlSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  Logger.log('Synced P&L Report: ' + rows.length + ' jobs');
  return rows.length;
}

// ============================================================================
// 32. SYNC: Update Break-Even Scenarios from current overhead
// ============================================================================
function syncBreakEven() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'BreakEven_Scenario');
  const overhead = getMonthlyOverhead();

  const rows = [];
  for (var jpw = 1; jpw <= 10; jpw++) {
    var jpm = jpw * CONFIG.WEEKS_PER_YEAR / 12;
    var overheadPerJob = overhead / jpm;
    var breakeven = overheadPerJob + CONFIG.RISK_BUFFER;
    var costPerHour = overhead / CONFIG.HOURS_PER_MONTH;
    rows.push([jpw, jpm, overhead, overheadPerJob, breakeven, costPerHour]);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);

  Logger.log('Synced Break-Even: overhead = $' + overhead.toFixed(2));
  return overhead;
}

// ============================================================================
// 33. FULL SYNC: Run everything
// ============================================================================
function fullSync() {
  Logger.log('=== STARTING FULL SYNC ===');
  syncProfitLossReport();
  syncBreakEven();
  var report = generateDailyReport();
  Logger.log('=== FULL SYNC COMPLETE ===');
  return report;
}

// ============================================================================
// 34. TRIGGERS: Set up daily auto-run
// ============================================================================
function setupDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'fullSync') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('fullSync')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log('Daily trigger set for 7 AM');
}

// ============================================================================
// 35. CUSTOM MENU
// ============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Akino Solar')
    .addItem('Add Job (All Sheets)', 'showAddJobDialog')
    .addItem('Generate Daily Report', 'generateDailyReport')
    .addItem('Sync P&L Report', 'syncProfitLossReport')
    .addItem('Sync Break-Even', 'syncBreakEven')
    .addItem('Full Sync', 'fullSync')
    .addSeparator()
    .addItem('Warranty Summary', 'showWarrantySummary')
    .addItem('Setup Daily Trigger', 'setupDailyTrigger')
    .addToUi();
}

// ============================================================================
// 36. DIALOG: Add job via popup form (enhanced with warranty/materials)
// ============================================================================
function showAddJobDialog() {
  var html = HtmlService.createHtmlOutput('<style>body{font-family:Arial,sans-serif;padding:16px}label{display:block;font-size:12px;font-weight:bold;margin-top:8px;color:#374151}input,select,textarea{width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:2px;font-size:13px;box-sizing:border-box}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.btn{padding:10px 24px;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;margin-top:16px}.btn-primary{background:#2563EB;color:white}.btn-primary:hover{background:#1d4ed8}#result{margin-top:12px;padding:10px;border-radius:6px;display:none}h4{margin:16px 0 4px;color:#1F4E79;border-bottom:1px solid #e5e7eb;padding-bottom:4px}</style><h3 style="color:#1F4E79;margin:0">Add Job to All Sheets</h3><div class="grid"><div><label>Customer</label><input id="customer" placeholder="Customer name"></div><div><label>Job ID</label><input id="jobId" placeholder="e.g. 597"></div><div><label>Tech</label><select id="tech"><option>Sam</option><option>Lucas</option><option>Spencer</option><option>Caden</option><option>Lex</option><option>Katie</option><option>Andrew</option></select></div><div><label>Type</label><select id="type" onchange="toggleWarranty()"><option>Service</option><option>Warranty</option><option>Both</option></select></div><div><label>Onsite Hours</label><input id="onsite" type="number" value="2" step="0.5"></div><div><label>Travel Hours</label><input id="travel" type="number" value="2" step="0.5"></div><div><label>Miles</label><input id="miles" type="number" value="200"></div><div><label>Parts $</label><input id="parts" type="number" value="0"></div><div><label>Revenue $</label><input id="revenue" type="number" value="0"></div><div><label>Priority</label><select id="priority"><option>Medium</option><option>High</option><option>Low</option></select></div><div><label>City</label><input id="city"></div><div><label>State</label><input id="state" value="TN" maxlength="2"></div></div><div id="warrantySection" style="display:none"><h4>Warranty Details</h4><div class="grid"><div><label>Case #</label><input id="caseNum"></div><div><label>Warranty Status</label><select id="warrantyStatus"><option>Submitted</option><option>Waiting RMA</option><option>Waiting Go Back</option><option>Parts Ordered</option><option>Scheduled</option><option>Needs Attention</option></select></div><div><label>Allotted Amount $</label><input id="allottedAmt" type="number" value="0"></div><div><label>RMA Number</label><input id="rmaNumber" placeholder="If applicable"></div></div><label>Materials Used</label><textarea id="materials" rows="2" placeholder="List parts/materials used"></textarea><label>Notes</label><textarea id="jobNotes" rows="2" placeholder="Additional notes, go-back info, etc."></textarea></div><button class="btn btn-primary" onclick="submitJob()">Add Job to All Sheets</button><div id="result"></div><script>function toggleWarranty(){var t=document.getElementById("type").value;document.getElementById("warrantySection").style.display=(t==="Warranty"||t==="Both")?"block":"none"}function submitJob(){var data={customer:document.getElementById("customer").value,jobId:document.getElementById("jobId").value,tech:document.getElementById("tech").value,type:document.getElementById("type").value,onsiteHrs:+document.getElementById("onsite").value,travelHrs:+document.getElementById("travel").value,miles:+document.getElementById("miles").value,partsCost:+document.getElementById("parts").value,revenue:+document.getElementById("revenue").value,priority:document.getElementById("priority").value,city:document.getElementById("city").value,state:document.getElementById("state").value,date:new Date().toISOString().split("T")[0],warrantyCaseNum:document.getElementById("caseNum").value,warrantyStatus:document.getElementById("warrantyStatus").value,allottedAmount:+document.getElementById("allottedAmt").value,rmaNumber:document.getElementById("rmaNumber").value,materials:document.getElementById("materials").value,notes:document.getElementById("jobNotes").value};google.script.run.withSuccessHandler(function(r){var el=document.getElementById("result");el.style.display="block";el.style.background=r.trueCost.accept==="YES"?"#dcfce7":"#fee2e2";el.style.color=r.trueCost.accept==="YES"?"#166534":"#991b1b";el.innerHTML="<strong>"+r.trueCost.accept+"</strong> — Profit: $"+r.trueCost.profit.toFixed(2)+" | Added to all sheets"}).addJobEverywhere(data)}</script>').setWidth(520).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Job');
}

// ============================================================================
// 37. DIALOG: Show warranty summary popup
// ============================================================================
function showWarrantySummary() {
  var summary = getWarrantySummary();
  var html = '<style>body{font-family:Arial;padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px}th{background:#1F4E79;color:white}.green{color:#166534}.red{color:#991b1b}</style>';
  html += '<h3 style="color:#1F4E79">Warranty Summary</h3>';
  html += '<p>Total Claims: <strong>' + summary.totalClaims + '</strong></p>';
  html += '<table><tr><th>Status</th><th>Count</th></tr>';
  for (var status in summary.byStatus) {
    html += '<tr><td>' + status + '</td><td>' + summary.byStatus[status] + '</td></tr>';
  }
  html += '</table>';
  html += '<h4 style="color:#1F4E79;margin-top:12px">Financials</h4>';
  html += '<p>Total Allotted: <strong>$' + summary.totals.allottedAmount.toFixed(2) + '</strong></p>';
  html += '<p>Total Paid: <strong>$' + summary.totals.paidAmount.toFixed(2) + '</strong></p>';
  html += '<p>Company Cost: <strong class="red">$' + summary.totals.companyCost.toFixed(2) + '</strong></p>';
  html += '<p>Net Profit: <strong class="green">$' + summary.totals.profitAmount.toFixed(2) + '</strong></p>';

  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(400).setHeight(500),
    'Warranty Summary'
  );
}

// ============================================================================
// 38. TEST: Quick test function
// ============================================================================
function testAddJob() {
  var result = addJobEverywhere({
    jobId: 'TEST-001',
    customer: 'Test Customer',
    tech: 'Sam',
    type: 'Warranty',
    onsiteHrs: 2,
    travelHrs: 1.5,
    miles: 150,
    partsCost: 50,
    revenue: 3000,
    priority: 'Medium',
    city: 'Knoxville',
    state: 'TN',
    date: new Date(),
    warrantyCaseNum: 'TEST-CASE-001',
    warrantyStatus: 'Submitted',
    materials: 'Inverter board, fuse kit',
    rmaNumber: 'RMA-12345',
  });
  Logger.log(JSON.stringify(result));
}

// ============================================================================
// 39. UTILITY: Get full business snapshot (JSON)
// ============================================================================
function getBusinessSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    personnel: getPersonnel(),
    overhead: getMonthlyOverhead(),
    assumptions: getAssumptions(),
    liabilities: getLiabilities(),
    routeJobs: getRouteJobs(),
    routeSummary: getRouteSummary(),
    routePnL: getRoutePnL(),
    warrantyClaims: getAllWarrantyClaims(),
    warrantySummary: getWarrantySummary(),
    jobCosting: getJobCostingData(),
    breakEven: getBreakEvenScenarios(),
    settings: getRouteSettings(),
  };
}

// ============================================================================
// 40. WEB APP: doGet — Claude Code READ access
// curl "YOUR_URL?action=snapshot"
// ============================================================================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'snapshot';
  var result;

  try {
    switch (action) {
      case 'snapshot':
        result = getBusinessSnapshot();
        break;
      case 'jobs':
        result = getRouteJobs();
        break;
      case 'personnel':
        result = getPersonnel();
        break;
      case 'overhead':
        result = { monthlyOverhead: getMonthlyOverhead() };
        break;
      case 'warranty':
        result = getAllWarrantyClaims();
        break;
      case 'warranty_by_month':
        var month = e.parameter.month || '';
        result = getWarrantyByMonth(month);
        break;
      case 'warranty_by_status':
        var status = e.parameter.status || '';
        result = getWarrantyByStatus(status);
        break;
      case 'warranty_summary':
        result = getWarrantySummary();
        break;
      case 'warranty_tabs':
        result = getWarrantyTabNames();
        break;
      case 'waiting_rma':
        result = getWaitingRMA();
        break;
      case 'waiting_goback':
        result = getWaitingGoBack();
        break;
      case 'stale_warranty':
        var days = e.parameter.days ? parseInt(e.parameter.days) : 30;
        result = getStaleWarrantyClaims(days);
        break;
      case 'costing':
        result = getJobCostingData();
        break;
      case 'routes':
        result = getRouteSummary();
        break;
      case 'route_pnl':
        result = getRoutePnL();
        break;
      case 'breakeven':
        result = getBreakEvenScenarios();
        break;
      case 'assumptions':
        result = getAssumptions();
        break;
      case 'liabilities':
        result = getLiabilities();
        break;
      case 'settings':
        result = getRouteSettings();
        break;
      case 'daily_report':
        result = generateDailyReport();
        break;
      case 'calculate_cost':
        result = calculateTrueCost(
          e.parameter.tech || 'Sam',
          parseFloat(e.parameter.onsite_hrs || 2),
          parseFloat(e.parameter.travel_hrs || 2),
          parseFloat(e.parameter.miles || 200),
          parseFloat(e.parameter.parts || 0),
          parseFloat(e.parameter.consumables || 0)
        );
        break;
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString(), version: '2.0', message: 'Akino Solar API is live' };
        break;
      default:
        result = { error: 'Unknown action: ' + action, available: [
          'snapshot', 'jobs', 'personnel', 'overhead',
          'warranty', 'warranty_by_month', 'warranty_by_status', 'warranty_summary',
          'warranty_tabs', 'waiting_rma', 'waiting_goback', 'stale_warranty',
          'costing', 'routes', 'route_pnl', 'breakeven',
          'assumptions', 'liabilities', 'settings',
          'daily_report', 'calculate_cost', 'ping'
        ]};
    }
  } catch (err) {
    result = { error: err.toString(), action: action };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 41. WEB APP: doPost — Claude Code WRITE access
// curl -X POST "YOUR_URL" -d '{"action":"add_job","data":{...}}'
// ============================================================================
function doPost(e) {
  var result;

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data = body.data;

    switch (action) {
      case 'add_job':
        result = addJobEverywhere(data);
        result.success = true;
        result.message = 'Job added to all sheets';
        break;

      case 'add_job_route':
        var routeRow = addJobToRouteOpt(data);
        result = { success: true, row: routeRow, sheet: 'Route Optimization' };
        break;

      case 'add_job_costing':
        result = addJobToTrueCost(data);
        result.success = true;
        result.sheet = 'Job True Cost';
        break;

      case 'add_warranty':
        var wRow = addWarrantyClaim(data);
        result = { success: true, row: wRow, sheet: 'Warranty Claims' };
        break;

      case 'add_job_log':
        result = addToJobLog(data);
        result.success = true;
        result.sheet = 'Job Log';
        break;

      case 'update_warranty_status':
        result = updateWarrantyStatus(data.month, data.row, data.status, data.notes);
        break;

      case 'update_warranty_financials':
        result = updateWarrantyFinancials(data.month, data.row, data.financials || data);
        break;

      case 'sync':
        result = fullSync();
        result.success = true;
        result.message = 'Full sync complete';
        break;

      case 'sync_pnl':
        var count = syncProfitLossReport();
        result = { success: true, jobsSynced: count, message: 'P&L synced' };
        break;

      case 'sync_breakeven':
        var oh = syncBreakEven();
        result = { success: true, overhead: oh, message: 'Break-even synced' };
        break;

      default:
        result = { error: 'Unknown POST action: ' + action, available: [
          'add_job', 'add_job_route', 'add_job_costing',
          'add_warranty', 'add_job_log',
          'update_warranty_status', 'update_warranty_financials',
          'sync', 'sync_pnl', 'sync_breakeven'
        ]};
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
