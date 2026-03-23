import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicTrainings, enroll } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

const CATEGORY_COLORS = {
  'Youth Prevention Training':               'bg-purple-100 text-purple-700',
  'Leadership Development':                  'bg-blue-100 text-blue-700',
  'Workforce Readiness':                     'bg-green-100 text-green-700',
  'Business Incubator':                      'bg-yellow-100 text-yellow-700',
  'Peer Support Certification Training':     'bg-pink-100 text-pink-700',
  'Life & Resilience Skills Training':       'bg-orange-100 text-orange-700',
  'Curriculum Development & Implementation': 'bg-indigo-100 text-indigo-700',
  'Accreditation & Corporate Support':       'bg-teal-100 text-teal-700',
}

function TrainingCard({ training, onEnroll, enrolledIds }) {
  const { user } = useAuthStore()
  const isEnrolled = enrolledIds.has(training.id)

  const embedUrl = training.video_url
    ? training.video_url
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/')
    : null

  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg text-gray-900">{training.title}</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
          Published
        </span>
      </div>

      {training.category && (
        <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[training.category] || 'bg-gray-100 text-gray-600'}`}>
          {training.category}
        </span>
      )}

      <p className="text-gray-600 text-sm flex-1">
        {training.description || 'No description provided.'}
      </p>

      {(training.start_at || training.end_at) && (
        <p className="text-xs text-gray-400">
          {training.start_at && <>Starts: {new Date(training.start_at).toLocaleDateString()}</>}
          {training.end_at   && <> · Ends: {new Date(training.end_at).toLocaleDateString()}</>}
        </p>
      )}

      {embedUrl && (
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            title={`${training.title} video`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {training.flyer_url && (
        <a
          href={training.flyer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline w-fit"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          View / Download Flyer
        </a>
      )}

      {user ? (
        isEnrolled ? (
          <span className="text-sm text-green-700 font-medium">✓ Enrolled</span>
        ) : (
          <button
            onClick={() => onEnroll(training.id)}
            className="mt-auto bg-brand-600 text-white text-sm px-4 py-2 rounded hover:bg-brand-700"
          >
            Enroll
          </button>
        )
      ) : (
        <Link to="/login" className="text-sm text-brand-600 hover:underline">
          Log in to enroll →
        </Link>
      )}
    </div>
  )
}

export default function PublicTrainingsPage() {
  const [trainings, setTrainings]     = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [loading, setLoading]         = useState(true)

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

  if (loading) return <div className="text-center py-12 text-gray-400">Loading trainings…</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Trainings</h1>
        <p className="text-gray-500 mt-1">Browse and enroll in our published training programs</p>
      </div>

      {trainings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600 font-medium mb-1">No trainings published yet.</p>
          <p className="text-gray-400 text-sm">Check back soon — new programs are on the way.</p>
        </div>
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
