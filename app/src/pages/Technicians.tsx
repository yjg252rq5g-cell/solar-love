import { useMemo, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { calcJobCost } from '@/lib/costs'
import { fmt, pct } from '@/lib/utils'
import { PERSONNEL } from '@/lib/config'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default function Technicians() {
  const jobs = useStore(s => s.jobs)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const techStats = useMemo(() => {
    return PERSONNEL.map(person => {
      const personJobs = jobs.filter(j => j.tech === person.name)
      const revenue = personJobs.reduce((s, j) => s + (j.revenue || 0), 0)
      const cost = personJobs.reduce((s, j) => s + calcJobCost(j).total, 0)
      const profit = revenue - cost
      const margin = revenue > 0 ? profit / revenue : 0
      const totalHours = personJobs.reduce((s, j) => s + j.onsite + j.travel, 0)
      const totalMiles = personJobs.reduce((s, j) => s + (j.miles || 0), 0)
      const acceptRate = personJobs.length > 0
        ? personJobs.filter(j => calcJobCost(j).profit >= 0).length / personJobs.length
        : 0

      const monthlyPay = person.loaded * 173.33
      const annualPay = monthlyPay * 12

      return { ...person, jobCount: personJobs.length, revenue, cost, profit, margin, totalHours, totalMiles, acceptRate, monthlyPay, annualPay }
    })
  }, [jobs])

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy()
    if (!chartRef.current) return

    const activeTechs = techStats.filter(t => t.jobCount > 0)
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: activeTechs.map(t => t.name),
        datasets: [
          { label: 'Jobs', data: activeTechs.map(t => t.jobCount), backgroundColor: '#2563eb', borderRadius: 4 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    })

    return () => { chartInstance.current?.destroy() }
  }, [techStats])

  return (
    <div className="space-y-6">
      {/* Workload Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">Technician Workload</h3>
        <div className="h-56"><canvas ref={chartRef} /></div>
      </div>

      {/* Tech Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {techStats.map(tech => (
          <div key={tech.name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{tech.name}</div>
                <div className="text-xs text-gray-500">{tech.role}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">{fmt(tech.loaded)}/hr</div>
                <div className="text-xs text-gray-400">loaded rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Jobs</div>
                <div className="text-lg font-bold">{tech.jobCount}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Hours</div>
                <div className="text-lg font-bold">{tech.totalHours.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Revenue</div>
                <div className="text-lg font-bold text-blue-600">{fmt(tech.revenue)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Profit</div>
                <div className={`text-lg font-bold ${tech.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(tech.profit)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Miles</div>
                <div className="text-lg font-bold">{tech.totalMiles.toFixed(0)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Accept Rate</div>
                <div className={`text-lg font-bold ${tech.acceptRate >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>{pct(tech.acceptRate)}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Hourly:</span> <strong>{fmt(tech.hourly)}</strong></div>
              <div><span className="text-gray-500">Loaded:</span> <strong>{fmt(tech.loaded)}</strong></div>
              <div><span className="text-gray-500">Monthly:</span> <strong>{fmt(tech.monthlyPay)}</strong></div>
              <div><span className="text-gray-500">Annual:</span> <strong>{fmt(tech.annualPay)}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900">Personnel Rates & Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                {['Name', 'Role', 'Hourly', 'Loaded', 'Monthly Pay', 'Annual Pay', 'Jobs', 'Revenue', 'Profit', 'Margin'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {techStats.map(t => (
                <tr key={t.name} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-semibold">{t.name}</td>
                  <td className="px-3 py-3 text-gray-500">{t.role}</td>
                  <td className="px-3 py-3">{fmt(t.hourly)}</td>
                  <td className="px-3 py-3 text-blue-600 font-semibold">{fmt(t.loaded)}</td>
                  <td className="px-3 py-3">{fmt(t.monthlyPay)}</td>
                  <td className="px-3 py-3">{fmt(t.annualPay)}</td>
                  <td className="px-3 py-3 text-center">{t.jobCount}</td>
                  <td className="px-3 py-3 text-blue-600 font-semibold">{fmt(t.revenue)}</td>
                  <td className={`px-3 py-3 font-semibold ${t.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(t.profit)}</td>
                  <td className="px-3 py-3">{pct(t.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
