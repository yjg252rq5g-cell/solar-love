const { MockSheet, createMockSpreadsheetApp, createMockUtilities, createMockSession } = require('./gas-mocks');

const fs = require('fs');
const vm = require('vm');

function loadEngine(spreadsheetApp) {
  const code = fs.readFileSync(__dirname + '/../Code.gs', 'utf8');
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
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('archiveJobs', () => {
  let engine, mockApp;

  beforeEach(() => {
    const logData = [];
    // Row 0,1 = headers
    logData[0] = ['ID', 'Date', 'Client', 'Job', 'Tech', 'Hours', 'Miles', '', '', '', '', 'Rev', '', '', '', '', 'Status'];
    logData[1] = [];
    // Row 2 = job row 3: Paid -> should be archived
    logData[2] = ['J001', '2026-01-01', 'A', 'Job1', 'Sam', 2, 50, '', '', '', '', 1000, '', '', '', '', 'Paid'];
    // Row 3 = job row 4: Open -> should stay
    logData[3] = ['J002', '2026-01-15', 'B', 'Job2', 'Lucas', 4, 100, '', '', '', '', 3000, '', '', '', '', 'Open'];
    // Row 4 = job row 5: Paid -> should be archived
    logData[4] = ['J003', '2026-02-01', 'C', 'Job3', 'Lex', 6, 200, '', '', '', '', 5000, '', '', '', '', 'Paid'];

    const jobLog = new MockSheet('Job_Log', logData);
    mockApp = createMockSpreadsheetApp([jobLog]);
    engine = loadEngine(mockApp);
  });

  test('moves paid jobs to archive and removes them from log', () => {
    const result = engine.archiveJobs();

    expect(result).toContain('2');
    const archive = mockApp._ss.getSheetByName('Job_Archive');
    expect(archive).not.toBeNull();
    // Header + 2 archived rows
    expect(archive.getLastRow()).toBe(3);

    // Job_Log should only have headers + 1 remaining job
    const log = mockApp._ss.getSheetByName('Job_Log');
    expect(log.getLastRow()).toBe(3); // 2 header rows + 1 data row
    expect(log._data[2][0]).toBe('J002'); // The Open job remains
  });

  test('creates archive sheet if it does not exist', () => {
    expect(mockApp._ss.getSheetByName('Job_Archive')).toBeNull();
    engine.archiveJobs();
    expect(mockApp._ss.getSheetByName('Job_Archive')).not.toBeNull();
  });

  test('returns zero when no paid jobs exist', () => {
    const log = mockApp._ss.getSheetByName('Job_Log');
    log._data[2][16] = 'Open';
    log._data[4][16] = 'Open';

    const result = engine.archiveJobs();
    expect(result).toContain('0');
  });
});
