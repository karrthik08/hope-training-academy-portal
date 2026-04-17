import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTrainings, approveTraining, rejectTraining } from '../../api/client'

export default function CourseReview() {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    setLoading(true)
    try {
      const all = await getAllTrainings()
      // Filter only submitted courses
      const submitted = all.filter(t => t.status === 'submitted')
      setTrainings(submitted)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('Approve this course and make it available for publishing?')) return
    try {
      await approveTraining(id)
      await loadTrainings()
      alert('Course approved!')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to approve')
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject this course and send it back to draft?')) return
    try {
      await rejectTraining(id)
      await loadTrainings()
      alert('Course rejected and sent back to draft')
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to reject')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <button
        onClick={() => navigate('/admin')}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2 mb-4"
      >
        ← Back to Admin Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Review Queue</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve courses submitted by instructors</p>
      </div>

      {trainings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 font-medium mb-1">No courses pending review</p>
          <p className="text-gray-400 text-sm">All submitted courses have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trainings.map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow p-6 border border-purple-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Pending Review
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Category</span>
                  <span className="font-medium text-gray-900">{course.category || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Target Audience</span>
                  <span className="font-medium text-gray-900">{course.target_audience || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Delivery Type</span>
                  <span className="font-medium text-gray-900">
                    {course.delivery_type === 'live' ? '🔴 Live' : '📚 Self-Paced'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Duration</span>
                  <span className="font-medium text-gray-900">
                    {course.duration_hours ? `${course.duration_hours}h` : '—'}
                  </span>
                </div>
              </div>

              {course.submitted_at && (
                <p className="text-xs text-gray-400 mb-4">
                  Submitted {new Date(course.submitted_at).toLocaleDateString()} at {new Date(course.submitted_at).toLocaleTimeString()}
                </p>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleApprove(course.id)}
                  className="bg-green-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-green-700"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(course.id)}
                  className="bg-red-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-red-700"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
