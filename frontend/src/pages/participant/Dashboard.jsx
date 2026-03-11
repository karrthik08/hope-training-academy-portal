import React, { useEffect, useState } from 'react'
import { myEnrollments, cancelEnrollment, getPublicTrainings, enroll } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

const statusBadge = (status) => {
  const map = {
    enrolled:  'bg-blue-100 text-blue-700',
    canceled:  'bg-gray-100 text-gray-500',
    completed: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export default function ParticipantDashboard() {
  const { user } = useAuthStore()
  const [enrollments, setEnrollments] = useState([])
  const [available, setAvailable]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('my')

  const load = async () => {
    const [enrs, avail] = await Promise.all([myEnrollments(), getPublicTrainings()])
    setEnrollments(enrs)
    setAvailable(avail)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const enrolledTrainingIds = new Set(
    enrollments.filter((e) => e.enrollment_status === 'enrolled').map((e) => e.training_id)
  )

  const handleCancel = async (trainingId) => {
    if (!confirm('Cancel this enrollment?')) return
    try {
      await cancelEnrollment(trainingId)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel')
    }
  }

  const handleEnroll = async (trainingId) => {
    try {
      await enroll(trainingId)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to enroll')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.full_name}</h1>
      <p className="text-gray-500 mb-6">Manage your training enrollments</p>

      <div className="flex gap-2 mb-6">
        {['my', 'browse'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded font-medium text-sm ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'my' ? 'My Enrollments' : 'Browse Trainings'}
          </button>
        ))}
      </div>

      {tab === 'my' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No enrollments yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Training ID</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Enrolled At</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {e.training_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(e.enrollment_status)}`}>
                        {e.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(e.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.enrollment_status === 'enrolled' && (
                        <button
                          onClick={() => handleCancel(e.training_id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Cancel
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

      {tab === 'browse' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {available.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500 flex-1">{t.description}</p>
              {enrolledTrainingIds.has(t.id) ? (
                <span className="text-sm text-green-700 font-medium">Enrolled</span>
              ) : (
                <button
                  onClick={() => handleEnroll(t.id)}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 self-start"
                >
                  Enroll
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}