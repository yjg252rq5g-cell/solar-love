import type { WarrantyStatus } from './config'

export interface Job {
  date: string
  id: string
  customer: string
  city: string
  state: string
  zip: string
  priority: 'High' | 'Medium' | 'Low'
  tech: string
  type: 'Service' | 'Warranty' | 'Both'
  onsite: number
  travel: number
  miles: number
  parts: number
  consumables: number
  revenue: number
  wcase: string
  wstatus: string
  notes: string
  flags: string[]
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  route: string
  routeDate: string
  requested: string
}

export interface WarrantyClaim {
  status: WarrantyStatus
  customerName: string
  dateOfJob: string
  caseNumber: string
  techName: string
  allottedTravel: number
  actualTravelTime: number
  distanceMileage: number
  actualMileage: number
  allottedTechTime: number
  actualTechTime: number
  allottedAmount: number
  adjustedAmount: number
  paidAmount: number
  dateCheckCut: string
  svn: string
  companyCost: number
  profitAmount: number
  lossAmount: number
  notes: string
  month: string
  materials?: string
  rmaNumber?: string
  goBackReason?: string
  partsOrdered?: string
  partsEta?: string
}

export interface JobCostBreakdown {
  labor: number
  travelCost: number
  parts: number
  consumables: number
  qa: number
  admin: number
  risk: number
  overhead: number
  total: number
  profit: number
  margin: number
}

export interface Settings {
  appsScriptUrl: string
  mapsApiKey: string
  depot: { lat: number; lng: number }
  maxJobsPerRoute: number
  serviceDuration: number
  workdayStart: number
  fuelCost: number
  qaCost: number
  adminCost: number
  riskBuffer: number
  overheadAlloc: number
  emailGenerac: string
  emailInfo: string
  emailCustomerSupport: string
  emailCaden: string
  scanFrequency: number
  unansweredThreshold: number
}
