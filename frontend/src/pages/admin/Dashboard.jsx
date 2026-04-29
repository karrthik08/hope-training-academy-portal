import React, { useEffect, useState } from 'react'
import { getAllTrainings, approveTraining, publishTraining, getAuditLogs, getCompletionReport, updateTraining } from '../../api/client'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [trainings, setTrainings] = useState([])
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('approvals')
  const [loading, setLoading] = useState(true)
  const [reportTrainingId, setReportTrainingId] = useState('')
  const [reportData, setReportData] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [editingPrice, setEditingPrice] = useState({})
  const [searchQuery, setSearchQuery] = useState('') 
  const [filterCategory, setFilterCategory] = useState('')
  
  useEffect(() => { load() }, [])
  
  const load = async () => {
    setLoading(true)
    try {
      const [t, l] = await Promise.all([getAllTrainings(), getAuditLogs()])
      setTrainings(t)
      setLogs(l)
      // Initialize price editing state
      const priceState = {}
      t.forEach(training => {
        priceState[training.id] = training.price || 0
      })
      setEditingPrice(priceState)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const updatePrice = async (trainingId) => {
    try {
      await updateTraining(trainingId, { price: parseFloat(editingPrice[trainingId]) || 0 })
      alert('Price updated!')
      await load()
    } catch(e) {
      alert('Failed to update price: ' + (e.response?.data?.detail || e.message))
    }
  }

  const approve = async (id) => { 
    try { await approveTraining(id); await load() } 
    catch(e) { alert(e.response?.data?.detail) } 
  }
  
  const publish = async (id) => { 
    try { await publishTraining(id); await load() } 
    catch(e) { alert(e.response?.data?.detail) } 
  }

  const badge = (s) => {
    const b = { 
      draft: 'bg-yellow-100 text-yellow-700', 
      submitted: 'bg-purple-100 text-purple-700', 
      approved: 'bg-blue-100 text-blue-700', 
      published: 'bg-green-100 text-green-700' 
    }
    return b[s] || 'bg-gray-100 text-gray-600'
  }

  const loadReport = async () => {
    if (!reportTrainingId) return
    setReportLoading(true); setReportError(''); setReportData([])
    try {
      const data = await getCompletionReport(reportTrainingId)
      setReportData(data)
      if (data.length === 0) setReportError('No completions found.')
    } catch(e) { setReportError('Failed to load report.') }
    finally { setReportLoading(false) }
  }

  const exportCSV = () => {
    if (!reportData.length) return
    const headers = ['Participant', 'Cert ID', 'Completed', 'Code']
    const rows = reportData.map(r => [
      r.participant_name || '—', 
      r.certificate_id || '—', 
      r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—', 
      r.verification_code || '—'
    ])
    const csv = [headers, ...rows].map(r => r.map(v => '"'+v+'"').join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'completions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const pending = trainings.filter(t => t.status === 'draft' || t.status === 'approved')
  const submitted = trainings.filter(t => t.status === 'submitted')

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/admin/metrics" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
            📊 View Metrics
          </Link>
          <Link to="/admin/course-review" className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium">
            📋 Review Courses ({submitted.length})
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Pending', pending.length, 'text-purple-600'], 
          ['Approved', trainings.filter(t => t.status === 'approved').length, 'text-blue-600'], 
          ['Published', trainings.filter(t => t.status === 'published').length, 'text-green-600']
        ].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={'text-3xl font-bold '+c}>{v}</div>
            <div className="text-xs text-gray-500 mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[
          ['approvals','Approvals'],
          ['all','All'],
          ['reports','Reports'],
          ['logs','Logs']
        ].map(([k,v]) => (
          <button 
            key={k} 
            onClick={() => setTab(k)} 
            className={'px-4 py-2 rounded text-sm font-medium '+(tab===k?'bg-blue-600 text-white':'bg-white border text-gray-600')}
          >
            {v}
          </button>
        ))}
      </div>

      {/* APPROVALS TAB */}
      {tab === 'approvals' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {pending.length === 0 ? (
            <p className="text-center py-12 text-gray-400">Nothing pending.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price (USD)</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 border rounded px-2 py-1 text-sm"
                          value={editingPrice[t.id] || 0}
                          onChange={(e) => setEditingPrice({
                            ...editingPrice,
                            [t.id]: parseFloat(e.target.value) || 0
                          })}
                        />
                        <button
                          onClick={() => updatePrice(t.id)}
                          className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                        >
                          Set
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={'px-2 py-1 rounded-full text-xs font-medium '+badge(t.status)}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'draft' && (
                        <button 
                          onClick={() => approve(t.id)} 
                          className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                      {t.status === 'approved' && (
                        <button 
                          onClick={() => publish(t.id)} 
                          className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ALL TAB */}
{/* ALL TAB */}
{tab === 'all' && (
  <div>
    {/* Search and Filter Bar */}
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full border rounded px-3 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-64">
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Peer Support Specialist">Peer Support Specialist</option>
            <option value="Prevention & Youth Education">Prevention & Youth Education</option>
            <option value="Peer Recovery & Coaching">Peer Recovery & Coaching</option>
            <option value="Workforce Development">Workforce Development</option>
            <option value="Leadership & Management">Leadership & Management</option>
          </select>
        </div>
        {(searchQuery || filterCategory) && (
          <button
            onClick={() => { setSearchQuery(''); setFilterCategory('') }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        )}
      </div>
    </div>

    {/* Courses Table */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Price (USD)</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {trainings
            .filter(t => {
              const matchesSearch = !searchQuery || 
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
              const matchesCategory = !filterCategory || t.category === filterCategory
              return matchesSearch && matchesCategory
            })
            .map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 border rounded px-2 py-1 text-sm"
                      value={editingPrice[t.id] || 0}
                      onChange={(e) => setEditingPrice({
                        ...editingPrice,
                        [t.id]: parseFloat(e.target.value) || 0
                      })}
                    />
                    <button
                      onClick={() => updatePrice(t.id)}
                      className="bg-gray-600 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                    >
                      Set
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={'px-2 py-1 rounded-full text-xs font-medium '+badge(t.status)}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {trainings.filter(t => {
        const matchesSearch = !searchQuery || 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesCategory = !filterCategory || t.category === filterCategory
        return matchesSearch && matchesCategory
      }).length === 0 && (
        <div className="text-center py-12 text-gray-400">No courses found</div>
      )}
    </div>
  </div>
)}

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        <div>
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Completions Report</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Select Training</label>
                <select 
                  className="w-full border rounded px-3 py-2 text-sm" 
                  value={reportTrainingId} 
                  onChange={e => { 
                    setReportTrainingId(e.target.value); 
                    setReportData([]); 
                    setReportError('') 
                  }}
                >
                  <option value="">Choose...</option>
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={loadReport} 
                disabled={!reportTrainingId || reportLoading} 
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
              >
                {reportLoading ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>
          
          {reportError && <p className="text-center py-6 text-gray-400">{reportError}</p>}
          
          {reportData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                <span className="text-sm font-medium">{reportData.length} completions</span>
                <button 
                  onClick={exportCSV} 
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700"
                >
                  ⬇ CSV
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Participant</th>
                    <th className="px-4 py-3 text-left">Cert ID</th>
                    <th className="px-4 py-3 text-left">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((r,i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{r.participant_name || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.certificate_id || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">No logs</td>
                </tr>
              ) : (
                logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize">{l.action}</td>
                    <td className="px-4 py-3 text-gray-500">{l.entity_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}