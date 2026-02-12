import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useToast } from '@/components/ui/Toast'
import { postToBackend } from '@/lib/api'
import { Zap, MapPin, Plus, RefreshCw, Compass } from 'lucide-react'

export default function Optimize() {
  const settings = useStore(s => s.settings)
  const { toast } = useToast()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const [fitAddress, setFitAddress] = useState('')
  const [fitResult, setFitResult] = useState('')

  const [addCustomer, setAddCustomer] = useState('')
  const [addAddress, setAddAddress] = useState('')
  const [addRouteId, setAddRouteId] = useState('')

  async function handleOptimize() {
    if (!settings.appsScriptUrl) { toast('Set Apps Script URL in Settings first', 'warning'); return }
    if (!startDate || !endDate) { toast('Select date range', 'warning'); return }

    setOptimizing(true)
    toast('Optimizing routes...', 'info')

    const result = await postToBackend('optimize_routes', { startDate, endDate })
    if (result) {
      toast('Routes optimized!', 'success')
    } else {
      toast('Optimization requires backend connection', 'error')
    }
    setOptimizing(false)
  }

  async function handleGeocode() {
    if (!settings.appsScriptUrl) { toast('Set Apps Script URL in Settings first', 'warning'); return }
    setGeocoding(true)
    toast('Geocoding backlog...', 'info')

    const result = await postToBackend('geocode_backlog', {})
    if (result) {
      toast('Geocoding complete!', 'success')
    } else {
      toast('Geocoding requires backend connection', 'error')
    }
    setGeocoding(false)
  }

  async function handleFindBestFit() {
    if (!fitAddress) { toast('Enter an address', 'warning'); return }
    if (!settings.appsScriptUrl) { setFitResult('Requires backend connection'); return }

    const result = await postToBackend('find_best_fit', { address: fitAddress })
    if (result?.route) {
      setFitResult(`Best fit: Route ${result.route} (${result.distance} miles from nearest stop)`)
    } else {
      setFitResult('No suitable route found (connect to backend for live results)')
    }
  }

  async function handleAddToRoute() {
    if (!addCustomer || !addAddress || !addRouteId) { toast('Fill all fields', 'warning'); return }
    if (!settings.appsScriptUrl) { toast('Requires backend connection', 'warning'); return }

    const result = await postToBackend('add_job_to_route', { customer: addCustomer, address: addAddress, routeId: addRouteId })
    if (result) {
      toast(`Added ${addCustomer} to ${addRouteId}`, 'success')
      setAddCustomer(''); setAddAddress(''); setAddRouteId('')
    } else {
      toast('Failed to add job to route', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* How It Works */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">How Route Optimization Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Collect Jobs', desc: 'Gather all unassigned jobs in the date range with GPS coordinates' },
            { step: 2, title: 'Cluster', desc: 'Group jobs by geographic proximity (max 4 jobs per route)' },
            { step: 3, title: 'Sequence', desc: 'Order stops within each route to minimize total drive time' },
            { step: 4, title: 'Assign & Calculate', desc: 'Assign techs, calculate P&L, and generate route summaries' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">{s.step}</div>
              <div className="font-semibold text-sm text-gray-900">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimize Routes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-blue-600" /> Optimize Routes
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <Zap size={16} /> {optimizing ? 'Optimizing...' : 'Optimize Routes'}
          </button>
          <button
            onClick={handleGeocode}
            disabled={geocoding}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={geocoding ? 'animate-spin' : ''} /> Force Geocode Backlog
          </button>
        </div>
      </div>

      {/* Find Best Fit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Compass size={18} className="text-green-600" /> Find Best Fit for Job
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Address</label>
            <input
              value={fitAddress} onChange={e => setFitAddress(e.target.value)}
              placeholder="Enter full address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button onClick={handleFindBestFit} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 cursor-pointer">
            <MapPin size={16} /> Find Best Route
          </button>
        </div>
        {fitResult && (
          <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {fitResult}
          </div>
        )}
      </div>

      {/* Add Job to Route */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-purple-600" /> Add Job to Route
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
            <input value={addCustomer} onChange={e => setAddCustomer(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input value={addAddress} onChange={e => setAddAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Route ID</label>
            <input value={addRouteId} onChange={e => setAddRouteId(e.target.value)} placeholder="e.g. R7" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <button onClick={handleAddToRoute} className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 cursor-pointer">
          <Plus size={16} /> Add to Route
        </button>
      </div>

      {!settings.appsScriptUrl && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Configure your Apps Script URL in Settings to enable live route optimization.
        </div>
      )}
    </div>
  )
}
