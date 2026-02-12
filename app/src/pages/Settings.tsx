import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useToast } from '@/components/ui/Toast'
import { syncWithBackend } from '@/lib/api'
import { Save, RefreshCw, MapPin, DollarSign, Mail, Wrench } from 'lucide-react'

export default function Settings() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)

  const [form, setForm] = useState({ ...settings })

  function handleSave() {
    updateSettings(form)
    toast('Settings saved', 'success')
  }

  async function handleSync() {
    if (!form.appsScriptUrl) { toast('Set Apps Script URL first', 'warning'); return }
    setSyncing(true)
    const ok = await syncWithBackend()
    toast(ok ? 'Sync complete!' : 'Sync failed', ok ? 'success' : 'error')
    setSyncing(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Backend Connection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench size={18} className="text-blue-600" /> Backend Connection
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Apps Script Web App URL</label>
            <input
              value={form.appsScriptUrl}
              onChange={e => setForm(f => ({ ...f, appsScriptUrl: e.target.value }))}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Deploy your Apps Script as a web app and paste the URL here.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Google Maps API Key</label>
            <input
              value={form.mapsApiKey}
              onChange={e => setForm(f => ({ ...f, mapsApiKey: e.target.value }))}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync with Backend'}
          </button>
        </div>
      </div>

      {/* Depot Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-green-600" /> Depot Location
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input type="number" step="0.0001" value={form.depot.lat} onChange={e => setForm(f => ({ ...f, depot: { ...f.depot, lat: parseFloat(e.target.value) || 0 } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input type="number" step="0.0001" value={form.depot.lng} onChange={e => setForm(f => ({ ...f, depot: { ...f.depot, lng: parseFloat(e.target.value) || 0 } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Financial Constants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-amber-600" /> Financial Constants
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fuel per Mile ($)</label>
            <input type="number" step="0.01" value={form.fuelCost} onChange={e => setForm(f => ({ ...f, fuelCost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">QA Cost/Job ($)</label>
            <input type="number" step="1" value={form.qaCost} onChange={e => setForm(f => ({ ...f, qaCost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Cost/Job ($)</label>
            <input type="number" step="1" value={form.adminCost} onChange={e => setForm(f => ({ ...f, adminCost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Risk Buffer ($)</label>
            <input type="number" step="1" value={form.riskBuffer} onChange={e => setForm(f => ({ ...f, riskBuffer: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Overhead Allocation %</label>
            <input type="number" step="1" value={form.overheadAlloc} onChange={e => setForm(f => ({ ...f, overheadAlloc: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Jobs/Route</label>
            <input type="number" step="1" value={form.maxJobsPerRoute} onChange={e => setForm(f => ({ ...f, maxJobsPerRoute: parseInt(e.target.value) || 4 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Duration (hrs)</label>
            <input type="number" step="0.5" value={form.serviceDuration} onChange={e => setForm(f => ({ ...f, serviceDuration: parseFloat(e.target.value) || 2 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Workday Start Hour</label>
            <input type="number" step="1" value={form.workdayStart} onChange={e => setForm(f => ({ ...f, workdayStart: parseInt(e.target.value) || 8 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail size={18} className="text-purple-600" /> Email Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Generac Email</label>
            <input value={form.emailGenerac} onChange={e => setForm(f => ({ ...f, emailGenerac: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Info Email</label>
            <input value={form.emailInfo} onChange={e => setForm(f => ({ ...f, emailInfo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Support Email</label>
            <input value={form.emailCustomerSupport} onChange={e => setForm(f => ({ ...f, emailCustomerSupport: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Caden Email</label>
            <input value={form.emailCaden} onChange={e => setForm(f => ({ ...f, emailCaden: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Scan Frequency (min)</label>
            <input type="number" value={form.scanFrequency} onChange={e => setForm(f => ({ ...f, scanFrequency: parseInt(e.target.value) || 60 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unanswered Threshold (hrs)</label>
            <input type="number" value={form.unansweredThreshold} onChange={e => setForm(f => ({ ...f, unansweredThreshold: parseInt(e.target.value) || 24 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark cursor-pointer">
        <Save size={16} /> Save Settings
      </button>
    </div>
  )
}
