import React, { useEffect, useState, useRef } from 'react'
import { myEnrollments, cancelEnrollment, getPublicTrainings, enroll, createCheckoutSession } from '../../api/client'
import { selfEnroll } from '../../api/enrollments'
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
  'Prevention & Youth Education':            'bg-green-100 text-green-700',
  'Harm Reduction & Public Health Safety':   'bg-red-100 text-red-700',
  'Peer Recovery & Coaching':                'bg-blue-100 text-blue-700',
  'Safety & Compliance':                     'bg-gray-100 text-gray-700',
  'Mental Health & Wellness':                'bg-pink-100 text-pink-700',
  'Train-the-Trainer':                       'bg-yellow-100 text-yellow-700',
  'Family & Community Support':              'bg-orange-100 text-orange-700',
  'Workforce Development':                   'bg-teal-100 text-teal-700',
  'Peer Support Specialist':                 'bg-indigo-100 text-indigo-700',
}

function VideoPlayer({ training }) {
  const videoRef = useRef(null)
  const [watched, setWatched]   = useState(false)
  const [progress, setProgress] = useState(0)

  const isDropbox = training.video_url?.includes('dropbox') || training.video_url?.includes('dropboxusercontent')
  const isYoutube = training.video_url?.includes('youtube') || training.video_url?.includes('youtu.be')

  const youtubeEmbed = isYoutube
    ? training.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
    : null

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const { currentTime, duration } = videoRef.current
    if (duration > 0) setProgress(Math.round((currentTime / duration) * 100))
  }
  const handleEnded = () => { setWatched(true) }

  if (isDropbox) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video ref={videoRef} src={training.video_url} controls controlsList="nodownload"
            className="w-full h-full" onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
        </div>
        {!watched && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-center">Video progress: {progress}%</p>
          </>
        )}
        {watched && <p className="text-xs text-green-600 text-center font-medium">✅ Video complete!</p>}
      </div>
    )
  }

  if (isYoutube) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <iframe src={youtubeEmbed} title={training.title} className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
        <p className="text-xs text-blue-600 text-center">Watch the training video above</p>
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

  const handleEnroll = async (trainingId, price) => {
    // If course has a price, redirect to Stripe checkout
    if (price > 0) {
      try {
        setLoading(true)
        const { checkout_url } = await createCheckoutSession(trainingId)
        // Redirect to Stripe checkout page
        window.location.href = checkout_url
      } catch(e) {
        setLoading(false)
        alert('Failed to create checkout session: ' + (e.response?.data?.detail || e.message))
      }
      return
    }
    
    // Free course - enroll directly
    try { 
      await selfEnroll(trainingId);
      await load();
      alert('Successfully enrolled!');
    }
    catch(e) { 
      alert(e.response?.data?.detail || 'Enrollment failed. Self-enrollment may not be enabled for this training.');
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel enrollment?')) return
    try { await cancelEnrollment(id); await load() }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  const firstName = user?.full_name?.split(' ')[0] || 'Participant'
  const categories = ['All', ...new Set(browseList.map(t => t.category).filter(Boolean))]
  const filteredList = browseList.filter(t => {
    const matchSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || t.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {firstName}</h1>
      <p className="text-gray-400 text-sm mb-5">Find a training and sign up below.</p>

      <div className="flex gap-2 mb-6">
        {[['mine','My Enrollments'],['browse','Browse Trainings']].map(([k,v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded text-sm font-medium ${tab===k ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* MY ENROLLMENTS */}
      {tab === 'mine' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {enrollments.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🎓</div>
              <p className="text-gray-600 font-medium mb-2">No enrollments yet.</p>
              <button onClick={() => setTab('browse')} className="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700">
                Browse Trainings →
              </button>
            </div>
          ) : (
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
                  const t           = trainingMap[e.training_id]
                  const hasVideo    = !!t?.video_url
                  const isCompleted = e.enrollment_status === 'completed'
                  const isEnrolled  = e.enrollment_status === 'enrolled'

                  return (
                    <React.Fragment key={e.id}>
                      <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t?.title || '—'}</div>
                          {t?.instructor_name && (
                            <div className="text-xs text-gray-600 mt-1">👤 Instructor: {t.instructor_name}</div>
                          )}
                      </td>
                        <td className="px-4 py-3">
                          {t?.category && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                              {t.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-700' : isEnrolled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {e.enrollment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 flex gap-2">
                          {isEnrolled && (
                            <>
                              <Link to={`/course/${e.id}`} className="text-blue-600 text-xs font-medium hover:underline">
                                📚 View Course →
                              </Link>
                              <button onClick={() => handleCancel(e.training_id)} className="text-red-500 text-xs hover:underline">Cancel</button>
                            </>
                          )}
                          {isCompleted && (
                            <Link to={`/certificate/${e.id}`} className="text-green-600 text-xs font-medium hover:underline">
                              🎓 View Certificate →
                            </Link>
                          )}
                        </td>
                      </tr>

                      {/* Expanded row for enrolled trainings */}
                      {isEnrolled && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="max-w-2xl flex flex-col gap-3">
                              {hasVideo && (
                                <>
                                  <p className="text-sm font-medium text-gray-700">📹 Training Video:</p>
                                  <VideoPlayer training={t} />
                                </>
                              )}
                              
                              <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded">
                                <p className="text-sm font-medium">
                                  ℹ️ {t?.instructor_name ? `Your instructor (${t.instructor_name}) will` : 'Your instructor will'} mark you as complete when you finish the training. 
                                  You'll receive your certificate once they approve your completion.
                                </p>
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
          )}
        </div>
      )}

      {/* BROWSE */}
      {tab === 'browse' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <input type="text" placeholder="Search trainings..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-gray-500">No trainings found.</div>
            ) : filteredList.map(t => {
              const enrolledEntry  = enrollments.find(e => e.training_id === t.id && e.enrollment_status === 'enrolled')
              const completedEntry = enrollments.find(e => e.training_id === t.id && e.enrollment_status === 'completed')
              const isEnrolled     = !!enrolledEntry
              const isCompleted    = !!completedEntry
              const hasVideo       = !!t.video_url
              const price          = parseFloat(t.price) || 0
              const isFree         = price === 0

              return (
                <div key={t.id} className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    {t.category && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                        {t.category}
                      </span>
                    )}
                    
                    {/* Price Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${isFree ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isFree ? 'FREE' : `$${price.toFixed(2)}`}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <p className="text-sm text-gray-500 flex-1 line-clamp-3">{t.description || 'No description provided.'}</p>

                  {hasVideo && isEnrolled && (
                    <VideoPlayer training={t} />
                  )}

                  {t.flyer_url && (
                    <a href={t.flyer_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline w-fit">
                      📄 View Flyer
                    </a>
                  )}

                  {isCompleted ? (
                    <Link to={`/certificate/${completedEntry.id}`}
                      className="w-full block text-center bg-green-100 text-green-700 text-sm py-2 rounded font-medium hover:bg-green-200">
                      🎓 View Certificate →
                    </Link>
                  ) : isEnrolled ? (
                    <Link to={`/course/${enrolledEntry.id}`}
                      className="w-full block text-center bg-blue-600 text-white text-sm py-2 rounded font-medium hover:bg-blue-700">
                      📚 Continue Training →
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleEnroll(t.id, price)}
                      className={`w-full text-white text-sm py-2 rounded font-medium ${isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isFree ? '✓ Enroll Now' : `💳 Pay $${price.toFixed(2)} & Enroll`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}