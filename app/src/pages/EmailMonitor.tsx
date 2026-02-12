import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Mail, AlertTriangle, RefreshCw, CheckCircle, Clock, Inbox } from 'lucide-react'

const EMAIL_ACCOUNTS = [
  { email: 'generac@akinosolar.com', label: 'Generac Warranty', icon: '🔧' },
  { email: 'info@akinosolar.com', label: 'General Info', icon: '📧' },
  { email: 'customersupport@akinosolar.com', label: 'Customer Support', icon: '🎧' },
  { email: 'caden@akinosolar.com', label: 'Caden (Owner)', icon: '👤' },
]

const CATEGORIES = [
  { name: 'Warranty Updates', color: '#2563eb', count: 0 },
  { name: 'RMA Approvals/Denials', color: '#16a34a', count: 0 },
  { name: 'Payment Notifications', color: '#f59e0b', count: 0 },
  { name: 'Customer Inquiries', color: '#a855f7', count: 0 },
  { name: 'Support Requests', color: '#dc2626', count: 0 },
]

export default function EmailMonitor() {
  const settings = useStore(s => s.settings)
  const [scanning, setScanning] = useState(false)

  function handleScan() {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
    }, 2000)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Email Monitor</h2>
          <p className="text-sm text-gray-500">Scan all 4 Google Workspace accounts for action items</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {/* Priority Flag */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
        <div>
          <div className="font-semibold text-amber-800 text-sm">NO CUSTOMER LEFT UNANSWERED OR UNRESOLVED</div>
          <div className="text-xs text-amber-600 mt-0.5">All emails older than {settings.unansweredThreshold}h without response will be flagged.</div>
        </div>
      </div>

      {/* Email Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMAIL_ACCOUNTS.map(account => (
          <div key={account.email} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{account.icon}</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{account.label}</div>
                <div className="text-xs text-gray-500">{account.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="text-green-500" />
              <span className="text-green-600">Connected</span>
              <span className="text-gray-400 ml-auto">Last scan: --</span>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4">Email Categories</h3>
        <div className="space-y-3">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm font-medium flex-1">{cat.name}</span>
              <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Email Feed */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Recent Emails</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            Scan frequency: {settings.scanFrequency} min
          </div>
        </div>
        <div className="p-8 text-center">
          <Inbox size={48} className="text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500 text-sm">No emails scanned yet.</div>
          <div className="text-gray-400 text-xs mt-1">
            {settings.appsScriptUrl
              ? 'Click "Scan Now" to check all accounts.'
              : 'Configure Apps Script URL in Settings to enable email monitoring.'}
          </div>
        </div>
      </div>

      {/* Auto-Action Log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900">Auto-Action Log</h3>
        </div>
        <div className="p-8 text-center text-gray-400 text-sm">
          No actions recorded yet. Email scanning will populate suggested actions here.
        </div>
      </div>
    </div>
  )
}
