import { useEffect, useRef, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { calcJobCost } from '@/lib/costs'
import { fmt, pct, dateStr } from '@/lib/utils'
import { CONFIG, OVERHEAD_CATEGORIES } from '@/lib/config'
import { KpiCard } from '@/components/ui/KpiCard'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function Dashboard() {
  const jobs = useStore(s => s.jobs)
  const revenueChartRef = useRef<HTMLCanvasElement>(null)
  const statusChartRef = useRef<HTMLCanvasElement>(null)
  const overheadChartRef = useRef<HTMLCanvasElement>(null)
  const chartInstances = useRef<Record<string, Chart>>({})

  const stats = useMemo(() => {
    const today = dateStr(new Date())
    const todayJobs = jobs.filter(j => j.date === today)
    const highPriority = jobs.filter(j => j.priority === 'High' && j.status !== 'completed')
    const needsScheduling = jobs.filter(j => !j.tech || j.status === 'scheduled')
    const activeTechs = new Set(jobs.filter(j => j.status === 'in-progress').map(j => j.tech)).size
    const allRevenue = jobs.reduce((sum, j) => sum + (j.revenue || 0), 0)
    const allCosts = jobs.reduce((sum, j) => sum + calcJobCost(j).total, 0)
    const profit = allRevenue - allCosts
    const margin = allRevenue > 0 ? profit / allRevenue : 0
    const completed = jobs.filter(j => j.status === 'completed').length

    const revenueByTech: Record<string, number> = {}
    const costByTech: Record<string, number> = {}
    jobs.forEach(j => {
      if (j.tech) {
        revenueByTech[j.tech] = (revenueByTech[j.tech] || 0) + (j.revenue || 0)
        costByTech[j.tech] = (costByTech[j.tech] || 0) + calcJobCost(j).total
      }
    })

    const statusCounts = { 'in-progress': 0, scheduled: 0, completed: 0 }
    jobs.forEach(j => {
      const s = j.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    })

    return { todayJobs, highPriority, needsScheduling, activeTechs, allRevenue, allCosts, profit, margin, completed, revenueByTech, costByTech, statusCounts }
  }, [jobs])

  useEffect(() => {
    // Cleanup old charts
    Object.values(chartInstances.current).forEach(c => c.destroy())
    chartInstances.current = {}

    // Revenue by Tech
    if (revenueChartRef.current) {
      const techs = Object.keys(stats.revenueByTech)
      chartInstances.current.revenue = new Chart(revenueChartRef.current, {
        type: 'bar',
        data: {
          labels: techs,
          datasets: [
            { label: 'Revenue', data: techs.map(t => stats.revenueByTech[t]), backgroundColor: '#2563eb', borderRadius: 4 },
            { label: 'True Cost', data: techs.map(t => stats.costByTech[t] || 0), backgroundColor: '#dc2626', borderRadius: 4 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } },
      })
    }

    // Status doughnut
    if (statusChartRef.current) {
      chartInstances.current.status = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['In Progress', 'Scheduled', 'Completed'],
          datasets: [{ data: [stats.statusCounts['in-progress'], stats.statusCounts.scheduled, stats.statusCounts.completed], backgroundColor: ['#f59e0b', '#3b82f6', '#16a34a'] }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      })
    }

    // Overhead doughnut
    if (overheadChartRef.current) {
      const cats = Object.keys(OVERHEAD_CATEGORIES)
      const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#16a34a', '#10b981', '#34d399', '#6ee7b7']
      chartInstances.current.overhead = new Chart(overheadChartRef.current, {
        type: 'doughnut',
        data: {
          labels: cats,
          datasets: [{ data: cats.map(c => OVERHEAD_CATEGORIES[c]), backgroundColor: colors }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      })
    }

    return () => {
      Object.values(chartInstances.current).forEach(c => c.destroy())
    }
  }, [stats])

  const recent = [...jobs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  // Alerts
  const alerts: { msg: string; type: 'warning' | 'error' | 'info' }[] = []
  const unassigned = jobs.filter(j => !j.tech && j.status !== 'completed')
  if (unassigned.length > 0) alerts.push({ msg: `${unassigned.length} jobs without assigned technician`, type: 'warning' })
  const staleClaims = jobs.filter(j => j.wstatus && !['Paid', 'Cancelled', 'Denied'].includes(j.wstatus))
  if (staleClaims.length > 0) alerts.push({ msg: `${staleClaims.length} warranty claims need attention`, type: 'error' })
  if (stats.profit < 0) alerts.push({ msg: `Overall P&L is negative: ${fmt(stats.profit)}`, type: 'error' })

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Today's Jobs" value={String(stats.todayJobs.length)} color="#2563eb" bgColor="#f0f9ff" />
        <KpiCard label="High Priority" value={String(stats.highPriority.length)} color="#dc2626" bgColor="#fef2f2" />
        <KpiCard label="Needs Scheduling" value={String(stats.needsScheduling.length)} color="#f59e0b" bgColor="#fffbeb" />
        <KpiCard label="Active Techs" value={String(stats.activeTechs)} color="#a855f7" bgColor="#f3e8ff" />
        <KpiCard label="Completed Jobs" value={String(stats.completed)} color="#16a34a" bgColor="#f0fdf4" />
        <KpiCard label="Total Jobs" value={String(jobs.length)} color="#6366f1" bgColor="#f5f3ff" />
      </div>

      {/* Revenue / Cost / Profit summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5">
          <div className="text-sm opacity-80">Total Revenue</div>
          <div className="text-3xl font-bold mt-1">{fmt(stats.allRevenue)}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-5">
          <div className="text-sm opacity-80">Total True Cost</div>
          <div className="text-3xl font-bold mt-1">{fmt(stats.allCosts)}</div>
        </div>
        <div className={`bg-gradient-to-br ${stats.profit >= 0 ? 'from-green-500 to-green-600' : 'from-red-600 to-red-700'} text-white rounded-xl p-5`}>
          <div className="text-sm opacity-80">Net Profit ({pct(stats.margin)})</div>
          <div className="text-3xl font-bold mt-1">{fmt(stats.profit)}</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`px-4 py-3 rounded-lg text-sm font-medium ${a.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : a.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">Revenue vs True Cost by Tech</h3>
          <div className="h-64"><canvas ref={revenueChartRef} /></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">Job Status</h3>
              <div className="h-48"><canvas ref={statusChartRef} /></div>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">Overhead Breakdown</h3>
              <div className="h-48"><canvas ref={overheadChartRef} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recent.map(job => {
            const cost = calcJobCost(job)
            return (
              <div key={job.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{job.customer}</div>
                  <div className="text-xs text-gray-500">{job.date} &bull; {job.city}{job.city ? ', ' : ''}{job.state} &bull; {job.tech || 'Unassigned'}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 font-semibold text-sm">{fmt(job.revenue)}</div>
                  <div className={`text-xs font-bold ${cost.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cost.profit >= 0 ? 'ACCEPT' : 'REJECT'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
