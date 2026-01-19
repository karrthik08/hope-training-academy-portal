import React, { useEffect, useState } from 'react'
import { getAllTrainings, createTraining, getRoster, markAttendance, markCompletion } from '../../api/client'

const CATEGORIES = [
  'Curriculum Development & Implementation',
  'Youth Prevention Training',
  'Business Incubator',
  'Peer Support Certification Training',
  'Accreditation & Corporate Support',
  'Workforce Readiness',
  'Leadership Development',
  'Life & Resilience Skills Training',
]

export default function InstructorDashboard() {
  const [trainings, setTrainings]         = useState([])
  const [selected, setSelected]           = useState(null)
  const [roster, setRoster]               = useState([])
  const [tab, setTab]                     = useState('trainings')
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState({ title:'', description:'', category:'' })
  const [loading, setLoading]             = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)

  useEffect(() => { loadTrainings() }, [])

  const loadTrainings = async () => {
    setLoading(true)
    try { const r = await getAllTrainings(); setTrainings(r) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openRoster = async (t) => {
    setSelected(t); setTab('roster'); setRosterLoading(true)
    try { const r = await getRoster(t.id); setRoster(r) }
    catch(e) { console.error(e) }
    finally { setRosterLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return alert('Title required')
    try {
      await createTraining(form)
      setForm({ title:'', description:'', category:'' })
      setShowForm(false)
      await loadTrainings()
    } catch(e) { alert(e.response?.data?.detail || 'Failed to create') }
  }

  const handleAttendance = async (id, status) => {
    try { await markAttendance(id, status); alert(`Marked ${status}`) }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark complete and generate certificate?')) return
    try {
      await markCompletion(id)
      const r = await getRoster(selected.id)
      setRoster(r)
    } catch(e) { alert(e.response?.data?.detail || 'Failed or already completed') }
  }

  const badge = (s) => ({
    draft:     'bg-yellow-100 text-yellow-700',
    approved:  'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  }[s] || 'bg-gray-100 text-gray-600')

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage trainings, attendance, completions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + New Training
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h2 className="font-semibold mb-3 text-sm">Create New Training</h2>
          <input
            className="w-full border rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Training Title"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
          />
          <select
            className="w-full border rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
          >
            <option value="">Select HOPE Program Category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            className="w-full border rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description (optional)"
            rows={3}
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Create Training
            </button>
            <button onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('trainings')}
          className={`px-4 py-2 rounded text-sm font-medium ${tab==='trainings' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
          All Trainings
        </button>
        {selected && (
          <button onClick={() => setTab('roster')}
            className={`px-4 py-2 rounded text-sm font-medium ${tab==='roster' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            Roster: {selected.title}
          </button>
        )}
      </div>

      {tab === 'trainings' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {trainings.length === 0
            ? <p className="text-center py-12 text-gray-400">No trainings yet. Create one above.</p>
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
                  {trainings.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.status === 'published'
                          ? <button onClick={() => openRoster(t)} className="text-blue-600 text-xs hover:underline font-medium">View Roster →</button>
                          : <span className="text-xs text-gray-400">{t.status === 'draft' ? 'Awaiting approval' : 'Ready to publish'}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {tab === 'roster' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {rosterLoading
            ? <p className="text-center py-8 text-gray-400">Loading roster...</p>
            : roster.length === 0
              ? <p className="text-center py-12 text-gray-400">No participants enrolled yet.</p>
              : <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Participant</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Enrolled</th>
                      <th className="px-4 py-3 text-left">Attendance</th>
                      <th className="px-4 py-3 text-left">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {roster.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{e.participant_name || e.user_id.slice(0,8)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.enrollment_status==='completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {e.enrollment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {e.enrollment_status !== 'completed' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleAttendance(e.id, 'present')}
                                className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded hover:bg-green-200">
                                Present
                              </button>
                              <button onClick={() => handleAttendance(e.id, 'absent')}
                                className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded hover:bg-red-200">
                                Absent
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {e.enrollment_status === 'enrolled' &&
                            <button onClick={() => handleComplete(e.id)}
                              className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">
                              Mark Complete
                            </button>
                          }
                          {e.enrollment_status === 'completed' &&
                            <span className="text-green-600 text-xs font-medium">✓ Done</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          }
        </div>
      )}
    </div>
  )
}