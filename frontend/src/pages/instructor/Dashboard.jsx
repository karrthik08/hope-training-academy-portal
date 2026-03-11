import React, { useEffect, useState } from 'react'
import {
  getAllTrainings, getRoster, markAttendance,
  markCompletion, createTraining, publishTraining, unpublishTraining,
} from '../../api/client'

export default function InstructorDashboard() {
  const [trainings, setTrainings] = useState([])
  const [selected, setSelected]   = useState(null)
  const [roster, setRoster]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]           = useState({ title: '', description: '' })
  const [msg, setMsg]             = useState('')

  const loadTrainings = () =>
    getAllTrainings().then(setTrainings).finally(() => setLoading(false))

  useEffect(() => { loadTrainings() }, [])

  const selectTraining = async (t) => {
    setSelected(t)
    const r = await getRoster(t.id)
    setRoster(r)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createTraining(form)
      setForm({ title: '', description: '' })
      setShowCreate(false)
      setMsg('Training created! Ask admin to approve it.')
      loadTrainings()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create')
    }
  }

  const handleAttendance = async (enrollmentId, status) => {
    try {
      await markAttendance(enrollmentId, status)
      setMsg('Attendance marked successfully')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    }
  }

  const handleCompletion = async (enrollmentId) => {
    try {
      const comp = await markCompletion(enrollmentId)
      setMsg(`Certificate issued: ${comp.certificate_id}`)
      const r = await getRoster(selected.id)
      setRoster(r)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed')
    }
  }

  const handlePublishToggle = async (t) => {
    try {
      t.status === 'published' ? await unpublishTraining(t.id) : await publishTraining(t.id)
      loadTrainings()
      if (selected?.id === t.id) setSelected(null)
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-gray-500">Manage trainings, attendance, and completions</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 text-sm font-medium"
        >
          + New Training
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-800 p-3 rounded mb-4 text-sm flex justify-between">
          {msg}
          <button onClick={() => setMsg('')} className="ml-4 text-green-600">✕</button>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Create New Training</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required placeholder="Title"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              placeholder="Description" rows={3}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700">
                Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm">All Trainings</div>
          {trainings.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No trainings yet.</div>
          ) : (
            <div className="divide-y">
              {trainings.map((t) => (
                <div
                  key={t.id}
                  className={`px-4 py-3 ${selected?.id === t.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div onClick={() => selectTraining(t)} className="flex-1 min-w-0 cursor-pointer">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{t.status}</p>
                    </div>
                    {(t.status === 'approved' || t.status === 'published') && (
                      <button
                        onClick={() => handlePublishToggle(t)}
                        className={`text-xs px-2 py-1 rounded border ${
                          t.status === 'published'
                            ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                            : 'border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {t.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roster Panel */}
        {selected && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-sm">
              Roster: {selected.title}
            </div>
            {roster.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No enrolled participants.</div>
            ) : (
              <div className="divide-y">
                {roster.map((e) => (
                  <div key={e.id} className="px-4 py-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-mono text-gray-500">
                        User: {e.user_id.slice(0, 8)}…
                      </span>
                      <div className="flex gap-2">
                        <select
                          className="text-xs border rounded px-2 py-1"
                          defaultValue=""
                          onChange={(ev) =>
                            ev.target.value && handleAttendance(e.id, ev.target.value)
                          }
                        >
                          <option value="">Attendance…</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </select>
                        <button
                          onClick={() => handleCompletion(e.id)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}