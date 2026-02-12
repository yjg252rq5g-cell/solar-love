import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { WARRANTY_STATUSES, WARRANTY_STATUS_COLORS, WARRANTY_MONTHS } from '@/lib/config'
import { fmt } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { postToBackend } from '@/lib/api'
import type { WarrantyClaim } from '@/lib/types'
import type { WarrantyStatus } from '@/lib/config'
import { Plus, AlertTriangle, Clock } from 'lucide-react'

const emptyForm: Omit<WarrantyClaim, 'month'> = {
  status: 'Submitted',
  customerName: '', dateOfJob: '', caseNumber: '', techName: '',
  allottedTravel: 0, actualTravelTime: 0, distanceMileage: 0, actualMileage: 0,
  allottedTechTime: 0, actualTechTime: 0, allottedAmount: 0, adjustedAmount: 0,
  paidAmount: 0, dateCheckCut: '', svn: '', companyCost: 0, profitAmount: 0,
  lossAmount: 0, notes: '', materials: '', rmaNumber: '', goBackReason: '',
  partsOrdered: '', partsEta: '',
}

export default function Warranty() {
  const warranty = useStore(s => s.warranty)
  const addClaim = useStore(s => s.addWarrantyClaim)
  const settings = useStore(s => s.settings)
  const { toast } = useToast()

  const [selectedMonth, setSelectedMonth] = useState('January 2026')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, month: selectedMonth })

  const filtered = useMemo(() => {
    let result = warranty.filter(c => c.month === selectedMonth)
    if (statusFilter) result = result.filter(c => c.status === statusFilter)
    return result
  }, [warranty, selectedMonth, statusFilter])

  const summary = useMemo(() => {
    const total = filtered.length
    const paid = filtered.filter(c => c.status === 'Paid')
    const paidAmount = paid.reduce((s, c) => s + (c.paidAmount || 0), 0)
    const outstanding = filtered.filter(c => c.status !== 'Paid' && c.status !== 'Cancelled' && c.status !== 'Denied')
    const outstandingAmount = outstanding.reduce((s, c) => s + (c.allottedAmount || 0), 0)
    const needsAttention = filtered.filter(c => c.status === 'Needs Attention').length
    const waitingRMA = filtered.filter(c => c.status === 'Waiting RMA').length
    const waitingGoBack = filtered.filter(c => c.status === 'Waiting Go Back').length

    return { total, paidCount: paid.length, paidAmount, outstandingCount: outstanding.length, outstandingAmount, needsAttention, waitingRMA, waitingGoBack }
  }, [filtered])

  async function handleAddClaim() {
    if (!form.customerName) { toast('Customer name required', 'error'); return }

    const claim = { ...form, month: selectedMonth }
    addClaim(claim)

    if (settings.appsScriptUrl) {
      await postToBackend('add_warranty', claim as unknown as Record<string, unknown>)
    }

    toast('Warranty claim added', 'success')
    setModalOpen(false)
    setForm({ ...emptyForm, month: selectedMonth })
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Claims</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{fmt(summary.paidAmount)}</div>
          <div className="text-xs text-gray-500 mt-1">Paid ({summary.paidCount})</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{fmt(summary.outstandingAmount)}</div>
          <div className="text-xs text-gray-500 mt-1">Outstanding ({summary.outstandingCount})</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{summary.needsAttention}</div>
          <div className="text-xs text-gray-500 mt-1">Needs Attention</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{summary.waitingRMA}</div>
          <div className="text-xs text-gray-500 mt-1">Waiting RMA</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{summary.waitingGoBack}</div>
          <div className="text-xs text-gray-500 mt-1">Waiting Go Back</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => { setForm({ ...emptyForm, month: selectedMonth }); setModalOpen(true) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark cursor-pointer">
          <Plus size={16} /> Add Claim
        </button>

        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          {WARRANTY_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Statuses</option>
          {WARRANTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Alerts */}
      {(summary.needsAttention > 0 || summary.waitingRMA > 0) && (
        <div className="flex flex-wrap gap-2">
          {summary.needsAttention > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={16} /> {summary.needsAttention} claims need attention
            </div>
          )}
          {summary.waitingRMA > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <Clock size={16} /> {summary.waitingRMA} waiting for RMA
            </div>
          )}
        </div>
      )}

      {/* 20-Column Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-navy text-white">
              <tr>
                {['Status', 'Customer', 'Date', 'Case#', 'Tech', 'Allot Travel', 'Act Travel', 'Dist Miles', 'Act Miles', 'Allot Tech', 'Act Tech', 'Allot $', 'Adj $', 'Paid $', 'Check Date', 'SVN#', 'Co. Cost', 'Profit', 'Loss', 'Notes'].map(h => (
                  <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-4 py-8 text-center text-gray-500">
                    No warranty claims for {selectedMonth}. Click "Add Claim" to get started.
                  </td>
                </tr>
              ) : filtered.map((claim, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-2 py-2"><Badge color={WARRANTY_STATUS_COLORS[claim.status]}>{claim.status}</Badge></td>
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{claim.customerName}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{claim.dateOfJob}</td>
                  <td className="px-2 py-2 font-mono">{claim.caseNumber}</td>
                  <td className="px-2 py-2">{claim.techName}</td>
                  <td className="px-2 py-2 text-right">{claim.allottedTravel}</td>
                  <td className="px-2 py-2 text-right">{claim.actualTravelTime}</td>
                  <td className="px-2 py-2 text-right">{claim.distanceMileage}</td>
                  <td className="px-2 py-2 text-right">{claim.actualMileage}</td>
                  <td className="px-2 py-2 text-right">{claim.allottedTechTime}</td>
                  <td className="px-2 py-2 text-right">{claim.actualTechTime}</td>
                  <td className="px-2 py-2 text-right">{fmt(claim.allottedAmount)}</td>
                  <td className="px-2 py-2 text-right">{fmt(claim.adjustedAmount)}</td>
                  <td className="px-2 py-2 text-right text-green-600 font-semibold">{fmt(claim.paidAmount)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{claim.dateCheckCut}</td>
                  <td className="px-2 py-2">{claim.svn}</td>
                  <td className="px-2 py-2 text-right">{fmt(claim.companyCost)}</td>
                  <td className="px-2 py-2 text-right text-green-600">{fmt(claim.profitAmount)}</td>
                  <td className="px-2 py-2 text-right text-red-600">{fmt(claim.lossAmount)}</td>
                  <td className="px-2 py-2 max-w-[200px] truncate">{claim.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Claim Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Warranty Claim" width="800px">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as WarrantyStatus }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {WARRANTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
            <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Job</label>
            <input type="date" value={form.dateOfJob} onChange={e => setForm(f => ({ ...f, dateOfJob: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Case #</label>
            <input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tech Name</label>
            <input value={form.techName} onChange={e => setForm(f => ({ ...f, techName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allotted Travel</label>
            <input type="number" step="0.5" value={form.allottedTravel} onChange={e => setForm(f => ({ ...f, allottedTravel: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Actual Travel</label>
            <input type="number" step="0.5" value={form.actualTravelTime} onChange={e => setForm(f => ({ ...f, actualTravelTime: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Distance Mileage</label>
            <input type="number" value={form.distanceMileage} onChange={e => setForm(f => ({ ...f, distanceMileage: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Actual Mileage</label>
            <input type="number" value={form.actualMileage} onChange={e => setForm(f => ({ ...f, actualMileage: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allotted Tech Time</label>
            <input type="number" step="0.5" value={form.allottedTechTime} onChange={e => setForm(f => ({ ...f, allottedTechTime: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Actual Tech Time</label>
            <input type="number" step="0.5" value={form.actualTechTime} onChange={e => setForm(f => ({ ...f, actualTechTime: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allotted Amount $</label>
            <input type="number" step="0.01" value={form.allottedAmount} onChange={e => setForm(f => ({ ...f, allottedAmount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adjusted Amount $</label>
            <input type="number" step="0.01" value={form.adjustedAmount} onChange={e => setForm(f => ({ ...f, adjustedAmount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paid Amount $</label>
            <input type="number" step="0.01" value={form.paidAmount} onChange={e => setForm(f => ({ ...f, paidAmount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check Date</label>
            <input type="date" value={form.dateCheckCut} onChange={e => setForm(f => ({ ...f, dateCheckCut: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SVN#</label>
            <input value={form.svn} onChange={e => setForm(f => ({ ...f, svn: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Cost $</label>
            <input type="number" step="0.01" value={form.companyCost} onChange={e => setForm(f => ({ ...f, companyCost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">RMA #</label>
            <input value={form.rmaNumber || ''} onChange={e => setForm(f => ({ ...f, rmaNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Materials</label>
            <input value={form.materials || ''} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Go-Back Reason</label>
            <input value={form.goBackReason || ''} onChange={e => setForm(f => ({ ...f, goBackReason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parts Ordered</label>
            <input value={form.partsOrdered || ''} onChange={e => setForm(f => ({ ...f, partsOrdered: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parts ETA</label>
            <input type="date" value={form.partsEta || ''} onChange={e => setForm(f => ({ ...f, partsEta: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={handleAddClaim} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark cursor-pointer">Add Claim</button>
        </div>
      </Modal>
    </div>
  )
}
