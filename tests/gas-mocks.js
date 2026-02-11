/**
 * Google Apps Script mock layer for local testing.
 * Provides fake SpreadsheetApp, Sheet, Range, and Utilities objects.
 */

class MockRange {
  constructor(data, row, col, numRows, numCols) {
    this._data = data;
    this._row = row;
    this._col = col;
    this._numRows = numRows;
    this._numCols = numCols;
    this._formula = null;
    this._formulas = null;
    this._numberFormat = null;
    this._fontWeight = null;
    this._background = null;
    this._fontColor = null;
  }

  getValue() {
    return this._data[this._row] && this._data[this._row][this._col] !== undefined
      ? this._data[this._row][this._col]
      : '';
  }

  setValue(val) {
    if (!this._data[this._row]) this._data[this._row] = [];
    this._data[this._row][this._col] = val;
    return this;
  }

  getValues() {
    const result = [];
    for (let r = 0; r < this._numRows; r++) {
      const row = [];
      for (let c = 0; c < this._numCols; c++) {
        const dr = this._row + r;
        const dc = this._col + c;
        row.push(this._data[dr] && this._data[dr][dc] !== undefined ? this._data[dr][dc] : '');
      }
      result.push(row);
    }
    return result;
  }

  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        if (!this._data[this._row + r]) this._data[this._row + r] = [];
        this._data[this._row + r][this._col + c] = values[r][c];
      }
    }
    return this;
  }

  setFormula(f) { this._formula = f; return this; }
  setFormulas(f) { this._formulas = f; return this; }
  setNumberFormat(f) { this._numberFormat = f; return this; }
  setFontWeight(w) { this._fontWeight = w; return this; }
  setBackground(bg) { this._background = bg; return this; }
  setFontColor(c) { this._fontColor = c; return this; }
}

class MockSheet {
  constructor(name, data) {
    this.name = name;
    this._data = data || [];
    this._frozen = 0;
    this._colWidths = {};
    this._activeRow = 1;
  }

  getName() { return this.name; }

  getLastRow() {
    return this._data.length;
  }

  getRange(a1OrRow, col, numRows, numCols) {
    if (typeof a1OrRow === 'string') {
      const parsed = parseA1(a1OrRow, this._data.length);
      return new MockRange(this._data, parsed.row, parsed.col, parsed.numRows, parsed.numCols);
    }
    // Numeric: 1-based row/col
    return new MockRange(this._data, a1OrRow - 1, col - 1, numRows || 1, numCols || 1);
  }

  appendRow(rowData) {
    this._data.push([...rowData]);
  }

  deleteRow(rowNum) {
    this._data.splice(rowNum - 1, 1);
  }

  insertSheet() { return this; }
  setFrozenRows(n) { this._frozen = n; }
  setColumnWidth(col, w) { this._colWidths[col] = w; }

  getActiveCell() {
    return { getRow: () => this._activeRow };
  }

  setActiveRow(row) { this._activeRow = row; }
}

function parseA1(ref, maxRow) {
  // Handles: "B29", "AI2", "A1:Q1", "L3:L", "D2:D100", "AI2:AJ2"
  const match = ref.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d*))?$/);
  if (!match) return { row: 0, col: 0, numRows: 1, numCols: 1 };

  const col1 = colToIndex(match[1]);
  const row1 = parseInt(match[2]) - 1;
  if (!match[3]) return { row: row1, col: col1, numRows: 1, numCols: 1 };

  const col2 = colToIndex(match[3]);
  const row2 = match[4] ? parseInt(match[4]) - 1 : Math.max(maxRow - 1, row1);

  return {
    row: row1,
    col: col1,
    numRows: row2 - row1 + 1,
    numCols: col2 - col1 + 1
  };
}

function colToIndex(letters) {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

class MockSpreadsheet {
  constructor(sheets) {
    this._sheets = {};
    (sheets || []).forEach(s => { this._sheets[s.getName()] = s; });
  }

  getSheetByName(name) {
    return this._sheets[name] || null;
  }

  insertSheet(name) {
    const sheet = new MockSheet(name, []);
    this._sheets[name] = sheet;
    return sheet;
  }
}

class MockUi {
  constructor() { this.alerts = []; }
  alert(msg) { this.alerts.push(msg); }
  createMenu() { return new MockMenu(); }
}

class MockMenu {
  addItem() { return this; }
  addSeparator() { return this; }
  addSubMenu() { return this; }
  addToUi() { return this; }
}

function createMockSpreadsheetApp(sheets) {
  const ss = new MockSpreadsheet(sheets);
  const ui = new MockUi();
  return {
    getActiveSpreadsheet: () => ss,
    getUi: () => ui,
    flush: () => {},
    _ss: ss,
    _ui: ui
  };
}

function createMockUtilities() {
  return {
    formatDate: (date, tz, fmt) => {
      const d = new Date(date);
      return d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
    }
  };
}

function createMockSession() {
  return {
    getScriptTimeZone: () => 'America/New_York'
  };
}

module.exports = {
  MockSheet,
  MockRange,
  MockSpreadsheet,
  MockUi,
  createMockSpreadsheetApp,
  createMockUtilities,
  createMockSession,
  colToIndex,
  parseA1
};
