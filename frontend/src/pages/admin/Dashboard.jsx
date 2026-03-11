import React, { useEffect, useState } from 'react'
import {
  getAllTrainings, approveTraining,
  getRosterReport, getCompletionReport, getAuditLogs,
} from '../../api/client'

const statusBadge = (status) => {
  const m = {
    draft:     'bg-yellow-100 text-yellow-700',
    approved:  'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    archived:  'bg-gray-100 text-gray-500',
  }
  return m[status] || 'bg-gray-100 text-gray-600'
}

export default function AdminDashboard() {
  const [trainings, setTrainings]           = useState([])
  const [auditLogs, setAuditLogs]           = useState([])
  const [tab, setTab]                       = useState('trainings')
  const [loading, setLoading]               = useState(true)
  const [reportData, setReportData]         = useState(null)
  const [reportType, setReportType]         = useState('')
  const [selectedTrainingId, setSelectedTrainingId] = useState('')
  const [msg, setMsg]                       = useState('')

  const load = async () => {
    const [t, a] = await Promise.all([getAllTrainings(), getAuditLogs()])
    setTrainings(t)
    setAuditLogs(a)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    try {
      await approveTraining(id)
      setMsg('Training approved successfully')
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    }
  }

  const handleReport = async (type) => {
    if (!selectedTrainingId) return alert('Select a training first')
    try {
      const data = type === 'roster'
        ? await getRosterReport(selectedTrainingId)
        : await getCompletionReport(selectedTrainingId)
      setReportData(data)
      setReportType(type)
    } catch (err) {
      alert(err.response?.data?.detail || 'Report failed')
    }
  }

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${reportType}-report.json`
    a.click()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-6">Manage trainings, reports, and audit logs</p>

      {msg && (
        <div className="bg-green-50 text-green-800 p-3 rounded mb-4 text-sm flex justify-between">
          {msg}
          <button onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['trainings', 'reports', 'audit'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded font-medium text-sm capitalize ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'audit' ? 'Audit Log' : t === 'reports' ? 'Reports' : 'Trainings'}
          </button>
        ))}
      </div>

      {/* Trainings Tab */}
      {tab === 'trainings' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainings.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.status === 'draft' && (
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Generate Report</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Select Training</label>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={selectedTrainingId}
                  onChange={(e) => setSelectedTrainingId(e.target.value)}
                >
                  <option value="">Choose a training…</option>
                  {trainings.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleReport('roster')}
                className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700"
              >
                Roster Report
              </button>
              <button
                onClick={() => handleReport('completion')}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Completion Report
              </button>
            </div>
          </div>

          {reportData && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold capitalize">
                  {reportType} Report ({reportData.length} records)
                </h3>
                <button onClick={downloadJson} className="text-sm text-brand-600 hover:underline">
                  ⬇ Download JSON
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-80">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {log.entity_type}{' '}
                    <span className="font-mono text-gray-400">{log.entity_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {log.actor_user_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}