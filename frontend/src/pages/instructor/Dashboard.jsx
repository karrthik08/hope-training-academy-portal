import React, { useEffect, useState } from 'react'
import { getAllTrainings, createTraining, updateTraining, getRoster, markAttendance, markCompletion } from '../../api/client'

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

const EMPTY_FORM = { title: '', description: '', category: '', video_url: '', flyer_url: '' }

export default function InstructorDashboard() {
  const [trainings, setTrainings]         = useState([])
  const [selected, setSelected]           = useState(null)
  const [roster, setRoster]               = useState([])
  const [tab, setTab]                     = useState('trainings')
  const [showForm, setShowForm]           = useState(false)
  const [editTarget, setEditTarget]       = useState(null)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [loading, setLoading]             = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [saving, setSaving]               = useState(false)

  useEffect(() => { loadTrainings() }, [])

  const loadTrainings = async () => {
    setLoading(true)
    try { const r = await getAllTrainings(); setTrainings(r) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditTarget(t)
    setForm({
      title:       t.title || '',
      description: t.description || '',
      category:    t.category || '',
      video_url:   t.video_url || '',
      flyer_url:   t.flyer_url || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title required')
    setSaving(true)
    try {
      if (editTarget) {
        await updateTraining(editTarget.id, form)
      } else {
        await createTraining(form)
      }
      closeForm()
      await loadTrainings()
    } catch(e) {
      alert(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const openRoster = async (t) => {
    setSelected(t); setTab('roster'); setRosterLoading(true)
    try { const r = await getRoster(t.id); setRoster(r) }
    catch(e) { console.error(e) }
    finally { setRosterLoading(false) }
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
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          + New Training
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold mb-4">
            {editTarget ? `Edit: ${editTarget.title}` : 'New Training'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Training title"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe what participants will learn..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
                <span className="text-gray-400 font-normal ml-1">(optional — embeds on training card)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={e => setForm({...form, video_url: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flyer URL
                <span className="text-gray-400 font-normal ml-1">(optional — PDF or image link)</span>
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={form.flyer_url}
                onChange={e => setForm({...form, flyer_url: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Training'}
            </button>
            <button onClick={closeForm}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-200">
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
          {trainings.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No trainings yet. Create one above.</p>
          ) : (
            <table className="w-full text-sm">
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.title}</div>
                      <div className="flex gap-2 mt-0.5">
                        {t.video_url && <span className="text-xs text-blue-500">▶ Video</span>}
                        {t.flyer_url && <span className="text-xs text-green-500">📄 Flyer</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.category || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-gray-500 text-xs hover:text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        {t.status === 'published' && (
                          <button onClick={() => openRoster(t)}
                            className="text-blue-600 text-xs hover:underline font-medium">
                            View Roster →
                          </button>
                        )}
                        {t.status === 'draft' && (
                          <span className="text-xs text-gray-400">Awaiting approval</span>
                        )}
                        {t.status === 'approved' && (
                          <span className="text-xs text-gray-400">Ready to publish</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'roster' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {rosterLoading ? (
            <p className="text-center py-8 text-gray-400">Loading roster...</p>
          ) : roster.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium mb-1">No participants enrolled yet.</p>
              <p className="text-gray-400 text-sm">Share the training with your audience to get enrollments.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
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
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.participant_name || e.user_id.slice(0,8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.enrollment_status==='completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {e.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
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
                      {e.enrollment_status === 'enrolled' && (
                        <button onClick={() => handleComplete(e.id)}
                          className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700">
                          Mark Complete
                        </button>
                      )}
                      {e.enrollment_status === 'completed' && (
                        <span className="text-green-600 text-xs font-medium">✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
