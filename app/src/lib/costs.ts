import { CONFIG, OVERHEAD_PER_JOB, PERSONNEL } from './config'
import type { Job, JobCostBreakdown } from './types'

export function getPersonnelByName(name: string) {
  return PERSONNEL.find(p => p.name === name)
}

export function calcJobCost(job: Job): JobCostBreakdown {
  const rate = getPersonnelByName(job.tech)?.loaded || 30
  const labor = (job.onsite + job.travel) * rate
  const travelCost = (job.miles || 0) * CONFIG.FUEL_PER_MILE
  const parts = job.parts || 0
  const consumables = job.consumables || 0
  const overhead = OVERHEAD_PER_JOB

  const total = labor + travelCost + parts + consumables + CONFIG.QA_PER_JOB + CONFIG.ADMIN_PER_JOB + CONFIG.RISK_BUFFER + overhead
  const profit = (job.revenue || 0) - total
  const margin = job.revenue > 0 ? profit / job.revenue : -1

  return { labor, travelCost, parts, consumables, qa: CONFIG.QA_PER_JOB, admin: CONFIG.ADMIN_PER_JOB, risk: CONFIG.RISK_BUFFER, overhead, total, profit, margin }
}

export function calculateTrueCostFromInputs(
  techName: string,
  onsiteHrs: number,
  travelHrs: number,
  miles: number,
  partsCost: number,
  consumablesCost: number,
  revenue: number,
) {
  const rate = getPersonnelByName(techName)?.loaded || 30
  const labor = (onsiteHrs + travelHrs) * rate
  const travelCost = miles * CONFIG.FUEL_PER_MILE
  const overhead = OVERHEAD_PER_JOB
  const total = labor + travelCost + partsCost + consumablesCost + CONFIG.QA_PER_JOB + CONFIG.ADMIN_PER_JOB + CONFIG.RISK_BUFFER + overhead
  const profit = revenue - total
  const minPrice = total * 1.1

  return {
    techRate: rate,
    labor,
    travel: travelCost,
    parts: partsCost,
    consumables: consumablesCost,
    qa: CONFIG.QA_PER_JOB,
    admin: CONFIG.ADMIN_PER_JOB,
    risk: CONFIG.RISK_BUFFER,
    overhead,
    total,
    profit,
    minPrice,
    verdict: profit >= 0 ? 'ACCEPT' as const : 'REJECT' as const,
  }
}
