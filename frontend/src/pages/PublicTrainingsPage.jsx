import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicTrainings, enroll } from '../api/client'
import { useAuthStore } from '../store/authStore'

function TrainingCard({ training, onEnroll, enrolledIds }) {
  const { user } = useAuthStore()
  const isEnrolled = enrolledIds.has(training.id)

  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg text-gray-900">{training.title}</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
          Published
        </span>
      </div>
      <p className="text-gray-600 text-sm flex-1">
        {training.description || 'No description provided.'}
      </p>
      {user ? (
        isEnrolled ? (
          <span className="text-sm text-green-700 font-medium">✓ Enrolled</span>
        ) : (
          <button
            onClick={() => onEnroll(training.id)}
            className="mt-auto bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            Enroll
          </button>
        )
      ) : (
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          Log in to enroll
        </Link>
      )}
    </div>
  )
}

export default function PublicTrainingsPage() {
  const [trainings, setTrainings] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicTrainings().then(setTrainings).finally(() => setLoading(false))
  }, [])

  const handleEnroll = async (trainingId) => {
    try {
      await enroll(trainingId)
      setEnrolledIds((prev) => new Set([...prev, trainingId]))
    } catch (err) {
      alert(err.response?.data?.detail || 'Enrollment failed')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading trainings...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Trainings</h1>
        <p className="text-gray-500 mt-1">Browse and enroll in our published training programs</p>
      </div>
      {trainings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No published trainings yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((t) => (
            <TrainingCard
              key={t.id}
              training={t}
              onEnroll={handleEnroll}
              enrolledIds={enrolledIds}
            />
          ))}
        </div>
      )}
    </div>
  )
}