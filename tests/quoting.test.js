const { MockSheet, createMockSpreadsheetApp, createMockUtilities, createMockSession } = require('./gas-mocks');

// Load the GAS source by evaluating it with mocked globals
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

describe('generateQuote', () => {
  let engine;

  beforeEach(() => {
    // Assumptions sheet: B29=mileRate, B39=survivalRate
    const assumpData = [];
    assumpData[28] = [null, 1.25]; // B29 (0-indexed row 28, col 1)
    assumpData[38] = [null, 280.99]; // B39
    const assumpSheet = new MockSheet('Assumptions', assumpData);

    const mockApp = createMockSpreadsheetApp([assumpSheet]);
    engine = loadEngine(mockApp);
  });

  test('calculates breakeven for known tech', () => {
    const result = engine.generateQuote({
      tech: 'Sam',
      hours: '4',
      miles: '100',
      parts: '200',
      revenue: '0'
    });

    // breakeven = (4 * 280.99) + (100 * 1.25) + (4 * 28.25) + 200 + 85 + 315
    // = 1123.96 + 125 + 113 + 200 + 85 + 315 = 1961.96
    expect(parseFloat(result.breakeven)).toBeCloseTo(1961.96, 2);
    expect(result.profitStatus).toContain('LOSS');
  });

  test('marks profitable when revenue exceeds breakeven', () => {
    const result = engine.generateQuote({
      tech: 'Sam',
      hours: '4',
      miles: '100',
      parts: '200',
      revenue: '5000'
    });

    expect(result.profitStatus).toContain('PROFITABLE');
  });

  test('uses default tech rate for unknown tech', () => {
    const result = engine.generateQuote({
      tech: 'Unknown',
      hours: '2',
      miles: '0',
      parts: '0',
      revenue: '0'
    });

    // breakeven = (2 * 280.99) + (0) + (2 * 40.63) + 0 + 85 + 315
    // = 561.98 + 0 + 81.26 + 0 + 85 + 315 = 1043.24
    expect(parseFloat(result.breakeven)).toBeCloseTo(1043.24, 2);
  });

  test('calculates suggested price with risk buffer and margin target', () => {
    const result = engine.generateQuote({
      tech: 'Lex',
      hours: '1',
      miles: '0',
      parts: '0',
      revenue: '0'
    });

    // breakeven = (1 * 280.99) + 0 + (1 * 45) + 0 + 85 + 315 = 725.99
    // suggested = (725.99 * 1.10) / 0.85 = 798.589 / 0.85 = 939.516...
    const breakeven = parseFloat(result.breakeven);
    const suggested = parseFloat(result.suggested);
    expect(breakeven).toBeCloseTo(725.99, 2);
    expect(suggested).toBeCloseTo(breakeven * 1.10 / 0.85, 2);
  });

  test('handles zero hours and miles gracefully', () => {
    const result = engine.generateQuote({
      tech: 'Sam',
      hours: '0',
      miles: '0',
      parts: '0',
      revenue: '0'
    });

    // breakeven = 0 + 0 + 0 + 0 + 85 + 315 = 400
    expect(parseFloat(result.breakeven)).toBeCloseTo(400, 2);
  });

  test('handles missing/empty input fields', () => {
    const result = engine.generateQuote({
      tech: '',
      hours: '',
      miles: '',
      parts: '',
      revenue: ''
    });

    expect(parseFloat(result.breakeven)).toBeCloseTo(400, 2);
    expect(result.profitStatus).toContain('LOSS');
  });
});
