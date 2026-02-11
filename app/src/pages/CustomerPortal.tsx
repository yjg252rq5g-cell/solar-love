import { useState } from 'react'
import { useStore } from '@/lib/store'
import { fmt } from '@/lib/utils'
import { calcJobCost } from '@/lib/costs'
import { Search, MapPin, Star, Bell } from 'lucide-react'
import type { Job } from '@/lib/types'

export default function CustomerPortal() {
  const jobs = useStore(s => s.jobs)
  const [email, setEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [customerJobs, setCustomerJobs] = useState<Job[]>([])

  function handleLookup() {
    const name = customerName.toLowerCase()
    const found = jobs.filter(j =>
      j.customer.toLowerCase().includes(name) ||
      j.id === customerName
    )
    setCustomerJobs(found)
    if (found.length > 0) {
      setLoggedIn(true)
    }
  }

  const statusTimeline = (status: string) => {
    const steps = ['scheduled', 'in-progress', 'completed']
    const currentIdx = steps.indexOf(status)
    return steps.map((step, idx) => ({
      label: step.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      active: idx <= currentIdx,
      current: idx === currentIdx,
    }))
  }

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl text-blue-600 mb-4">
            <Search size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Customer Portal</h2>
          <p className="text-sm text-gray-500 mt-1">Track your service jobs and warranty claims</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name or Job ID</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Enter your name or job ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleLookup}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 cursor-pointer"
          >
            Look Up My Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Welcome, {customerJobs[0]?.customer}</h2>
          <p className="text-sm text-gray-500">{customerJobs.length} job(s) found</p>
        </div>
        <button onClick={() => { setLoggedIn(false); setCustomerJobs([]) }} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
          Lookup Another
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <Bell size={20} className="text-blue-500 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">Notification Preferences</div>
          <div className="text-xs text-blue-600 mt-0.5">Get updates via email or SMS when your job status changes.</div>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" className="rounded" defaultChecked /> Email
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" className="rounded" /> SMS
          </label>
        </div>
      </div>

      {/* Job Cards */}
      {customerJobs.map(job => {
        const cost = calcJobCost(job)
        const timeline = statusTimeline(job.status)

        return (
          <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-base font-bold text-gray-900">Job #{job.id}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {job.date} &bull; {job.city}{job.city ? ', ' : ''}{job.state}
                  {job.tech && <span> &bull; Tech: {job.tech}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{fmt(job.revenue)}</div>
                <div className="text-xs text-gray-500">{job.type}</div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="flex items-center gap-2 mb-4">
              {timeline.map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="text-xs font-medium" style={{ color: step.active ? '#2563eb' : '#9ca3af' }}>{step.label}</div>
                  {idx < timeline.length - 1 && (
                    <div className={`flex-1 h-0.5 ${step.active ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Status</div>
                <div className="font-bold mt-0.5 capitalize">{job.status.replace('-', ' ')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500">Priority</div>
                <div className="font-bold mt-0.5">{job.priority}</div>
              </div>
              {job.route && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">Route</div>
                  <div className="font-bold mt-0.5">{job.route}</div>
                </div>
              )}
              {job.notes && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">Notes</div>
                  <div className="font-bold mt-0.5">{job.notes}</div>
                </div>
              )}
            </div>

            {/* Feedback */}
            {job.status === 'completed' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-600 mb-2">Rate your experience:</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} className="text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer">
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
