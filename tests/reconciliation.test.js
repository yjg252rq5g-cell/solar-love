const { MockSheet, createMockSpreadsheetApp, createMockUtilities, createMockSession } = require('./gas-mocks');

const fs = require('fs');
const vm = require('vm');

function loadRecon(spreadsheetApp) {
  const coreCode = fs.readFileSync(__dirname + '/../Code.gs', 'utf8');
  const reconCode = fs.readFileSync(__dirname + '/../Reconciliation.gs', 'utf8');
  const sandbox = {
    SpreadsheetApp: spreadsheetApp,
    Utilities: createMockUtilities(),
    Session: createMockSession(),
    HtmlService: {
      createHtmlOutputFromFile: () => ({
        setTitle: function() { return this; },
        setWidth: function() { return this; },
        append: function() { return this; }
      })
    },
    Logger: { log: console.log },
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(coreCode, sandbox);
  vm.runInContext(reconCode, sandbox);
  return sandbox;
}

function buildJobLogData() {
  // Row 0 = header row 1, Row 1 = header row 2, Rows 2+ = data (row 3+)
  const data = [];
  data[0] = ['ID', 'Date', 'Client', 'Job Name', 'Tech', 'Hours', 'Miles', '', '', '', '', 'Revenue', '', '', '', '', 'Status'];
  data[1] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
  // Job row 3: revenue=5000, status=Open
  data[2] = ['J001', '2026-01-15', 'Client A', 'Roof Install', 'Sam', 4, 100, '', '', '', '', 5000, '', '', '', '', 'Open'];
  // Job row 4: revenue=3000, status=Paid (should be skipped)
  data[3] = ['J002', '2026-01-20', 'Client B', 'Panel Repair', 'Lucas', 2, 50, '', '', '', '', 3000, '', '', '', '', 'Paid'];
  // Job row 5: revenue=7500, status=Invoiced
  data[4] = ['J003', '2026-02-01', 'Client C', 'Commercial Job', 'Lex', 8, 200, '', '', '', '', 7500, '', '', '', '', 'Invoiced'];
  return data;
}

describe('Reconciliation Module', () => {
  let env, mockApp;

  beforeEach(() => {
    const jobLogSheet = new MockSheet('Job_Log', buildJobLogData());
    const assumpData = [];
    assumpData[28] = [null, 1.25];
    assumpData[38] = [null, 280.99];
    const assumpSheet = new MockSheet('Assumptions', assumpData);
    mockApp = createMockSpreadsheetApp([jobLogSheet, assumpSheet]);
    env = loadRecon(mockApp);
  });

  describe('importUnreconciledJobs', () => {
    test('imports only unpaid jobs with revenue', () => {
      const result = env.importUnreconciledJobs();

      expect(result).toContain('2');
      const recon = mockApp._ss.getSheetByName('Reconciliation');
      expect(recon).not.toBeNull();
      // Header + 2 data rows (J001=Open, J003=Invoiced; J002=Paid is skipped)
      expect(recon.getLastRow()).toBe(3);
    });

    test('does not duplicate on second import', () => {
      env.importUnreconciledJobs();
      const result = env.importUnreconciledJobs();

      expect(result).toContain('0');
      const recon = mockApp._ss.getSheetByName('Reconciliation');
      expect(recon.getLastRow()).toBe(3); // Still 3
    });

    test('sets status to Pending for new imports', () => {
      env.importUnreconciledJobs();
      const recon = mockApp._ss.getSheetByName('Reconciliation');
      const row2 = recon.getRange(2, 1, 1, 11).getValues()[0];
      expect(row2[8]).toBe('Pending');
    });
  });

  describe('runAutoMatch', () => {
    test('matches when bank amount equals HCP amount', () => {
      env.importUnreconciledJobs();
      const recon = mockApp._ss.getSheetByName('Reconciliation');

      // Set bank amount for row 2 (first unreconciled job) to match HCP
      recon._data[1][5] = 5000; // Bank Amount = HCP Amount
      recon._data[1][6] = new Date('2026-02-10');

      const result = env.runAutoMatch();
      expect(result).toContain('1 exact match');

      // Check status updated
      expect(recon._data[1][8]).toBe('Matched');
      // Check Job_Log updated to Paid
      const jobLog = mockApp._ss.getSheetByName('Job_Log');
      expect(jobLog._data[2][16]).toBe('Paid');
    });

    test('flags variance when amounts differ', () => {
      env.importUnreconciledJobs();
      const recon = mockApp._ss.getSheetByName('Reconciliation');

      // Set bank amount that doesn't match
      recon._data[1][5] = 4800; // Bank Amount != HCP Amount (5000)
      recon._data[1][6] = new Date('2026-02-10');

      const result = env.runAutoMatch();
      expect(result).toContain('0 exact match');
      expect(result).toContain('1 with variance');
      expect(recon._data[1][8]).toBe('Variance');
      expect(recon._data[1][7]).toBe(-200); // Variance = 4800 - 5000
    });

    test('leaves pending when no bank amount entered', () => {
      env.importUnreconciledJobs();
      const result = env.runAutoMatch();
      expect(result).toContain('0 exact match');

      const recon = mockApp._ss.getSheetByName('Reconciliation');
      expect(recon._data[1][8]).toBe('Pending');
    });
  });

  describe('getReconSummary', () => {
    test('returns zeroes when no recon sheet exists', () => {
      const summary = env.getReconSummary();
      expect(summary.total).toBe(0);
      expect(summary.matched).toBe(0);
      expect(summary.pending).toBe(0);
    });

    test('returns correct counts after import and match', () => {
      env.importUnreconciledJobs();
      const recon = mockApp._ss.getSheetByName('Reconciliation');
      recon._data[1][5] = 5000;
      env.runAutoMatch();

      const summary = env.getReconSummary();
      expect(summary.total).toBe(2);
      expect(summary.matched).toBe(1);
      expect(summary.pending).toBe(1);
      expect(summary.totalHcp).toBe(12500); // 5000 + 7500
    });
  });

  describe('forceMatchSelected', () => {
    test('force matches the active row', () => {
      env.importUnreconciledJobs();
      const recon = mockApp._ss.getSheetByName('Reconciliation');
      recon._data[1][5] = 4800; // Bank amount with variance
      recon._activeRow = 2;

      const result = env.forceMatchSelected();
      expect(result).toContain('force-matched');
      expect(recon._data[1][8]).toBe('Force Matched');
    });
  });
});
