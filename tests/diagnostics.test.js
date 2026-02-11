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

describe('runTroubleshooter', () => {
  test('reports healthy when assumptions are in sync and no aging jobs', () => {
    const assumpData = [];
    assumpData[32] = [null, 5000];  // B33 = monthly cost
    assumpData[33] = [null, 160];   // B34 = monthly hours
    assumpData[38] = [null, 31.25]; // B39 = opCost (5000/160 = 31.25)

    const logData = [['Header'], ['Sub']]; // No data rows
    const assumpSheet = new MockSheet('Assumptions', assumpData);
    const logSheet = new MockSheet('Job_Log', logData);
    const mockApp = createMockSpreadsheetApp([assumpSheet, logSheet]);
    const engine = loadEngine(mockApp);

    const result = engine.runTroubleshooter();
    expect(result).toContain('HEALTHY');
  });

  test('detects assumption out-of-sync', () => {
    const assumpData = [];
    assumpData[32] = [null, 5000];  // B33
    assumpData[33] = [null, 160];   // B34
    assumpData[38] = [null, 99.99]; // B39 wrong (should be 31.25)

    const logData = [['Header'], ['Sub']];
    const assumpSheet = new MockSheet('Assumptions', assumpData);
    const logSheet = new MockSheet('Job_Log', logData);
    const mockApp = createMockSpreadsheetApp([assumpSheet, logSheet]);
    const engine = loadEngine(mockApp);

    const result = engine.runTroubleshooter();
    expect(result).toContain('Out-of-Sync');
  });

  test('detects aging unreconciled jobs', () => {
    const assumpData = [];
    assumpData[32] = [null, 5000];
    assumpData[33] = [null, 160];
    assumpData[38] = [null, 31.25];

    // Create a job >30 days old, not Paid, with revenue
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    const logData = [
      ['Header'],
      ['Sub'],
      ['J001', oldDate.toISOString(), 'Client', 'Job', 'Sam', 4, 100, '', '', '', '', 5000, '', '', '', '', 'Open']
    ];

    const assumpSheet = new MockSheet('Assumptions', assumpData);
    const logSheet = new MockSheet('Job_Log', logData);
    const mockApp = createMockSpreadsheetApp([assumpSheet, logSheet]);
    const engine = loadEngine(mockApp);

    const result = engine.runTroubleshooter();
    expect(result).toContain('Aging Alert');
  });

  test('skips paid jobs in aging check', () => {
    const assumpData = [];
    assumpData[32] = [null, 5000];
    assumpData[33] = [null, 160];
    assumpData[38] = [null, 31.25];

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);

    const logData = [
      ['Header'],
      ['Sub'],
      ['J001', oldDate.toISOString(), 'Client', 'Job', 'Sam', 4, 100, '', '', '', '', 5000, '', '', '', '', 'Paid']
    ];

    const assumpSheet = new MockSheet('Assumptions', assumpData);
    const logSheet = new MockSheet('Job_Log', logData);
    const mockApp = createMockSpreadsheetApp([assumpSheet, logSheet]);
    const engine = loadEngine(mockApp);

    const result = engine.runTroubleshooter();
    expect(result).toContain('HEALTHY');
  });
});
