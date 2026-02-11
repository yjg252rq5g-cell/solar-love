import { useMemo, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { calcJobCost } from '@/lib/costs'
import { fmt, pct } from '@/lib/utils'
import { ROUTES_DATA } from '@/lib/config'
import { Badge } from '@/components/ui/Badge'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function Routes() {
  const jobs = useStore(s => s.jobs)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const routeStats = useMemo(() => {
    return ROUTES_DATA.map(route => {
      const routeJobs = jobs.filter(j => j.route === route.id)
      const revenue = routeJobs.reduce((s, j) => s + (j.revenue || 0), 0)
      const cost = routeJobs.reduce((s, j) => s + calcJobCost(j).total, 0)
      const profit = revenue - cost
      const jobCount = routeJobs.length
      const perJob = jobCount > 0 ? revenue / jobCount : 0
      const perMile = route.miles > 0 ? revenue / route.miles : 0

      return { ...route, routeJobs, revenue, cost, profit, jobCount, perJob, perMile }
    }).filter(r => r.jobCount > 0 || r.val > 0)
  }, [jobs])

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy()
    if (!chartRef.current) return

    const labels = routeStats.map(r => r.id)
    const profits = routeStats.map(r => r.profit)

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Profit/Loss',
          data: profits,
          backgroundColor: profits.map(p => p >= 0 ? '#16a34a' : '#dc2626'),
          borderRadius: 4,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    })

    return () => { chartInstance.current?.destroy() }
  }, [routeStats])

  const totals = useMemo(() => ({
    jobs: routeStats.reduce((s, r) => s + r.jobCount, 0),
    miles: routeStats.reduce((s, r) => s + r.miles, 0),
    revenue: routeStats.reduce((s, r) => s + r.revenue, 0),
    cost: routeStats.reduce((s, r) => s + r.cost, 0),
    profit: routeStats.reduce((s, r) => s + r.profit, 0),
  }), [routeStats])

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Routes</div>
          <div className="text-2xl font-bold mt-1">{routeStats.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Jobs</div>
          <div className="text-2xl font-bold mt-1">{totals.jobs}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Miles</div>
          <div className="text-2xl font-bold mt-1">{totals.miles.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Total Revenue</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{fmt(totals.revenue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase font-medium">Net Profit</div>
          <div className={`text-2xl font-bold mt-1 ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totals.profit)}</div>
        </div>
      </div>

      {/* Revenue by Route chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">Revenue by Route</h3>
        <div className="h-64"><canvas ref={chartRef} /></div>
      </div>

      {/* Route cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routeStats.map(route => (
          <div key={route.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-lg font-bold text-gray-900">{route.id}</div>
                <div className="text-xs text-gray-500 mt-0.5">{route.jobCount} jobs &bull; {route.miles.toFixed(1)} miles &bull; {Math.floor(route.min / 60)}h {route.min % 60}m drive</div>
              </div>
              <Badge variant={route.profit >= 0 ? 'accept' : 'reject'}>{route.profit >= 0 ? 'PROFITABLE' : 'LOSS'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Revenue:</span> <span className="text-blue-600 font-semibold">{fmt(route.revenue)}</span></div>
              <div><span className="text-gray-500">Cost:</span> <span className="text-red-600 font-semibold">{fmt(route.cost)}</span></div>
              <div><span className="text-gray-500">Profit:</span> <span className={`font-semibold ${route.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(route.profit)}</span></div>
              <div><span className="text-gray-500">$/Job:</span> <span className="font-semibold">{fmt(route.perJob)}</span></div>
              <div><span className="text-gray-500">$/Mile:</span> <span className="font-semibold">{fmt(route.perMile)}</span></div>
              <div><span className="text-gray-500">Margin:</span> <span className="font-semibold">{route.revenue > 0 ? pct(route.profit / route.revenue) : '0%'}</span></div>
            </div>
            {route.routeJobs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-1">Jobs:</div>
                {route.routeJobs.map(j => (
                  <div key={j.id} className="text-xs text-gray-600 flex justify-between py-0.5">
                    <span>{j.customer}</span>
                    <span className="font-medium">{fmt(j.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Performance table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900">Route Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Route', 'Jobs', 'Miles', 'Drive Time', 'Revenue', '$/Job', '$/Mile', 'Cost', 'Profit', 'Verdict'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routeStats.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-bold">{r.id}</td>
                  <td className="px-3 py-3">{r.jobCount}</td>
                  <td className="px-3 py-3">{r.miles.toFixed(1)}</td>
                  <td className="px-3 py-3">{Math.floor(r.min / 60)}h {r.min % 60}m</td>
                  <td className="px-3 py-3 text-blue-600 font-semibold">{fmt(r.revenue)}</td>
                  <td className="px-3 py-3">{fmt(r.perJob)}</td>
                  <td className="px-3 py-3">{fmt(r.perMile)}</td>
                  <td className="px-3 py-3">{fmt(r.cost)}</td>
                  <td className={`px-3 py-3 font-semibold ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.profit)}</td>
                  <td className="px-3 py-3"><Badge variant={r.profit >= 0 ? 'accept' : 'reject'}>{r.profit >= 0 ? 'ACCEPT' : 'REJECT'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
