import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Job, WarrantyClaim, Settings } from './types'

interface AppState {
  jobs: Job[]
  warranty: WarrantyClaim[]
  settings: Settings
  isLoggedIn: boolean

  setJobs: (jobs: Job[]) => void
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  deleteJob: (id: string) => void
  setWarranty: (claims: WarrantyClaim[]) => void
  addWarrantyClaim: (claim: WarrantyClaim) => void
  updateSettings: (settings: Partial<Settings>) => void
  setLoggedIn: (v: boolean) => void
}

const defaultSettings: Settings = {
  appsScriptUrl: '',
  mapsApiKey: '',
  depot: { lat: 35.9641, lng: -83.9201 },
  maxJobsPerRoute: 4,
  serviceDuration: 2,
  workdayStart: 8,
  fuelCost: 0.99,
  qaCost: 85,
  adminCost: 315,
  riskBuffer: 100,
  overheadAlloc: 100,
  emailGenerac: 'generac@akinosolar.com',
  emailInfo: 'info@akinosolar.com',
  emailCustomerSupport: 'customersupport@akinosolar.com',
  emailCaden: 'caden@akinosolar.com',
  scanFrequency: 60,
  unansweredThreshold: 24,
}

const defaultJobs: Job[] = [
  { date: '2026-01-05', id: '435804', customer: 'Dennis Stadler', city: 'McEwen', state: 'TN', zip: '', priority: 'Medium', tech: 'Lucas', type: 'Both', onsite: 1, travel: 4, miles: 234, parts: 0, consumables: 0, revenue: 150, wcase: '435804', wstatus: 'Completed not paid', notes: 'Warranty + service', flags: [], status: 'completed', route: 'R7', routeDate: '2026-01-05', requested: '2025-12-28' },
  { date: '2026-01-06', id: '439295', customer: 'Krista Hogan', city: '', state: 'TN', zip: '', priority: 'Medium', tech: 'Lucas', type: 'Warranty', onsite: 2.5, travel: 1, miles: 28, parts: 0, consumables: 0, revenue: 450, wcase: '439295', wstatus: 'Completed not paid', notes: 'Warranty claim', flags: [], status: 'completed', route: '', routeDate: '', requested: '2026-01-03' },
  { date: '2026-02-11', id: '597', customer: 'Barbara Arledge', city: 'Portland', state: 'TN', zip: '', priority: 'High', tech: 'Lucas', type: 'Service', onsite: 3, travel: 2, miles: 470, parts: 0, consumables: 0, revenue: 3713.62, wcase: '', wstatus: '', notes: '', flags: [], status: 'in-progress', route: 'R10', routeDate: '2026-02-11', requested: '2026-02-08' },
  { date: '2026-02-10', id: '628', customer: 'Martha Berry', city: 'Nashville', state: 'TN', zip: '', priority: 'High', tech: 'Caden', type: 'Service', onsite: 2, travel: 1.5, miles: 445, parts: 0, consumables: 0, revenue: 1404.20, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: 'R7', routeDate: '2026-02-10', requested: '2026-02-05' },
  { date: '2026-02-17', id: '649', customer: 'Peter Tran', city: 'Ellijay', state: 'TN', zip: '', priority: 'High', tech: 'Caden', type: 'Service', onsite: 2, travel: 2, miles: 500, parts: 0, consumables: 0, revenue: 740.82, wcase: '', wstatus: '', notes: '', flags: [], status: 'scheduled', route: 'R3', routeDate: '2026-02-17', requested: '2026-02-12' },
  { date: '2026-02-11', id: '464', customer: 'Mary Leffell', city: 'Louisville', state: 'KY', zip: '', priority: 'Medium', tech: 'Sam', type: 'Service', onsite: 1, travel: 1, miles: 46, parts: 0, consumables: 0, revenue: 394.63, wcase: '', wstatus: '', notes: '', flags: [], status: 'in-progress', route: 'R14', routeDate: '2026-02-11', requested: '2026-02-09' },
  { date: '2026-02-19', id: '638', customer: 'Erica Drvoldelic', city: 'Grovetown', state: 'GA', zip: '', priority: 'Low', tech: 'Lucas', type: 'Service', onsite: 2, travel: 3, miles: 501, parts: 0, consumables: 0, revenue: 343.50, wcase: '', wstatus: '', notes: '', flags: [], status: 'scheduled', route: 'R3', routeDate: '2026-02-19', requested: '2026-02-14' },
  { date: '2026-02-11', id: '645', customer: 'Jason Wirth', city: 'Fairview', state: 'TN', zip: '', priority: 'Medium', tech: 'Caden', type: 'Service', onsite: 3, travel: 2, miles: 445, parts: 0, consumables: 0, revenue: 2191, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: 'R7', routeDate: '2026-02-11', requested: '2026-02-06' },
  { date: '2026-02-11', id: '666', customer: 'Dennis Stadler', city: 'McEwen', state: 'TN', zip: '', priority: 'Medium', tech: 'Caden', type: 'Service', onsite: 1, travel: 1.5, miles: 333, parts: 0, consumables: 0, revenue: 75, wcase: '', wstatus: '', notes: 'Troubleshoot', flags: [], status: 'scheduled', route: 'R7', routeDate: '2026-02-11', requested: '2026-02-10' },
  { date: '2026-01-15', id: '200', customer: 'Jon', city: 'Knoxville', state: 'TN', zip: '', priority: 'Medium', tech: 'Caden', type: 'Service', onsite: 2, travel: 1, miles: 98, parts: 0, consumables: 0, revenue: 676, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: '', routeDate: '', requested: '2026-01-10' },
  { date: '2026-01-20', id: '100', customer: 'Heidi', city: '', state: 'TN', zip: '', priority: 'Medium', tech: 'Lucas', type: 'Service', onsite: 7, travel: 1, miles: 100, parts: 0, consumables: 0, revenue: 900, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: '', routeDate: '', requested: '2026-01-15' },
  { date: '2026-01-25', id: '500', customer: 'Bane', city: '', state: 'TN', zip: '', priority: 'High', tech: 'Lucas', type: 'Service', onsite: 8, travel: 4, miles: 510, parts: 0, consumables: 0, revenue: 675, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: '', routeDate: '', requested: '2026-01-18' },
  { date: '2025-12-21', id: '410', customer: 'Rivera', city: 'Atlanta', state: 'GA', zip: '', priority: 'Medium', tech: 'Lucas', type: 'Service', onsite: 1, travel: 2, miles: 372, parts: 0, consumables: 0, revenue: 400, wcase: '', wstatus: '', notes: '', flags: [], status: 'completed', route: 'R1', routeDate: '2025-12-21', requested: '2025-12-15' },
  { date: '2026-02-11', id: '616', customer: 'Robert Makowski', city: 'Adamsville', state: 'TN', zip: '', priority: 'High', tech: 'Lucas', type: 'Service', onsite: 2, travel: 3, miles: 761, parts: 0, consumables: 0, revenue: 649.50, wcase: '', wstatus: '', notes: '', flags: [], status: 'in-progress', route: 'R8', routeDate: '2026-02-11', requested: '2026-02-07' },
  { date: '2026-01-05', id: '999', customer: 'Anna Testa', city: '', state: 'TN', zip: '', priority: 'Low', tech: '', type: 'Warranty', onsite: 0, travel: 0, miles: 0, parts: 0, consumables: 0, revenue: 0, wcase: '', wstatus: 'Submitted', notes: 'Pending', flags: [], status: 'scheduled', route: '', routeDate: '', requested: '2026-01-02' },
]

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      jobs: defaultJobs,
      warranty: [],
      settings: defaultSettings,
      isLoggedIn: false,

      setJobs: (jobs) => set({ jobs }),
      addJob: (job) => set((s) => ({ jobs: [...s.jobs, job] })),
      updateJob: (id, updates) => set((s) => ({
        jobs: s.jobs.map(j => j.id === id ? { ...j, ...updates } : j)
      })),
      deleteJob: (id) => set((s) => ({
        jobs: s.jobs.filter(j => j.id !== id)
      })),
      setWarranty: (claims) => set({ warranty: claims }),
      addWarrantyClaim: (claim) => set((s) => ({ warranty: [...s.warranty, claim] })),
      updateSettings: (updates) => set((s) => ({
        settings: { ...s.settings, ...updates }
      })),
      setLoggedIn: (v) => set({ isLoggedIn: v }),
    }),
    { name: 'akino-solar-store' }
  )
)
