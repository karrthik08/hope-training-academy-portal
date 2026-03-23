import React, { useEffect, useState } from 'react'
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

  const handleEnroll = async (id) => {
    try { await enroll(id); await load() }
    catch(e) { alert(e.response?.data?.detail || 'Failed') }
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
      <p className="text-gray-500 font-medium mb-1">No enrollments yet.</p>
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
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
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
                          e.enrollment_status === 'completed' ? 'bg-green-100 text-green-700' :
                          e.enrollment_status === 'enrolled'  ? 'bg-blue-100 text-blue-700'  :
                          'bg-gray-100 text-gray-500'}`}>
                          {e.enrollment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(e.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {e.enrollment_status === 'enrolled' && (
                          <button onClick={() => handleCancel(e.training_id)}
                            className="text-red-500 text-xs hover:underline">Cancel</button>
                        )}
                        {e.enrollment_status === 'completed' && (
                          <Link to={`/certificate/${e.id}`}
                            className="text-green-600 text-xs font-medium hover:underline">
                            View Certificate →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <p className="text-gray-400 text-sm mb-3">
                  {search ? 'Try a different keyword or clear your search.' : 'Check back soon for upcoming programs.'}
                </p>
                {search && (
                  <button onClick={() => { setSearch(''); setCategoryFilter('All') }}
                    className="text-blue-600 text-sm hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredList.map(t => {
                const enrolled = enrollments.some(e => e.training_id === t.id && e.enrollment_status === 'enrolled')

                const embedUrl = t.video_url
                  ? t.video_url
                      .replace('watch?v=', 'embed/')
                      .replace('youtu.be/', 'www.youtube.com/embed/')
                  : null

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
                    <p className="text-sm text-gray-500 flex-1">
                      {t.description || 'No description provided.'}
                    </p>

                    {/* Dates */}
                    {(t.start_at || t.end_at) && (
                      <p className="text-xs text-gray-400">
                        {t.start_at && <>Starts: {new Date(t.start_at).toLocaleDateString()}</>}
                        {t.end_at   && <> · Ends: {new Date(t.end_at).toLocaleDateString()}</>}
                      </p>
                    )}

                    {/* Video embed */}
                    {embedUrl && (
                      <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                        <iframe
                          src={embedUrl}
                          title={`${t.title} – video`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {/* Flyer */}
                    {t.flyer_url && (
                      <a href={t.flyer_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline w-fit">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        View / Download Flyer
                      </a>
                    )}

                    {/* Enroll */}
                    {enrolled
                      ? <span className="text-green-700 text-sm font-medium">✓ Enrolled</span>
                      : <button onClick={() => handleEnroll(t.id)}
                          className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">
                          Enroll Now
                        </button>
                    }
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