import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { calcJobCost } from '@/lib/costs'
import { fmt, pct, dateStr } from '@/lib/utils'
import { PERSONNEL, CONFIG } from '@/lib/config'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { postToBackend } from '@/lib/api'
import type { Job } from '@/lib/types'
import { Plus, Search, Download, Upload, Trash2, Edit3 } from 'lucide-react'

export default function Jobs() {
  const jobs = useStore(s => s.jobs)
  const addJob = useStore(s => s.addJob)
  const updateJob = useStore(s => s.updateJob)
  const deleteJob = useStore(s => s.deleteJob)
  const settings = useStore(s => s.settings)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  const [form, setForm] = useState({
    customer: '', city: '', state: 'TN', zip: '', priority: 'Medium' as Job['priority'],
    tech: '', type: 'Service' as Job['type'], onsite: 2, travel: 1, miles: 0,
    parts: 0, consumables: 0, revenue: 0, route: '', wcase: '', wstatus: '', notes: '',
    routeDate: '', requested: dateStr(new Date()),
  })

  const techs = useMemo(() => [...new Set(jobs.map(j => j.tech).filter(Boolean))], [jobs])

  const filtered = useMemo(() => {
    let result = [...jobs]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(j => j.customer.toLowerCase().includes(s) || j.id.toLowerCase().includes(s) || j.city.toLowerCase().includes(s))
    }
    if (statusFilter) result = result.filter(j => j.status === statusFilter)
    if (techFilter) result = result.filter(j => j.tech === techFilter)
    if (typeFilter) result = result.filter(j => j.type === typeFilter)
    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [jobs, search, statusFilter, techFilter, typeFilter])

  function openAddModal() {
    setEditingJob(null)
    setForm({
      customer: '', city: '', state: 'TN', zip: '', priority: 'Medium', tech: '',
      type: 'Service', onsite: 2, travel: 1, miles: 0, parts: 0, consumables: 0,
      revenue: 0, route: '', wcase: '', wstatus: '', notes: '',
      routeDate: '', requested: dateStr(new Date()),
    })
    setModalOpen(true)
  }

  function openEditModal(job: Job) {
    setEditingJob(job)
    setForm({
      customer: job.customer, city: job.city, state: job.state, zip: job.zip,
      priority: job.priority, tech: job.tech, type: job.type, onsite: job.onsite,
      travel: job.travel, miles: job.miles, parts: job.parts, consumables: job.consumables,
      revenue: job.revenue, route: job.route, wcase: job.wcase, wstatus: job.wstatus,
      notes: job.notes, routeDate: job.routeDate, requested: job.requested,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.customer) { toast('Customer name required', 'error'); return }

    if (editingJob) {
      updateJob(editingJob.id, { ...form })
      toast('Job updated', 'success')
    } else {
      const newJob: Job = {
        ...form,
        date: dateStr(new Date()),
        id: String(Date.now()).slice(-6),
        flags: [],
        status: 'scheduled',
      }
      addJob(newJob)

      // Sync to backend if configured
      if (settings.appsScriptUrl) {
        await postToBackend('add_job', newJob as unknown as Record<string, unknown>)
      }

      toast('Job created', 'success')
    }

    setModalOpen(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    deleteJob(id)
    toast('Job deleted', 'success')
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'akino_jobs.json'
    a.click()
  }

  function importData(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          useStore.getState().setJobs(imported)
          toast('Jobs imported', 'success')
        }
      } catch {
        toast('Import failed', 'error')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark transition-colors cursor-pointer">
          <Plus size={16} /> Add Job
        </button>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, ID, city..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select value={techFilter} onChange={e => setTechFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Techs</option>
          {techs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Types</option>
          <option value="Service">Service</option>
          <option value="Warranty">Warranty</option>
          <option value="Both">Both</option>
        </select>

        <button onClick={exportData} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer" title="Export JSON">
          <Download size={16} />
        </button>
        <label className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer" title="Import JSON">
          <Upload size={16} />
          <input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
        </label>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                {['Date', 'ID', 'Customer', 'Location', 'Tech', 'Type', 'Hours', 'Miles', 'Revenue', 'True Cost', 'Profit', 'Margin', 'Verdict', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(job => {
                const cost = calcJobCost(job)
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">{job.date}</td>
                    <td className="px-3 py-3 font-mono font-semibold">{job.id}</td>
                    <td className="px-3 py-3 font-medium">{job.customer}</td>
                    <td className="px-3 py-3 text-gray-500">{job.city}{job.city ? ', ' : ''}{job.state}</td>
                    <td className="px-3 py-3">{job.tech || '-'}</td>
                    <td className="px-3 py-3"><Badge variant={job.type === 'Service' ? 'info' : job.type === 'Warranty' ? 'warning' : 'default'}>{job.type}</Badge></td>
                    <td className="px-3 py-3 text-right">{(job.onsite + job.travel).toFixed(1)}h</td>
                    <td className="px-3 py-3 text-right">{job.miles}mi</td>
                    <td className="px-3 py-3 text-right text-blue-600 font-semibold">{fmt(job.revenue)}</td>
                    <td className="px-3 py-3 text-right">{fmt(cost.total)}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${cost.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(cost.profit)}</td>
                    <td className="px-3 py-3 text-right">{pct(cost.margin)}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={cost.profit >= 0 ? 'accept' : 'reject'}>{cost.profit >= 0 ? 'ACCEPT' : 'REJECT'}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal(job)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={14} className="px-3 py-8 text-center text-gray-500">No jobs match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingJob ? 'Edit Job' : 'Add Job'} width="700px">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
            <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job ID</label>
            <input value={form.wcase} onChange={e => setForm(f => ({ ...f, wcase: e.target.value }))} placeholder="Case #" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Technician</label>
            <select value={form.tech} onChange={e => setForm(f => ({ ...f, tech: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select Tech</option>
              {PERSONNEL.filter(p => p.role !== 'Admin' && p.name !== 'QA').map(p => <option key={p.name} value={p.name}>{p.name} (${p.loaded}/hr)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Job['type'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="Service">Service</option>
              <option value="Warranty">Warranty</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Job['priority'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {CONFIG.REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Route</label>
            <input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} placeholder="e.g. R7" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Onsite Hours</label>
            <input type="number" step="0.5" value={form.onsite} onChange={e => setForm(f => ({ ...f, onsite: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Travel Hours</label>
            <input type="number" step="0.5" value={form.travel} onChange={e => setForm(f => ({ ...f, travel: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Miles</label>
            <input type="number" value={form.miles} onChange={e => setForm(f => ({ ...f, miles: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parts $</label>
            <input type="number" step="0.01" value={form.parts} onChange={e => setForm(f => ({ ...f, parts: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Consumables $</label>
            <input type="number" step="0.01" value={form.consumables} onChange={e => setForm(f => ({ ...f, consumables: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Revenue $</label>
            <input type="number" step="0.01" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-dark cursor-pointer">{editingJob ? 'Update' : 'Create'} Job</button>
        </div>
      </Modal>
    </div>
  )
}
