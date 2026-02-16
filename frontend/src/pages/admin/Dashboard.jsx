import React, { useEffect, useState } from 'react'
import { getAllTrainings, approveTraining, publishTraining, getAuditLogs, getCompletionReport } from '../../api/client'

export default function AdminDashboard() {
  const [trainings, setTrainings]         = useState([])
  const [logs, setLogs]                   = useState([])
  const [tab, setTab]                     = useState('approvals')
  const [loading, setLoading]             = useState(true)
  const [reportTrainingId, setReportTrainingId] = useState('')
  const [reportData, setReportData]       = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError]     = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [t, l] = await Promise.all([getAllTrainings(), getAuditLogs()])
      setTrainings(t)
      setLogs(l)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const approve = async (id) => { try { await approveTraining(id); await load() } catch(e) { alert(e.response?.data?.detail) } }
  const publish = async (id) => { try { await publishTraining(id); await load() } catch(e) { alert(e.response?.data?.detail) } }

  const badge = (s) => ({
    draft:     'bg-yellow-100 text-yellow-700',
    approved:  'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  }[s] || 'bg-gray-100 text-gray-600')

  const loadReport = async () => {
    if (!reportTrainingId) return
    setReportLoading(true)
    setReportError('')
    setReportData([])
    try {
      const data = await getCompletionReport(reportTrainingId)
      setReportData(data)
      if (data.length === 0) setReportError('No completions found for this training.')
    } catch(e) {
      setReportError('Failed to load report.')
    } finally {
      setReportLoading(false)
    }
  }

  const exportCSV = () => {
    if (!reportData.length) return
    const training = trainings.find(t => t.id === reportTrainingId)
    const headers = ['Participant Name', 'Certificate ID', 'Completed At', 'Verification Code']
    const rows = reportData.map(r => [
      r.participant_name || r.user_id || '—',
      r.certificate_id || '—',
      r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
      r.verification_code || '—',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `completions-${training?.title || reportTrainingId}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    if (!reportData.length) return
    const training = trainings.find(t => t.id === reportTrainingId)
    const printWindow = window.open('', '_blank')
    const rows = reportData.map(r => `
      <tr>
        <td>${r.participant_name || r.user_id || '—'}</td>
        <td>${r.certificate_id || '—'}</td>
        <td>${r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
        <td style="font-family:monospace;font-size:11px">${r.verification_code || '—'}</td>
      </tr>`).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Completions Report</title>
        <style>
          body { font-family: Georgia, serif; padding: 40px; color: #111; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 22px; color: #2563eb; margin: 0 0 4px; }
          .header p { font-size: 13px; color: #666; margin: 0; }
          .meta { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead { background: #eff6ff; }
          th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; border-bottom: 2px solid #bfdbfe; }
          td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #f9fafb; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HOPE Training Academy</h1>
          <p>Completions Report — ${training?.title || 'Training'}</p>
        </div>
        <div class="meta">
          <span>Category: ${training?.category || '—'}</span>
          <span>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>Total Completions: ${reportData.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Participant Name</th>
              <th>Certificate ID</th>
              <th>Completed At</th>
              <th>Verification Code</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">HOPE Training Academy — Confidential Report</div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const pending = trainings.filter(t => t.status === 'draft' || t.status === 'approved')
  const published = trainings.filter(t => t.status === 'published')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Pending',   trainings.filter(t => t.status === 'draft').length,     'text-yellow-600'],
          ['Approved',  trainings.filter(t => t.status === 'approved').length,  'text-blue-600'],
          ['Published', trainings.filter(t => t.status === 'published').length, 'text-green-600'],
        ].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`text-3xl font-bold ${c}`}>{v}</div>
            <div className="text-xs text-gray-500 mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[['approvals','Approvals'],['all','All Trainings'],['reports','Reports'],['logs','Audit Log']].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded text-sm font-medium ${tab === k ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* APPROVALS */}
      {tab === 'approvals' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {pending.length === 0
            ? <p className="text-center py-12 text-gray-400">Nothing pending.</p>
            : <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pending.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(t.status)}`}>{t.status}</span></td>
                      <td className="px-4 py-3">
                        {t.status === 'draft'    && <button onClick={() => approve(t.id)} className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">Approve</button>}
                        {t.status === 'approved' && <button onClick={() => publish(t.id)} className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700">Publish</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* ALL TRAININGS */}
      {tab === 'all' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainings.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(t.status)}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div>
          {/* Training selector */}
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Completions Report</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Select Training</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reportTrainingId}
                  onChange={e => { setReportTrainingId(e.target.value); setReportData([]); setReportError('') }}
                >
                  <option value="">— Choose a training —</option>
                  {trainings.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={loadReport}
                disabled={!reportTrainingId || reportLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                {reportLoading ? 'Loading…' : 'Load Report'}
              </button>
            </div>
          </div>

          {/* Results */}
          {reportError && <p className="text-center py-6 text-gray-400">{reportError}</p>}

          {reportData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header row with export buttons */}
              <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {reportData.length} completion{reportData.length !== 1 ? 's' : ''} —{' '}
                  <span className="text-gray-400 font-normal">{trainings.find(t => t.id === reportTrainingId)?.title}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 font-medium"
                  >
                    ⬇ Export CSV
                  </button>
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-1 bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                  >
                    🖨 Export PDF
                  </button>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Participant</th>
                    <th className="px-4 py-3 text-left">Certificate ID</th>
                    <th className="px-4 py-3 text-left">Completed</th>
                    <th className="px-4 py-3 text-left">Verification Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {r.participant_name || r.user_id || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                        {r.certificate_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {r.verification_code?.slice(0, 16)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG */}
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
              {logs.length === 0
                ? <tr><td colSpan={3} className="text-center py-8 text-gray-400">No logs yet.</td></tr>
                : logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium capitalize">{l.action}</td>
                    <td className="px-4 py-3 text-gray-500">{l.entity_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}