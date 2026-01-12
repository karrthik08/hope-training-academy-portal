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
  const [enrollments, setEnrollments] = useState([])
  const [trainingMap, setTrainingMap] = useState({})
  const [browseList, setBrowseList]   = useState([])
  const [tab, setTab]                 = useState('mine')
  const [loading, setLoading]         = useState(true)

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {firstName}</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your HOPE training enrollments</p>

      <div className="flex gap-2 mb-6">
        {[['mine','My Enrollments'],['browse','Browse Trainings']].map(([k,v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded text-sm font-medium ${tab===k ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {tab === 'mine' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {enrollments.length === 0
            ? <div className="text-center py-12">
                <p className="text-gray-400 mb-2">No enrollments yet.</p>
                <button onClick={() => setTab('browse')} className="text-blue-600 text-sm hover:underline">Browse trainings →</button>
              </div>
            : <table className="w-full text-sm">
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
                          {t?.category && <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            e.enrollment_status === 'completed' ? 'bg-green-100 text-green-700' :
                            e.enrollment_status === 'enrolled'  ? 'bg-blue-100 text-blue-700'  :
                            'bg-gray-100 text-gray-500'}`}>
                            {e.enrollment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {e.enrollment_status === 'enrolled'  && <button onClick={() => handleCancel(e.training_id)} className="text-red-500 text-xs hover:underline">Cancel</button>}
                          {e.enrollment_status === 'completed' && <Link to={`/certificate/${e.id}`} className="text-green-600 text-xs font-medium hover:underline">View Certificate →</Link>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          }
        </div>
      )}

      {tab === 'browse' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {browseList.length === 0
            ? <p className="col-span-3 text-center py-12 text-gray-400">No published trainings yet.</p>
            : browseList.map(t => {
                const enrolled = enrollments.some(e => e.training_id === t.id && e.enrollment_status === 'enrolled')
                return (
                  <div key={t.id} className="bg-white rounded-lg shadow p-5 flex flex-col">
                    {t.category && <span className={`self-start px-2 py-1 rounded-full text-xs font-medium mb-3 ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>}
                    <h3 className="font-semibold text-gray-900 mb-2">{t.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 flex-1">{t.description || 'No description.'}</p>
                    {enrolled
                      ? <span className="text-green-700 text-sm font-medium">✓ Enrolled</span>
                      : <button onClick={() => handleEnroll(t.id)} className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">Enroll Now</button>}
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}