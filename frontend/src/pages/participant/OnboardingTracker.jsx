import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import * as api from '../../api/client'

const CATEGORY_COLORS = {
  'ACCESS / SSP Core': 'bg-blue-100 text-blue-700',
  'Safety Training':   'bg-red-100 text-red-700',
  'Peer Support':      'bg-purple-100 text-purple-700',
  'Youth Prevention':  'bg-green-100 text-green-700',
  'Core ORP + SSP':    'bg-orange-100 text-orange-700',
  'PPW':               'bg-pink-100 text-pink-700',
  'Safe Sleep':        'bg-teal-100 text-teal-700',
  'Gambling':          'bg-yellow-100 text-yellow-700',
}

const VIDEO_URLS = {
  1:  'https://www.youtube.com/embed/GhQtx2fNl8Q',
  4:  'https://www.youtube.com/embed/tj-KgFeQvX0',
  5:  'https://www.youtube.com/embed/1NCunsvOQ4w',
  6:  'https://www.youtube.com/embed/JnuR8hQPNFc',
  7:  'https://www.youtube.com/embed/GWxtK4pQt3s',
  8:  'https://www.youtube.com/embed/RegIKqyZTa0',
  9:  'https://www.youtube.com/embed/JnuR8hQPNFc',
  10: 'https://www.youtube.com/embed/-kbe1b_oR7w',
  14: 'https://www.youtube.com/embed/su4bw9DbPOY',
  22: 'https://www.youtube.com/embed/vfDhoDBnUYM',
}

function YouTubePlayer({ url, trainingId }) {
  const [showPlayer, setShowPlayer] = useState(false)
  return (
    <div className="mt-2">
      {!showPlayer ? (
        <button onClick={() => setShowPlayer(true)}
          className="flex items-center gap-2 text-red-600 text-sm font-medium hover:text-red-700">
          <span className="bg-red-600 text-white rounded px-1.5 py-0.5 text-xs font-bold">▶ YouTube</span>
          Watch Video
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:'8px' }}>
            <iframe src={url} title={`Training video ${trainingId}`}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
          <button onClick={() => setShowPlayer(false)} className="text-xs text-gray-400 hover:text-gray-600 self-start">
            ✕ Hide video
          </button>
        </div>
      )}
    </div>
  )
}

export default function OnboardingTracker() {
  const { token, user } = useAuthStore()
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState([])
  const [progress, setProgress] = useState({})
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [signature, setSignature] = useState('')

  useEffect(() => { if (!token || !user) navigate('/login'); else load() }, [token, user])

  const load = async () => {
    setLoading(true)
    try {
      const trainingsData = await api.getOnboardingTrainings()
      setTrainings(Array.isArray(trainingsData) ? trainingsData : [])
      
      try {
        const progressData = await api.getMyOnboardingProgress()
        setProgress(progressData.progress || {})
        setSubmission(progressData.submission)
      } catch (e) {
        console.log('No progress yet:', e)
      }
    } catch(e) {
      console.error('Onboarding load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (trainingId) => {
    const data = formData[trainingId] || {}
    setSaving(prev => ({ ...prev, [trainingId]: true }))
    try {
      await api.updateOnboardingItem(trainingId, data.dropbox_link || '', data.initials || '')
      await load()
      setExpandedId(null)
    } catch(e) { 
      console.error(e)
      alert('Error saving: ' + (e.response?.data?.detail || e.message))
    }
    finally { setSaving(prev => ({ ...prev, [trainingId]: false })) }
  }

  const handleSubmit = async () => {
    if (!signature.trim()) return alert('Please enter your signature/initials')
    setSubmitting(true)
    try {
      await api.submitOnboarding()
      alert('Onboarding submitted for review!')
      await load()
    } catch(e) {
      console.error(e)
      alert('Submission failed: ' + (e.response?.data?.detail || e.message))
    }
    finally { setSubmitting(false) }
  }

  const completed = Object.keys(progress).filter(k => progress[k]?.status === 'complete').length
  const pct = trainings.length > 0 ? Math.round((completed / trainings.length) * 100) : 0

  if (loading) return <div className="p-8 text-center text-gray-500">Loading onboarding tracker...</div>

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pre-Onboarding Training Tracker</h1>
        <p className="text-sm text-gray-600 mb-4">
          Complete all 25 trainings and upload proof to your Dropbox folder before your first day.
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-gray-700">Overall Progress</span>
            <span className="font-semibold text-blue-600">{completed}/{trainings.length} Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{width: `${pct}%`}} />
          </div>
        </div>

        {submission && (
          <div className={`p-4 rounded-lg ${
            submission.status === 'approved' ? 'bg-green-50 border border-green-200' :
            submission.status === 'needs_revision' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="font-semibold mb-1">
              {submission.status === 'approved' ? '✅ Approved' :
               submission.status === 'needs_revision' ? '⚠️ Needs Revision' :
               '⏳ Under Review'}
            </div>
            {submission.notes && <p className="text-sm">{submission.notes}</p>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {trainings.map((t) => {
          const p = progress[t.id] || {}
          const isExpanded = expandedId === t.id
          const videoUrl = VIDEO_URLS[t.id]

          return (
            <div key={t.id} className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-700'}`}>
                        {t.category}
                      </span>
                      {p.status === 'complete' && <span className="text-green-600 text-sm">✓ Done</span>}
                      {p.status === 'pending' && <span className="text-yellow-600 text-sm">⏳ Pending</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.provider} • {t.deadline}
                    </p>
                    {t.link && (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                        Open Training Link →
                      </a>
                    )}
                    {videoUrl && <YouTubePlayer url={videoUrl} trainingId={t.id} />}
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    {isExpanded ? 'Close' : 'Add Proof'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dropbox Proof Link
                        </label>
                        <input
                          type="text"
                          placeholder="Paste Dropbox link here"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData[t.id]?.dropbox_link || p.proof_link || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [t.id]: { ...(prev[t.id] || {}), dropbox_link: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Initials
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., JD"
                          maxLength={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={formData[t.id]?.initials || p.initials || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [t.id]: { ...(prev[t.id] || {}), initials: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSave(t.id)}
                      disabled={saving[t.id]}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving[t.id] ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {completed === trainings.length && !submission && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-3">Submit for Review</h3>
          <p className="text-sm text-gray-600 mb-4">
            All trainings complete! Enter your signature/initials to submit for approval.
          </p>
          <input
            type="text"
            placeholder="Enter your signature/initials"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}
    </div>
  )
}
