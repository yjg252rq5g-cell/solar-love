// ==========================================================================
// RECONCILIATION MODULE - Automated Payment Matching
// ==========================================================================
// Matches HCP (payment processor) records against bank deposit records
// and links them back to Job_Log entries for full revenue traceability.
//
// Reconciliation sheet layout:
//   A: Recon ID (auto)    B: Job Row Ref   C: Job Name
//   D: HCP Amount         E: HCP Date      F: Bank Amount
//   G: Bank Date          H: Variance       I: Match Status
//   J: Matched Date       K: Notes

var RECON_HEADERS = [
  'Recon ID', 'Job Row', 'Job Name',
  'HCP Amount', 'HCP Date', 'Bank Amount',
  'Bank Date', 'Variance', 'Match Status',
  'Matched Date', 'Notes'
];

var MATCH_TOLERANCE = 0.01;

/** Ensures the Reconciliation sheet exists with proper headers */
function initReconSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var recon = ss.getSheetByName(RECON_SHEET);
  if (!recon) {
    recon = ss.insertSheet(RECON_SHEET);
    recon.appendRow(RECON_HEADERS);
    recon.getRange("1:1").setFontWeight("bold").setBackground("#1a237e").setFontColor("#ffffff");
    recon.setFrozenRows(1);
    recon.setColumnWidth(1, 80);
    recon.setColumnWidth(8, 100);
    recon.setColumnWidth(9, 120);
  }
  return recon;
}

/** Pulls unbilled jobs from Job_Log into the Reconciliation sheet as pending entries */
function importUnreconciledJobs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(JOB_LOG_SHEET);
  var recon = initReconSheet();

  if (!log) return logError("Import Failed: Job_Log tab missing.");

  var lastLogRow = log.getLastRow();
  if (lastLogRow < 3) return "No jobs to reconcile.";

  var jobData = log.getRange(3, 1, lastLogRow - 2, 17).getValues();
  var existingRefs = getExistingReconRefs(recon);
  var imported = 0;

  for (var i = 0; i < jobData.length; i++) {
    var revenue = jobData[i][11]; // Column L = Revenue
    var status = jobData[i][16];  // Column Q = Status
    var jobRow = i + 3;

    if (revenue > 0 && status !== "Paid" && existingRefs.indexOf(jobRow) === -1) {
      var reconId = 'R-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + jobRow;
      recon.appendRow([
        reconId,
        jobRow,
        jobData[i][3] || '',  // Job Name (column D)
        revenue,              // HCP Amount = expected revenue
        '',                   // HCP Date (filled on match)
        '',                   // Bank Amount (filled on match)
        '',                   // Bank Date (filled on match)
        '',                   // Variance (calculated)
        'Pending',            // Match Status
        '',                   // Matched Date
        ''                    // Notes
      ]);
      imported++;
    }
  }

  formatReconSheet(recon);
  return 'Imported ' + imported + ' unreconciled job(s) into Reconciliation.';
}

/** Returns array of Job Row references already in the Recon sheet */
function getExistingReconRefs(recon) {
  var lastRow = recon.getLastRow();
  if (lastRow < 2) return [];
  var refs = recon.getRange(2, 2, lastRow - 1, 1).getValues();
  return refs.map(function(r) { return r[0]; });
}

/** Auto-matches HCP amounts against bank amounts within tolerance */
function runAutoMatch() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var recon = ss.getSheetByName(RECON_SHEET);
  if (!recon) return logError("Reconciliation sheet not found. Run Import first.");

  var lastRow = recon.getLastRow();
  if (lastRow < 2) return "No records to match.";

  var data = recon.getRange(2, 1, lastRow - 1, 11).getValues();
  var matched = 0;

  for (var i = 0; i < data.length; i++) {
    var hcpAmt = parseFloat(data[i][3]) || 0;
    var bankAmt = parseFloat(data[i][5]) || 0;
    var status = data[i][8];

    if (status === 'Pending' && bankAmt > 0) {
      var variance = bankAmt - hcpAmt;
      data[i][7] = variance; // Variance

      if (Math.abs(variance) <= MATCH_TOLERANCE) {
        data[i][8] = 'Matched';
        data[i][9] = new Date();
        matched++;
      } else if (bankAmt > 0) {
        data[i][8] = 'Variance';
      }
    }
  }

  recon.getRange(2, 1, data.length, 11).setValues(data);
  formatReconSheet(recon);

  if (matched > 0) updateJobLogFromMatches(recon);

  return 'Auto-match complete: ' + matched + ' exact match(es) found, ' +
    data.filter(function(r) { return r[8] === 'Variance'; }).length + ' with variance.';
}

/** Marks matched jobs as "Paid" in Job_Log */
function updateJobLogFromMatches(recon) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(JOB_LOG_SHEET);
  if (!log) return;

  var lastRow = recon.getLastRow();
  if (lastRow < 2) return;

  var data = recon.getRange(2, 1, lastRow - 1, 11).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][8] === 'Matched') {
      var jobRow = data[i][1];
      if (jobRow >= 3) {
        log.getRange(jobRow, 17).setValue('Paid'); // Column Q = Status
      }
    }
  }
}

/** Forces a manual match for the selected row in the Recon sheet */
function forceMatchSelected() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var recon = ss.getSheetByName(RECON_SHEET);
  if (!recon) return logError("Reconciliation sheet not found.");

  var activeRow = recon.getActiveCell().getRow();
  if (activeRow < 2) return "Select a reconciliation row (row 2+).";

  var row = recon.getRange(activeRow, 1, 1, 11).getValues()[0];
  var hcpAmt = parseFloat(row[3]) || 0;
  var bankAmt = parseFloat(row[5]) || 0;

  recon.getRange(activeRow, 8).setValue(bankAmt - hcpAmt);  // Variance
  recon.getRange(activeRow, 9).setValue('Force Matched');     // Status
  recon.getRange(activeRow, 10).setValue(new Date());         // Matched Date

  var jobRow = row[1];
  if (jobRow >= 3) {
    var log = ss.getSheetByName(JOB_LOG_SHEET);
    if (log) log.getRange(jobRow, 17).setValue('Paid');
  }

  return 'Row ' + activeRow + ' force-matched (variance: $' + (bankAmt - hcpAmt).toFixed(2) + ').';
}

/** Generates a reconciliation summary report */
function getReconSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var recon = ss.getSheetByName(RECON_SHEET);
  if (!recon) return { total: 0, matched: 0, pending: 0, variance: 0, totalHcp: 0, totalBank: 0 };

  var lastRow = recon.getLastRow();
  if (lastRow < 2) return { total: 0, matched: 0, pending: 0, variance: 0, totalHcp: 0, totalBank: 0 };

  var data = recon.getRange(2, 1, lastRow - 1, 11).getValues();
  var summary = { total: data.length, matched: 0, pending: 0, variance: 0, totalHcp: 0, totalBank: 0 };

  for (var i = 0; i < data.length; i++) {
    var status = data[i][8];
    if (status === 'Matched' || status === 'Force Matched') summary.matched++;
    else if (status === 'Pending') summary.pending++;
    else if (status === 'Variance') summary.variance++;
    summary.totalHcp += parseFloat(data[i][3]) || 0;
    summary.totalBank += parseFloat(data[i][5]) || 0;
  }

  return summary;
}

/** Applies formatting to the Reconciliation sheet */
function formatReconSheet(recon) {
  var lastRow = Math.max(recon.getLastRow(), 2);
  recon.getRange("D2:D" + lastRow).setNumberFormat("$#,##0.00");
  recon.getRange("F2:F" + lastRow).setNumberFormat("$#,##0.00");
  recon.getRange("H2:H" + lastRow).setNumberFormat("$#,##0.00");

  // Conditional coloring for status
  var statusRange = recon.getRange(2, 9, lastRow - 1, 1).getValues();
  for (var i = 0; i < statusRange.length; i++) {
    var cell = recon.getRange(i + 2, 9);
    switch (statusRange[i][0]) {
      case 'Matched':
      case 'Force Matched':
        cell.setBackground('#e8f5e9').setFontColor('#2e7d32');
        break;
      case 'Variance':
        cell.setBackground('#fff3e0').setFontColor('#e65100');
        break;
      case 'Pending':
        cell.setBackground('#e3f2fd').setFontColor('#1565c0');
        break;
    }
  }
}
