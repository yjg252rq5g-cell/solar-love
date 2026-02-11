import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { calcJobCost, calculateTrueCostFromInputs } from '@/lib/costs'
import { fmt, pct } from '@/lib/utils'
import { CONFIG, OVERHEAD_PER_JOB, BREAKEVEN_PER_JOB, COST_PER_HOUR, PERSONNEL, OVERHEAD_CATEGORIES } from '@/lib/config'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function Financials() {
  const jobs = useStore(s => s.jobs)

  // Calculator state
  const [calcTech, setCalcTech] = useState('Lucas')
  const [calcOnsite, setCalcOnsite] = useState(2)
  const [calcTravel, setCalcTravel] = useState(1)
  const [calcMiles, setCalcMiles] = useState(100)
  const [calcParts, setCalcParts] = useState(0)
  const [calcConsumables, setCalcConsumables] = useState(0)
  const [calcRevenue, setCalcRevenue] = useState(1500)

  const pnlChartRef = useRef<HTMLCanvasElement>(null)
  const overheadChartRef = useRef<HTMLCanvasElement>(null)
  const breakevenChartRef = useRef<HTMLCanvasElement>(null)
  const charts = useRef<Record<string, Chart>>({})

  const calcResult = useMemo(() =>
    calculateTrueCostFromInputs(calcTech, calcOnsite, calcTravel, calcMiles, calcParts, calcConsumables, calcRevenue),
    [calcTech, calcOnsite, calcTravel, calcMiles, calcParts, calcConsumables, calcRevenue]
  )

  const summary = useMemo(() => {
    const allRevenue = jobs.reduce((s, j) => s + (j.revenue || 0), 0)
    const allCost = jobs.reduce((s, j) => s + calcJobCost(j).total, 0)
    const profit = allRevenue - allCost
    const margin = allRevenue > 0 ? profit / allRevenue : 0
    return { allRevenue, allCost, profit, margin }
  }, [jobs])

  const techPerf = useMemo(() => {
    const perf: Record<string, { name: string; jobs: number; revenue: number; cost: number }> = {}
    jobs.forEach(j => {
      if (!j.tech) return
      if (!perf[j.tech]) perf[j.tech] = { name: j.tech, jobs: 0, revenue: 0, cost: 0 }
      perf[j.tech].jobs++
      perf[j.tech].revenue += j.revenue || 0
      perf[j.tech].cost += calcJobCost(j).total
    })
    return Object.values(perf)
  }, [jobs])

  const breakeven = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const jpw = i + 1
      const jpm = jpw * (52 / 12)
      const perJob = CONFIG.MONTHLY_OVERHEAD / jpm
      const be = perJob + CONFIG.RISK_BUFFER
      return { jpw, jpm: jpm.toFixed(1), perJob, be, isCurrent: jpw === CONFIG.JOBS_PER_WEEK }
    }),
    []
  )

  useEffect(() => {
    Object.values(charts.current).forEach(c => c.destroy())
    charts.current = {}

    // P&L by Tech
    if (pnlChartRef.current) {
      const labels = techPerf.map(t => t.name)
      const profits = techPerf.map(t => t.revenue - t.cost)
      charts.current.pnl = new Chart(pnlChartRef.current, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Profit/Loss', data: profits, backgroundColor: profits.map(p => p >= 0 ? '#16a34a' : '#dc2626'), borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      })
    }

    // Overhead
    if (overheadChartRef.current) {
      const cats = Object.keys(OVERHEAD_CATEGORIES)
      const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#16a34a', '#10b981', '#34d399', '#6ee7b7']
      charts.current.overhead = new Chart(overheadChartRef.current, {
        type: 'doughnut',
        data: { labels: cats, datasets: [{ data: cats.map(c => OVERHEAD_CATEGORIES[c]), backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false },
      })
    }

    // Breakeven
    if (breakevenChartRef.current) {
      charts.current.breakeven = new Chart(breakevenChartRef.current, {
        type: 'line',
        data: {
          labels: breakeven.map(b => `${b.jpw}/wk`),
          datasets: [
            { label: 'Overhead/Job', data: breakeven.map(b => b.perJob), borderColor: '#dc2626', backgroundColor: '#dc262620', fill: true, tension: 0.3 },
            { label: 'Breakeven', data: breakeven.map(b => b.be), borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3, fill: false },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
      })
    }

    return () => { Object.values(charts.current).forEach(c => c.destroy()) }
  }, [techPerf, breakeven])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Monthly Revenue" value={fmt(summary.allRevenue)} color="#2563eb" bgColor="#f0f9ff" />
        <KpiCard label="Monthly Overhead" value={fmt(CONFIG.MONTHLY_OVERHEAD)} color="#dc2626" bgColor="#fef2f2" />
        <KpiCard label="Breakeven/Job" value={fmt(BREAKEVEN_PER_JOB)} color="#f59e0b" bgColor="#fffbeb" />
        <KpiCard label="Cost/Hour" value={fmt(COST_PER_HOUR)} color="#a855f7" bgColor="#f3e8ff" />
        <KpiCard label="Net Profit" value={fmt(summary.profit)} color={summary.profit >= 0 ? '#16a34a' : '#dc2626'} bgColor={summary.profit >= 0 ? '#f0fdf4' : '#fef2f2'} />
        <KpiCard label="Profit Margin" value={pct(summary.margin)} color="#6366f1" bgColor="#f5f3ff" />
      </div>

      {/* True Cost Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Job Pricing Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Technician</label>
              <select value={calcTech} onChange={e => setCalcTech(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {PERSONNEL.filter(p => p.role !== 'Admin' && p.name !== 'QA').map(p => <option key={p.name} value={p.name}>{p.name} (${p.loaded}/hr)</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Onsite Hrs</label><input type="number" step="0.5" value={calcOnsite} onChange={e => setCalcOnsite(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Travel Hrs</label><input type="number" step="0.5" value={calcTravel} onChange={e => setCalcTravel(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Miles</label><input type="number" value={calcMiles} onChange={e => setCalcMiles(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Parts $</label><input type="number" step="0.01" value={calcParts} onChange={e => setCalcParts(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Consumables $</label><input type="number" step="0.01" value={calcConsumables} onChange={e => setCalcConsumables(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Revenue $</label><input type="number" step="0.01" value={calcRevenue} onChange={e => setCalcRevenue(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
          </div>
          <div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="font-bold text-gray-900 mb-3">Cost Breakdown</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Labor:</span> <strong>{fmt(calcResult.labor)}</strong></div>
                <div><span className="text-gray-500">Travel:</span> <strong>{fmt(calcResult.travel)}</strong></div>
                <div><span className="text-gray-500">Parts:</span> <strong>{fmt(calcResult.parts)}</strong></div>
                <div><span className="text-gray-500">Consumables:</span> <strong>{fmt(calcResult.consumables)}</strong></div>
                <div><span className="text-gray-500">QA:</span> <strong>{fmt(calcResult.qa)}</strong></div>
                <div><span className="text-gray-500">Admin/Mgmt:</span> <strong>{fmt(calcResult.admin)}</strong></div>
                <div><span className="text-gray-500">Risk Buffer:</span> <strong>{fmt(calcResult.risk)}</strong></div>
                <div><span className="text-gray-500">Overhead:</span> <strong>{fmt(calcResult.overhead)}</strong></div>
              </div>
              <div className="border-t border-gray-300 mt-3 pt-3 space-y-1">
                <div className="flex justify-between font-bold"><span>True Cost:</span><span>{fmt(calcResult.total)}</span></div>
                <div className="flex justify-between text-blue-600 font-semibold"><span>Revenue:</span><span>{fmt(calcRevenue)}</span></div>
              </div>
              <div className="border-t border-gray-300 mt-3 pt-3 space-y-1">
                <div className="flex justify-between font-bold text-base"><span>Net Profit:</span><span className={calcResult.profit >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(calcResult.profit)}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Min Price (cost x 1.1):</span><span>{fmt(calcResult.minPrice)}</span></div>
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg border-2 text-center ${calcResult.verdict === 'ACCEPT' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <div className={`text-4xl font-black ${calcResult.verdict === 'ACCEPT' ? 'text-green-600' : 'text-red-600'}`}>{calcResult.verdict}</div>
              <div className="text-sm text-gray-600 mt-1">{calcResult.verdict === 'ACCEPT' ? 'This job is profitable' : 'This job loses money'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">Profit/Loss by Tech</h3>
          <div className="h-64"><canvas ref={pnlChartRef} /></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">Overhead Breakdown ({fmt(CONFIG.MONTHLY_OVERHEAD)}/mo)</h3>
          <div className="h-64"><canvas ref={overheadChartRef} /></div>
        </div>
      </div>

      {/* Tech Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900">Technician Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tech', 'Jobs', 'Revenue', 'True Cost', 'Net Profit', 'Avg Margin'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {techPerf.map(t => {
                const profit = t.revenue - t.cost
                const margin = t.revenue > 0 ? profit / t.revenue : 0
                return (
                  <tr key={t.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{t.name}</td>
                    <td className="px-4 py-3">{t.jobs}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{fmt(t.revenue)}</td>
                    <td className="px-4 py-3">{fmt(t.cost)}</td>
                    <td className={`px-4 py-3 font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(profit)}</td>
                    <td className="px-4 py-3">{pct(margin)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakeven Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">Breakeven Analysis (1-15 jobs/week)</h3>
        <div className="h-64 mb-6"><canvas ref={breakevenChartRef} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Jobs/Week', 'Jobs/Month', 'Overhead/Job', 'Breakeven/Job'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {breakeven.map(b => (
                <tr key={b.jpw} className={b.isCurrent ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2">{b.jpw}</td>
                  <td className="px-4 py-2">{b.jpm}</td>
                  <td className="px-4 py-2">{fmt(b.perJob)}</td>
                  <td className="px-4 py-2">{fmt(b.be)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-500 mt-2">Current scenario ({CONFIG.JOBS_PER_WEEK} jobs/week) highlighted in blue.</div>
        </div>
      </div>
    </div>
  )
}
