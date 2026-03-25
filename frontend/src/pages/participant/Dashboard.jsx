import React, { useEffect, useState, useRef } from 'react'
import { myEnrollments, cancelEnrollment, getPublicTrainings, enroll } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'

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

// Tracks which video trainings the user has watched to the end this session
function VideoPlayer({ training, onVideoCompleted, isEnrolled }) {
  const videoRef = useRef(null)
  const [watched, setWatched] = useState(false)
  const [progress, setProgress] = useState(0)

  const isDropbox = training.video_url && (
    training.video_url.includes('dropbox.com') ||
    training.video_url.includes('dropboxusercontent.com')
  )
  const videoSrc = isDropbox ? training.video_url : null

  // For YouTube — we can't enforce watch-to-end via iframe
  // so we show a message instead
  const isYoutube = training.video_url && (
    training.video_url.includes('youtube.com') ||
    training.video_url.includes('youtu.be')
  )
  const youtubeEmbed = isYoutube
    ? training.video_url
        .replace('watch?v=', 'embed/')
        .replace('youtu.be/', 'www.youtube.com/embed/')
    : null

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const { currentTime, duration } = videoRef.current
    if (duration > 0) {
      setProgress(Math.round((currentTime / duration) * 100))
    }
  }

  const handleEnded = () => {
    setWatched(true)
    onVideoCompleted()
  }

  if (isDropbox && videoSrc) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
        {/* Progress bar */}
        {isEnrolled && !watched && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {isEnrolled && !watched && (
          <p className="text-xs text-gray-400 text-center">
            ⚠️ Watch the full video to unlock your certificate ({progress}% watched)
          </p>
        )}
        {watched && (
          <p className="text-xs text-green-600 text-center font-medium">
            ✅ Video complete! You can now get your certificate.
          </p>
        )}
      </div>
    )
  }

  if (isYoutube && youtubeEmbed) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={youtubeEmbed}
            title={training.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {isEnrolled && (
          <p className="text-xs text-amber-600 text-center">
            ⚠️ Watch the complete video above, then click "Mark as Complete" below.
          </p>
        )}
      </div>
    )
  }

  return null
}

export default function ParticipantDashboard() {
  const { user } = useAuthStore()
  const [enrollments, setEnrollments]       = useState([])
  const [trainingMap, setTrainingMap]       = useState({})
  const [browseList, setBrowseList]         = useState([])
  const [tab, setTab]                       = useState('mine')
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [completingId, setCompletingId]     = useState(null)
  // Tracks videos that have been fully watched (by training id)
  const [watchedVideos, setWatchedVideos]   = useState({})

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [eRes, tRes] = await Promise.all([myEnrollments(), getPublicTrainings()])
      const map = {}
      tRes.forEach(t => { map[t.id] = t })
      setTrainingMap(map)
      setEnrollments(eRes)
      setBrowseList(tRes.filter(t => t.status === 'published'))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleEnroll = async (id) => {
    try { await enroll(id); await load() }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel enrollment?')) return
    try { await cancelEnrollment(id); await load() }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const handleMarkComplete = async (trainingId) => {
    if (completingId === trainingId) return
    setCompletingId(trainingId)
    const token = localStorage.getItem('hope_access_token') || ''
    if (!token) {
      alert('Please log in again.')
      setCompletingId(null)
      return
    }
    try {
      const res = await fetch(`/api/v1/enrollments/complete-by-video/${trainingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.detail || 'Failed to complete training.')
        setCompletingId(null)
        return
      }
      await load()
      setTab('mine')
    } catch(e) {
      console.error('complete error:', e)
    } finally {
      setCompletingId(null)
    }
  }

  const handleVideoWatched = (trainingId) => {
    setWatchedVideos(prev => ({ ...prev, [trainingId]: true }))
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const firstName = user?.full_name?.split(' ')[0] || 'Participant'
  const categories = ['All', ...new Set(browseList.map(t => t.category).filter(Boolean))]

  const filteredList = browseList.filter(t => {
    const matchesSearch = search.trim() === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {firstName}</h1>
      <p className="text-gray-400 text-sm mb-3">Find a training you're interested in and sign up below.</p>

      <div className="flex gap-2 mb-6">
        {[['mine','My Enrollments'],['browse','Browse Trainings']].map(([k,v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded text-sm font-medium ${tab===k ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* ── MY ENROLLMENTS TAB ── */}
      {tab === 'mine' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🎓</div>
              <p className="text-gray-600 font-medium mb-1">You haven't enrolled in any trainings yet.</p>
              <p className="text-gray-400 text-sm mb-4">Find a program that fits your goals and sign up today.</p>
              <button onClick={() => setTab('browse')}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700">
                Browse Trainings →
              </button>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Training</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Enrolled</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {enrollments.map(e => {
                    const t = trainingMap[e.training_id]
                    const hasVideo = t?.video_url
                    const isCompleted = e.enrollment_status === 'completed'
                    const isEnrolled = e.enrollment_status === 'enrolled'
                    const videoWatched = watchedVideos[e.training_id]

                    return (
                      <React.Fragment key={e.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{t?.title || '—'}</td>
                          <td className="px-4 py-3">
                            {t?.category && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                                {t.category}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isEnrolled  ? 'bg-blue-100 text-blue-700'  :
                              'bg-gray-100 text-gray-500'}`}>
                              {e.enrollment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {new Date(e.enrolled_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {isEnrolled && (
                              <button onClick={() => handleCancel(e.training_id)}
                                className="text-red-500 text-xs hover:underline">Cancel</button>
                            )}
                            {isCompleted && (
                              <Link to={`/certificate/${e.id}`}
                                className="text-green-600 text-xs font-medium hover:underline">
                                🎓 View Certificate →
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row for enrolled trainings — show video + complete button */}
                        {isEnrolled && (
                          <tr className="bg-blue-50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="max-w-2xl">

                                {/* Video trainings */}
                                {hasVideo ? (
                                  <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium text-gray-700">
                                      📹 Watch the full video to complete this training and earn your certificate:
                                    </p>
                                    <VideoPlayer
                                      training={t}
                                      isEnrolled={true}
                                      onVideoCompleted={() => handleVideoWatched(e.training_id)}
                                    />
                                    {/* Only show complete button after video is fully watched */}
                                    {videoWatched ? (
                                      <button
                                        onClick={() => handleMarkComplete(e.training_id)}
                                        disabled={completingId === e.training_id}
                                        className="w-full bg-green-600 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {completingId === e.training_id
                                          ? '⏳ Saving...'
                                          : '🎓 Get My Certificate'}
                                      </button>
                                    ) : (
                                      <button disabled
                                        className="w-full bg-gray-300 text-gray-500 text-sm py-2.5 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2">
                                        🔒 Complete the video to unlock your certificate
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  /* Non-video trainings — just show Mark as Complete */
                                  <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium text-gray-700">
                                      📋 Ready to complete this training?
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Click below to mark this training as complete and generate your certificate.
                                    </p>
                                    <button
                                      onClick={() => handleMarkComplete(e.training_id)}
                                      disabled={completingId === e.training_id}
                                      className="bg-green-600 text-white text-sm py-2.5 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 w-fit flex items-center gap-2">
                                      {completingId === e.training_id
                                        ? '⏳ Saving...'
                                        : '✅ Mark as Complete & Get Certificate'}
                                    </button>
                                  </div>
                                )}
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
          )}
        </div>
      )}

      {/* ── BROWSE TAB ── */}
      {tab === 'browse' && (
        <div>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, category, or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {search && (
            <p className="text-xs text-gray-400 mb-3">
              {filteredList.length} result{filteredList.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 font-medium mb-1">
                  {search ? `No results for "${search}"` : 'No trainings available right now.'}
                </p>
                {search && (
                  <button onClick={() => { setSearch(''); setCategoryFilter('All') }}
                    className="text-blue-600 text-sm hover:underline mt-2">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredList.map(t => {
                const enrolledEntry   = enrollments.find(e => e.training_id === t.id && e.enrollment_status === 'enrolled')
                const completedEntry  = enrollments.find(e => e.training_id === t.id && e.enrollment_status === 'completed')
                const isEnrolled      = !!enrolledEntry
                const isCompleted     = !!completedEntry
                const videoWatched    = watchedVideos[t.id]
                const hasVideo        = !!t.video_url

                return (
                  <div key={t.id} className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
                    {/* Category */}
                    {t.category && (
                      <span className={`self-start px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                        {t.category}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 flex-1 line-clamp-3">
                      {t.description || 'No description provided.'}
                    </p>

                    {/* Dates */}
                    {(t.start_at || t.end_at) && (
                      <p className="text-xs text-gray-400">
                        {t.start_at && <>Starts: {new Date(t.start_at).toLocaleDateString()}</>}
                        {t.end_at   && <> · Ends: {new Date(t.end_at).toLocaleDateString()}</>}
                      </p>
                    )}

                    {/* Video player — only show when enrolled */}
                    {hasVideo && isEnrolled && (
                      <VideoPlayer
                        training={t}
                        isEnrolled={true}
                        onVideoCompleted={() => handleVideoWatched(t.id)}
                      />
                    )}

                    {/* Flyer */}
                    {t.flyer_url && (
                      <a href={t.flyer_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline w-fit">
                        📄 View / Download Flyer
                      </a>
                    )}

                    {/* Action buttons */}
                    {isCompleted ? (
                      <Link to={`/certificate/${completedEntry.id}`}
                        className="w-full block text-center bg-green-100 text-green-700 text-sm py-2 rounded font-medium hover:bg-green-200">
                        🎓 View Certificate →
                      </Link>
                    ) : isEnrolled ? (
                      hasVideo ? (
                        /* Video training — only unlock after watching */
                        videoWatched ? (
                          <button
                            onClick={() => handleMarkComplete(t.id)}
                            disabled={completingId === t.id}
                            className="w-full bg-green-600 text-white text-sm py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50">
                            {completingId === t.id ? '⏳ Saving...' : '🎓 Get My Certificate'}
                          </button>
                        ) : (
                          <button disabled
                            className="w-full bg-gray-200 text-gray-400 text-sm py-2 rounded font-medium cursor-not-allowed">
                            🔒 Watch full video to unlock certificate
                          </button>
                        )
                      ) : (
                        /* Non-video training */
                        <button
                          onClick={() => handleMarkComplete(t.id)}
                          disabled={completingId === t.id}
                          className="w-full bg-green-600 text-white text-sm py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50">
                          {completingId === t.id ? '⏳ Saving...' : '✅ Mark as Complete & Get Certificate'}
                        </button>
                      )
                    ) : (
                      <button onClick={() => handleEnroll(t.id)}
                        className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">
                        Enroll Now
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}