export const CONFIG = {
  DEPOT: { lat: 35.9641, lng: -83.9201, name: 'Akino Solar HQ (Knoxville, TN)' },
  MONTHLY_OVERHEAD: 43480,
  FUEL_PER_MILE: 0.99,
  QA_PER_JOB: 85,
  ADMIN_PER_JOB: 315,
  RISK_BUFFER: 100,
  EMPLOYER_BURDEN: 0.30,
  JOBS_PER_WEEK: 5,
  WEEKS_PER_YEAR: 52,
  HOURS_PER_MONTH: 173.33,
  MAX_JOBS_PER_ROUTE: 4,
  REGIONS: ['TN', 'GA', 'KY', 'VA', 'NC'] as const,
  HOURS_PER_WEEK: 40,
  WORK_HOURS_PER_DAY: 8,
} as const

export const JOBS_PER_MONTH = CONFIG.JOBS_PER_WEEK * CONFIG.WEEKS_PER_YEAR / 12
export const OVERHEAD_PER_JOB = CONFIG.MONTHLY_OVERHEAD / JOBS_PER_MONTH
export const BREAKEVEN_PER_JOB = OVERHEAD_PER_JOB + CONFIG.RISK_BUFFER
export const COST_PER_HOUR = CONFIG.MONTHLY_OVERHEAD / CONFIG.HOURS_PER_MONTH

export const PERSONNEL = [
  { name: 'Sam', role: 'Technician', hourly: 25, loaded: 32.50 },
  { name: 'Lucas', role: 'Technician', hourly: 20, loaded: 26.00 },
  { name: 'Katie', role: 'Technician', hourly: 20, loaded: 26.00 },
  { name: 'Spencer', role: 'Lead Tech', hourly: 40, loaded: 52.00 },
  { name: 'Lex', role: 'Technician', hourly: 30, loaded: 39.00 },
  { name: 'Caden', role: 'Manager', hourly: 28.85, loaded: 37.51 },
  { name: 'Jen', role: 'Admin', hourly: 15, loaded: 19.50 },
  { name: 'Andrew', role: 'Technician', hourly: 25, loaded: 32.50 },
  { name: 'QA', role: 'QA Lead', hourly: 13.54, loaded: 17.60 },
] as const

export type PersonnelMember = (typeof PERSONNEL)[number]

export const WARRANTY_STATUSES = [
  'Paid', 'Needs Attention', 'Scheduled', 'Submitted', 'Completed not paid',
  'Waiting RMA', 'Waiting Go Back', 'Parts Ordered', 'RMA Approved', 'RMA Denied',
  'Go Back Scheduled', 'Go Back Complete', 'In Progress', 'Pending Review', 'Denied', 'Cancelled',
] as const

export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number]

export const WARRANTY_STATUS_COLORS: Record<string, string> = {
  'Paid': '#16a34a',
  'Needs Attention': '#dc2626',
  'Scheduled': '#3b82f6',
  'Submitted': '#f59e0b',
  'Completed not paid': '#f97316',
  'Waiting RMA': '#f59e0b',
  'Waiting Go Back': '#f59e0b',
  'Parts Ordered': '#8b5cf6',
  'RMA Approved': '#16a34a',
  'RMA Denied': '#dc2626',
  'Go Back Scheduled': '#3b82f6',
  'Go Back Complete': '#16a34a',
  'In Progress': '#3b82f6',
  'Pending Review': '#f59e0b',
  'Denied': '#dc2626',
  'Cancelled': '#6b7280',
}

export const OVERHEAD_CATEGORIES: Record<string, number> = {
  'People & Payroll': 33383,
  'Software & Subscriptions': 1819,
  'Storage & Facilities': 899,
  'Fleet & Vehicles': 2358,
  'Miscellaneous': 3537,
  'Debt Service': 7593,
  'Reserves': 8315,
  'Depreciation': 1283,
  'Variable Costs': 1925,
}

export const ROUTES_DATA = [
  { id: 'R1', jobs: 4, miles: 372.56, min: 640, val: 400 },
  { id: 'R2', jobs: 4, miles: 382.10, min: 655, val: 150 },
  { id: 'R3', jobs: 4, miles: 501.72, min: 860, val: 1433.82 },
  { id: 'R4', jobs: 4, miles: 229.25, min: 393, val: 1407.88 },
  { id: 'R5', jobs: 4, miles: 156.84, min: 269, val: 1050.00 },
  { id: 'R6', jobs: 3, miles: 334.11, min: 572, val: 925.50 },
  { id: 'R7', jobs: 4, miles: 445.00, min: 763, val: 2741.62 },
  { id: 'R8', jobs: 4, miles: 761.00, min: 1304, val: 649.50 },
  { id: 'R9', jobs: 3, miles: 420.65, min: 721, val: 1100.00 },
  { id: 'R10', jobs: 2, miles: 470.00, min: 806, val: 3713.62 },
  { id: 'R11', jobs: 4, miles: 390.50, min: 669, val: 1200.00 },
  { id: 'R12', jobs: 4, miles: 512.33, min: 879, val: 850.00 },
  { id: 'R13', jobs: 3, miles: 281.40, min: 482, val: 1550.00 },
  { id: 'R14', jobs: 4, miles: 346.50, min: 594, val: 895.13 },
  { id: 'R15', jobs: 4, miles: 428.75, min: 735, val: 1200.00 },
  { id: 'R16', jobs: 3, miles: 295.20, min: 506, val: 980.00 },
  { id: 'R17', jobs: 4, miles: 510.60, min: 876, val: 1450.00 },
  { id: 'R18', jobs: 4, miles: 389.90, min: 669, val: 1100.00 },
] as const

export const WARRANTY_MONTHS = [
  'Form Responses 1', 'May 2025', 'Dec 2024', 'Nov 2024', 'Jan 2025', 'Feb 2025',
  'Mar 2025', 'April 2025', 'July 2025', 'AUGUST 2025', 'September 2025',
  'October 2025', 'November 2025', 'December 2025', 'January 2026',
] as const
