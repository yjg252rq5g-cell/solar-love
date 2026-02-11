// ============================================================================
// AKINO SOLAR — MASTER GOOGLE APPS SCRIPT
// Connects all 5 source sheets into one automated system
// ============================================================================
// SHEET IDs (your actual Google Sheets):
const SHEET_IDS = {
  JOB_CALC: '1yL-M-YJqbS5smTqxiJPJrUcW_fz0JF-IX4kkHYV_svE',       // Job Calculation for Profit and Loss
  ROUTE_OPT: '1SxmUhIBU2tUXX7eoH1wWGP6A2bcJstx_K5NrPRWGy1E',      // Main Route Optimization
  JOB_TRUE_COST: '1cJvAFLZDGNzVxNNCgL6P7snG0MXwb0FB3WoqtTnK-b4',   // Copy of Generac Job True Cost
  WARRANTY: '1hxIz6Qr7bgrHp559MRfUZ9ljkPsTlo1AfVj2K1ITEbc',         // Copy of $ Generac Service Warranty Claims
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
};

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
  // Find the Total_Monthly_All row
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'Total_Monthly_All' || data[i][0] === 'TOTAL') {
      return data[i][1];
    }
  }
  // Fallback: sum column B
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
  const headers = data[0];
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
  const headers = data[0];
  const jobs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] || data[i][2]) { // has Job# or Customer
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
// 9. READ WARRANTY CLAIMS (ALL MONTHS)
// ============================================================================
function getAllWarrantyClaims() {
  const ss = getWarrantySS();
  const sheets = ss.getSheets();
  const allClaims = [];

  sheets.forEach(sheet => {
    const name = sheet.getName(); // e.g. "January 2026", "December 2025"
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1]) { // has customer name
        allClaims.push({
          month: name,
          status: data[i][0],
          customerName: data[i][1],
          dateOfJob: data[i][2],
          caseNum: data[i][3],
          techName: data[i][4],
          allottedTravel: data[i][5],
          actualTravelTime: data[i][6],
          distanceMileage: data[i][7],
          actualMileage: data[i][8],
          allottedTechTime: data[i][9],
          actualTechTime: data[i][10],
          allottedAmount: data[i][11],
          adjustedAmount: data[i][12],
          paidAmount: data[i][13],
          dateCheckCut: data[i][14],
          svnNum: data[i][15],
          sourceSheet: name,
          row: i + 1,
        });
      }
    }
  });
  return allClaims;
}

// ============================================================================
// 10. READ GENERAC JOB TRUE COST (job costing sheet)
// ============================================================================
function getJobCostingData() {
  const sheet = getSheet(SHEET_IDS.JOB_TRUE_COST, 'job costing');
  const data = sheet.getDataRange().getValues();
  const jobs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2]) { // has tech
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
// 11. READ BREAK-EVEN SCENARIOS
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
// 12. READ ASSUMPTIONS
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
// 13. READ LIABILITIES
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
// 14. WRITE: ADD NEW JOB TO ROUTE OPTIMIZATION (Jobs tab)
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
// 15. WRITE: ADD JOB TO TRUE COST SHEET (job costing tab)
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
  return { row: lastRow + 1, cost, profit, accept };
}

// ============================================================================
// 16. WRITE: ADD WARRANTY CLAIM TO CURRENT MONTH TAB
// ============================================================================
function addWarrantyClaim(claimData) {
  const ss = getWarrantySS();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const tabName = monthNames[now.getMonth()] + ' ' + now.getFullYear();

  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.getRange(1, 1, 1, 16).setValues([[
      'STATUS:', 'CUSTOMER NAME:', 'DATE OF JOB:', 'CASE#', 'TECH NAME:',
      'ALLOTTED TRAVEL:', 'ACTUAL TRAVEL TIME:', 'DISTANCE MILEAGE:',
      'ACTUAL MILEAGE:', 'ALLOTTED TECH TIME:', 'ACTUAL TECH TIME:',
      'ALLOTTED AMOUNT:', 'ADJUSTED AMOUNT:', 'PAID AMOUNT:', 'DATE CHECK CUT:', 'SVN#:'
    ]]);
    sheet.getRange(1, 1, 1, 16).setFontWeight('bold');
  }

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, 16).setValues([[
    claimData.status || 'Submitted',
    claimData.customerName || '',
    claimData.dateOfJob || new Date(),
    claimData.caseNum || '',
    claimData.techName || '',
    claimData.allottedTravel || '',
    claimData.actualTravelTime || '',
    claimData.distanceMileage || '',
    claimData.actualMileage || '',
    claimData.allottedTechTime || '',
    claimData.actualTechTime || '',
    claimData.allottedAmount || '',
    claimData.adjustedAmount || '',
    claimData.paidAmount || '',
    claimData.dateCheckCut || '',
    claimData.svnNum || '',
  ]]);
  return lastRow + 1;
}

// ============================================================================
// 17. WRITE: UPDATE JOB LOG IN JOB CALCULATION SHEET
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
  return { row: lastRow + 1, cost, profit, margin };
}

// ============================================================================
// 18. MASTER: ADD JOB EVERYWHERE (single entry point)
// This is what you call daily — enters the job in ALL sheets at once
// ============================================================================
function addJobEverywhere(jobData) {
  const results = {};

  // 1. Add to Route Optimization (Jobs tab)
  results.routeRow = addJobToRouteOpt(jobData);
  Logger.log('Added to Route Optimization: row ' + results.routeRow);

  // 2. Add to Generac Job True Cost
  results.trueCost = addJobToTrueCost(jobData);
  Logger.log('Added to True Cost: ' + results.trueCost.accept + ' (profit: $' + results.trueCost.profit.toFixed(2) + ')');

  // 3. Add to Job Log in Job Calculation sheet
  results.jobLog = addToJobLog(jobData);
  Logger.log('Added to Job Log: row ' + results.jobLog.row);

  // 4. If it's a warranty job, add warranty claim
  if (jobData.type === 'Warranty' || jobData.type === 'Both') {
    results.warrantyRow = addWarrantyClaim({
      status: jobData.warrantyStatus || 'Submitted',
      customerName: jobData.customer,
      dateOfJob: jobData.date || new Date(),
      caseNum: jobData.warrantyCaseNum || '',
      techName: jobData.tech,
      allottedTravel: jobData.allottedTravel || '',
      actualTravelTime: jobData.travelHrs + ' hrs',
      distanceMileage: jobData.miles + ' miles',
      allottedTechTime: jobData.allottedTechTime || '',
      actualTechTime: jobData.onsiteHrs + ' hrs',
      adjustedAmount: jobData.adjustedAmount || jobData.revenue || 0,
    });
    Logger.log('Added warranty claim: row ' + results.warrantyRow);
  }

  return results;
}

// ============================================================================
// 19. DAILY REPORT: Generate morning briefing
// ============================================================================
function generateDailyReport() {
  const routeJobs = getRouteJobs();
  const claims = getAllWarrantyClaims();
  const overhead = getMonthlyOverhead();
  const personnel = getPersonnel();

  // Count job statuses
  const needsScheduling = routeJobs.filter(j =>
    j.tags && j.tags.toString().includes('Needs S')
  ).length;
  const scheduled = routeJobs.filter(j =>
    j.tags && j.tags.toString().includes('Scheduled')
  ).length;
  const unassigned = routeJobs.filter(j =>
    !j.tech && j.tags && j.tags.toString().includes('Scheduled')
  ).length;
  const highPriUnassigned = routeJobs.filter(j =>
    j.priority === 'High' && !j.tech
  ).length;

  // Warranty stats
  const unpaidClaims = claims.filter(c =>
    c.status && c.status.toString().includes('Completed not paid')
  );
  const submittedClaims = claims.filter(c =>
    c.status && c.status.toString().includes('Submitted')
  );

  // Stale claims (30+ days)
  const today = new Date();
  const staleClaims = unpaidClaims.filter(c => {
    if (!c.dateOfJob) return false;
    const jobDate = new Date(c.dateOfJob);
    const diffDays = (today - jobDate) / (1000 * 60 * 60 * 24);
    return diffDays > 30;
  });

  // Revenue from route P&L
  let totalRevenue = 0;
  routeJobs.forEach(j => { totalRevenue += (j.revenue || 0); });

  const breakeven = overhead / (CONFIG.JOBS_PER_WEEK * CONFIG.WEEKS_PER_YEAR / 12);

  const report = {
    date: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    financials: {
      monthlyRunRate: overhead,
      annualRunRate: overhead * 12,
      costPerHour: overhead / CONFIG.HOURS_PER_MONTH,
      breakEvenPerJob: breakeven,
      totalPipelineRevenue: totalRevenue,
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
      unpaid: unpaidClaims.length,
      submitted: submittedClaims.length,
      staleClaims: staleClaims.map(c => ({
        customer: c.customerName,
        date: c.dateOfJob,
        caseNum: c.caseNum,
        amount: c.adjustedAmount,
        month: c.month,
      })),
    },
    actionItems: [],
  };

  // Generate action items
  if (staleClaims.length > 0) {
    staleClaims.forEach(c => {
      report.actionItems.push('Follow up on ' + c.customerName + ' warranty claim (Case ' + c.caseNum + ') from ' + c.dateOfJob + ' - still unpaid');
    });
  }
  if (highPriUnassigned > 0) {
    report.actionItems.push('Assign tech to ' + highPriUnassigned + ' high-priority jobs that have no tech assigned');
  }
  if (needsScheduling > 0) {
    report.actionItems.push('Schedule ' + needsScheduling + ' jobs currently in "Needs Scheduling" status');
  }

  // Log report
  Logger.log('=== AKINO SOLAR DAILY BRIEFING ===');
  Logger.log(report.date);
  Logger.log('Monthly Run-Rate: $' + report.financials.monthlyRunRate.toFixed(2));
  Logger.log('Breakeven/Job: $' + report.financials.breakEvenPerJob.toFixed(2));
  Logger.log('Jobs needing scheduling: ' + report.pipeline.needsScheduling);
  Logger.log('Unpaid warranty claims: ' + report.warranty.unpaid);
  Logger.log('Stale claims (30+ days): ' + report.warranty.staleClaims.length);
  Logger.log('Action items: ' + report.actionItems.length);
  report.actionItems.forEach((item, i) => Logger.log((i+1) + '. ' + item));

  return report;
}

// ============================================================================
// 20. SYNC: Update P&L Report from Route Jobs
// Recalculates true cost for every job in Route Optimization
// ============================================================================
function syncProfitLossReport() {
  const routeJobs = getRouteJobs();
  const pnlSheet = getSheet(SHEET_IDS.ROUTE_OPT, 'Profit_Loss_Report');

  // Clear existing data (keep header)
  const lastRow = pnlSheet.getLastRow();
  if (lastRow > 1) {
    pnlSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }

  const rows = [];
  routeJobs.forEach(job => {
    const techName = job.tech ? job.tech.toString().split(' ')[0] : 'Generic Tech';
    // Estimate hours from route data
    const estimatedHrs = 2; // default onsite
    const estimatedTravelHrs = 2; // default travel
    const miles = 200; // default estimate

    const cost = calculateTrueCost(techName, estimatedHrs, estimatedTravelHrs, miles, 0, 0);
    const revenue = job.revenue || 0;
    const profit = revenue - cost.trueCost;
    const verdict = profit >= 0 ? 'ACCEPT' : 'REJECT';

    rows.push([job.jobId || '', techName, revenue, cost.trueCost, profit, verdict]);
  });

  if (rows.length > 0) {
    pnlSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  Logger.log('Synced P&L Report: ' + rows.length + ' jobs');
  return rows.length;
}

// ============================================================================
// 21. SYNC: Update Break-Even Scenarios from current overhead
// ============================================================================
function syncBreakEven() {
  const sheet = getSheet(SHEET_IDS.JOB_CALC, 'BreakEven_Scenario');
  const overhead = getMonthlyOverhead();

  const rows = [];
  for (let jpw = 1; jpw <= 10; jpw++) {
    const jpm = jpw * CONFIG.WEEKS_PER_YEAR / 12;
    const overheadPerJob = overhead / jpm;
    const breakeven = overheadPerJob + CONFIG.RISK_BUFFER;
    const costPerHour = overhead / CONFIG.HOURS_PER_MONTH;
    rows.push([jpw, jpm, overhead, overheadPerJob, breakeven, costPerHour]);
  }

  // Clear and write
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);

  Logger.log('Synced Break-Even: overhead = $' + overhead.toFixed(2));
  return overhead;
}

// ============================================================================
// 22. FULL SYNC: Run everything
// ============================================================================
function fullSync() {
  Logger.log('=== STARTING FULL SYNC ===');
  syncProfitLossReport();
  syncBreakEven();
  const report = generateDailyReport();
  Logger.log('=== FULL SYNC COMPLETE ===');
  return report;
}

// ============================================================================
// 23. TRIGGERS: Set up daily auto-run
// ============================================================================
function setupDailyTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'fullSync') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new daily trigger at 7 AM
  ScriptApp.newTrigger('fullSync')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log('Daily trigger set for 7 AM');
}

// ============================================================================
// 24. CUSTOM MENU (adds menu to any sheet this script is bound to)
// ============================================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Akino Solar')
    .addItem('Add Job (All Sheets)', 'showAddJobDialog')
    .addItem('Generate Daily Report', 'generateDailyReport')
    .addItem('Sync P&L Report', 'syncProfitLossReport')
    .addItem('Sync Break-Even', 'syncBreakEven')
    .addItem('Full Sync', 'fullSync')
    .addSeparator()
    .addItem('Setup Daily Trigger', 'setupDailyTrigger')
    .addToUi();
}

// ============================================================================
// 25. DIALOG: Add job via popup form
// ============================================================================
function showAddJobDialog() {
  const html = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial,sans-serif;padding:16px}' +
    'label{display:block;font-size:12px;font-weight:bold;margin-top:8px;color:#374151}' +
    'input,select{width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:2px;font-size:13px}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.btn{padding:10px 24px;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;margin-top:16px}' +
    '.btn-primary{background:#2563EB;color:white}' +
    '.btn-primary:hover{background:#1d4ed8}' +
    '#result{margin-top:12px;padding:10px;border-radius:6px;display:none}' +
    '</style>' +
    '<h3 style="color:#1F4E79;margin:0">Add Job to All Sheets</h3>' +
    '<div class="grid">' +
    '<div><label>Customer</label><input id="customer" placeholder="Customer name"></div>' +
    '<div><label>Job ID</label><input id="jobId" placeholder="e.g. 597"></div>' +
    '<div><label>Tech</label><select id="tech">' +
    '<option>Sam</option><option>Lucas</option><option>Spencer</option>' +
    '<option>Caden</option><option>Lex</option><option>Katie</option>' +
    '</select></div>' +
    '<div><label>Type</label><select id="type">' +
    '<option>Service</option><option>Warranty</option><option>Both</option>' +
    '</select></div>' +
    '<div><label>Onsite Hours</label><input id="onsite" type="number" value="2" step="0.5"></div>' +
    '<div><label>Travel Hours</label><input id="travel" type="number" value="2" step="0.5"></div>' +
    '<div><label>Miles</label><input id="miles" type="number" value="200"></div>' +
    '<div><label>Parts $</label><input id="parts" type="number" value="0"></div>' +
    '<div><label>Revenue $</label><input id="revenue" type="number" value="0"></div>' +
    '<div><label>Priority</label><select id="priority">' +
    '<option>Medium</option><option>High</option><option>Low</option>' +
    '</select></div>' +
    '<div><label>City</label><input id="city"></div>' +
    '<div><label>State</label><input id="state" value="TN" maxlength="2"></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="submitJob()">Add Job to All Sheets</button>' +
    '<div id="result"></div>' +
    '<script>' +
    'function submitJob(){' +
    'var data={' +
    'customer:document.getElementById("customer").value,' +
    'jobId:document.getElementById("jobId").value,' +
    'tech:document.getElementById("tech").value,' +
    'type:document.getElementById("type").value,' +
    'onsiteHrs:+document.getElementById("onsite").value,' +
    'travelHrs:+document.getElementById("travel").value,' +
    'miles:+document.getElementById("miles").value,' +
    'partsCost:+document.getElementById("parts").value,' +
    'revenue:+document.getElementById("revenue").value,' +
    'priority:document.getElementById("priority").value,' +
    'city:document.getElementById("city").value,' +
    'state:document.getElementById("state").value,' +
    'date:new Date().toISOString().split("T")[0]' +
    '};' +
    'google.script.run.withSuccessHandler(function(r){' +
    'var el=document.getElementById("result");' +
    'el.style.display="block";' +
    'el.style.background=r.trueCost.accept==="YES"?"#dcfce7":"#fee2e2";' +
    'el.style.color=r.trueCost.accept==="YES"?"#166534":"#991b1b";' +
    'el.innerHTML="<strong>"+r.trueCost.accept+"</strong> - Profit: $"+r.trueCost.profit.toFixed(2)+" | Added to all sheets";' +
    '}).addJobEverywhere(data);' +
    '}' +
    '</script>'
  ).setWidth(500).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Job');
}

// ============================================================================
// 26. TEST: Quick test function
// ============================================================================
function testAddJob() {
  const result = addJobEverywhere({
    jobId: 'TEST-001',
    customer: 'Test Customer',
    tech: 'Sam',
    type: 'Service',
    onsiteHrs: 2,
    travelHrs: 1.5,
    miles: 150,
    partsCost: 50,
    revenue: 3000,
    priority: 'Medium',
    city: 'Knoxville',
    state: 'TN',
    date: new Date(),
  });
  Logger.log(JSON.stringify(result));
}

// ============================================================================
// 27. UTILITY: Get full business snapshot (JSON)
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
    jobCosting: getJobCostingData(),
    breakEven: getBreakEvenScenarios(),
    settings: getRouteSettings(),
  };
}

// ============================================================================
// 28. WEB APP: doGet — lets Claude Code READ your sheets via URL
// Deploy as web app, then Claude Code can: curl "YOUR_URL?action=snapshot"
// ============================================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'snapshot';
  let result;

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
        result = { status: 'ok', timestamp: new Date().toISOString(), message: 'Akino Solar API is live' };
        break;
      default:
        result = { error: 'Unknown action: ' + action, available: [
          'snapshot', 'jobs', 'personnel', 'overhead', 'warranty',
          'stale_warranty', 'costing', 'routes', 'route_pnl',
          'breakeven', 'assumptions', 'liabilities', 'settings',
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
// 29. WEB APP: doPost — lets Claude Code WRITE to your sheets via URL
// Claude Code can: curl -X POST "YOUR_URL" -d '{"action":"add_job","data":{...}}'
// ============================================================================
function doPost(e) {
  let result;

  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;

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
          'add_warranty', 'add_job_log', 'sync', 'sync_pnl', 'sync_breakeven'
        ]};
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 30. HELPER: Get stale warranty claims (unpaid for X+ days)
// ============================================================================
function getStaleWarrantyClaims(days) {
  days = days || 30;
  const allClaims = getAllWarrantyClaims();
  const today = new Date();
  return allClaims.filter(c => {
    if (!c.status || !c.status.toString().includes('Completed not paid')) return false;
    if (!c.dateOfJob) return false;
    const jobDate = new Date(c.dateOfJob);
    const diffDays = (today - jobDate) / (1000 * 60 * 60 * 24);
    return diffDays > days;
  });
}
