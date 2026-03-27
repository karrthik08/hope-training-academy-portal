import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

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
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [trainings, setTrainings]   = useState([])
  const [progress, setProgress]     = useState({})
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState({})
  const [signature, setSignature]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [formData, setFormData]     = useState({})

  const token   = localStorage.getItem('hope_access_token') || ''
  const isAdmin = user?.roles?.includes('Admin')

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin')
      return
    }
    load()
  }, [isAdmin])

  const load = async () => {
    setLoading(true)
    try {
      const tRes = await fetch('/api/v1/onboarding/trainings', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const tData = await tRes.json()
      setTrainings(Array.isArray(tData) ? tData : [])

      const pRes = await fetch('/api/v1/onboarding/my-progress', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (pRes.ok) {
        const pData = await pRes.json()
        setProgress(pData.progress || {})
        setSubmission(pData.submission)
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
      await fetch('/api/v1/onboarding/update-item', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_id: trainingId,
          dropbox_link: data.dropbox_link || '',
          initials: data.initials || '',
          notes: data.notes || '',
        })
      })
      await load()
      setExpandedId(null)
    } catch(e) { console.error(e) }
    finally { setSaving(prev => ({ ...prev, [trainingId]: false })) }
  }

  const handleSubmit = async () => {
    if (!signature.trim()) return alert('Please enter your signature/initials')
    setSubmitting(true)
    try {
      await fetch('/api/v1/onboarding/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      })
      await load()
    } catch(e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  if (isAdmin) return null
  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const completedCount = Object.values(progress).filter(p => p.is_completed).length
  const pct        = Math.round((completedCount / 25) * 100)
  const isSubmitted = submission?.status === 'pending' || submission?.status === 'approved'
  const isApproved  = submission?.status === 'approved'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pre-Onboarding Training Tracker</h1>
        <p className="text-gray-500 mt-1">
          Complete all 25 required trainings before your first day. Upload your Dropbox proof link for each.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Overall Progress</span>
          <span className="text-lg font-bold text-blue-600">{completedCount}/25 Complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className={`h-4 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }} />
        </div>
        {isApproved && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 font-medium text-sm">
            ✅ Your pre-onboarding has been approved! You are cleared to start.
            {submission.reviewer_notes && <p className="mt-1 text-xs">{submission.reviewer_notes}</p>}
          </div>
        )}
        {submission?.status === 'pending' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
            ⏳ Submitted for review on {new Date(submission.submitted_at).toLocaleDateString()}. Awaiting Training Specialist approval.
          </div>
        )}
        {submission?.status === 'needs_revision' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            ❗ Revisions needed: {submission.reviewer_notes}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left w-8">#</th>
              <th className="px-4 py-3 text-left">Training</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Deadline</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trainings.map(t => {
              const p          = progress[t.id]
              const done       = p?.is_completed
              const isExpanded = expandedId === t.id
              const fd         = formData[t.id] || {}
              const hasVideo   = !!VIDEO_URLS[t.id]

              return (
                <React.Fragment key={t.id}>
                  <tr className={`hover:bg-gray-50 ${done ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono">{t.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.title}</div>
                      <div className="text-xs text-gray-400">{t.provider}</div>
                      {hasVideo && <YouTubePlayer url={VIDEO_URLS[t.id]} trainingId={t.id} />}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.deadline}</td>
                    <td className="px-4 py-3">
                      {done
                        ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✅ Done</span>
                        : <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pending</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {t.link && (
                          <a href={t.link} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 text-xs hover:underline">
                            {hasVideo ? 'Open in YouTube ↗' : 'Take Training ↗'}
                          </a>
                        )}
                        {!isSubmitted && (
                          <button
                            onClick={() => {
                              setExpandedId(isExpanded ? null : t.id)
                              if (!formData[t.id] && p) {
                                setFormData(prev => ({ ...prev, [t.id]: {
                                  dropbox_link: p.dropbox_link || '',
                                  initials: p.initials || '',
                                  notes: p.notes || '',
                                }}))
                              }
                            }}
                            className="text-indigo-600 text-xs hover:underline text-left">
                            {done ? 'Edit' : 'Add Proof'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-indigo-50 px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Dropbox Link (proof of completion) *
                            </label>
                            <input type="url" placeholder="https://www.dropbox.com/..."
                              value={fd.dropbox_link || ''}
                              onChange={e => setFormData(prev => ({ ...prev, [t.id]: { ...fd, dropbox_link: e.target.value }}))}
                              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <p className="text-xs text-gray-400 mt-1">Required proof: {t.proof}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Your Initials *</label>
                            <input type="text" placeholder="e.g. KB" maxLength={10}
                              value={fd.initials || ''}
                              onChange={e => setFormData(prev => ({ ...prev, [t.id]: { ...fd, initials: e.target.value }}))}
                              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                            <input type="text" placeholder="Any notes..."
                              value={fd.notes || ''}
                              onChange={e => setFormData(prev => ({ ...prev, [t.id]: { ...fd, notes: e.target.value }}))}
                              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="md:col-span-3 flex gap-3 items-center">
                            <button onClick={() => handleSave(t.id)} disabled={saving[t.id]}
                              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                              {saving[t.id] ? 'Saving...' : '💾 Save'}
                            </button>
                            <button onClick={() => setExpandedId(null)}
                              className="bg-white border text-gray-600 text-sm px-5 py-2 rounded hover:bg-gray-50">
                              Cancel
                            </button>
                            {t.instructions && (
                              <span className="text-xs text-gray-400">ℹ️ {t.instructions}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {!isSubmitted && completedCount === 25 && (
        <div className="bg-white rounded-xl shadow p-6 border-2 border-green-300">
          <h2 className="text-lg font-bold text-gray-900 mb-2">🎉 All trainings complete! Submit for Review</h2>
          <p className="text-sm text-gray-500 mb-4">
            By signing below, I certify that I completed all required pre-onboarding trainings,
            uploaded all certificates/screenshots to my OOH HR Dropbox folder, and entered each
            Dropbox link in the tracker for compliance and review.
          </p>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Your Signature / Full Name *</label>
              <input type="text" placeholder="Type your full name as signature"
                value={signature} onChange={e => setSignature(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={handleSubmit} disabled={submitting || !signature.trim()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : '✅ Submit for Review'}
            </button>
          </div>
        </div>
      )}

      {!isSubmitted && completedCount < 25 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
          ⚠️ Complete all 25 trainings to submit for final review. You have <strong>{25 - completedCount}</strong> remaining.
        </div>
      )}
    </div>
  )
}