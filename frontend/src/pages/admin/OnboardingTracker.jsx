import React, { useEffect, useState } from 'react'
import api from '../../api/client'

const REQUIRED_TRAININGS_TITLES = [
  "SSP Core Training Live Opening Session",
  "Foundations of Harm Reduction Training",
  "Engaging People Who Use Drugs",
  "Safer Injection and Basic Wound Care",
  "Fentanyl Test Strips",
  "Overdose Response Program",
  "De-Escalation and Conflict",
  "Motivational Interviewing for People",
  "Maryland Overdose Response Program Training of Trainers",
  "SSP Core Training Live Closing Session",
  "Webinar Evaluation Form",
  "CPR/AED/First-Aid",
  "Bloodborne Pathogens",
  "Peer Support Specialist Overview Video",
  "Youth Prevention Training (NCA Bootcamp)",
  "Naloxone 101 Online Course",
  "Naloxone Training (Tracked Version)",
  "Harm Reduction and Street Outreach Specialist",
  "Harm Reduction Course",
  "CDC Talking About Naloxone",
  "PPW Registration",
  "Implementing the SPORT & Other Youth Programs",
  "PPW Evaluation",
  "Safe Sleep Assessment Tool Training",
  "Problem Gambling Training: Module One",
]

export default function AdminOnboardingTracker() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [approving, setApproving]   = useState(false)

  

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/onboarding/admin/all-progress', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data
      setUsers(data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadUserDetail = async (userId) => {
    setSelected(userId)
    try {
      const res = await fetch(`/api/v1/onboarding/admin/user-progress/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data
      setUserDetail(data)
      setReviewNote(data.submission?.reviewer_notes || '')
    } catch(e) { console.error(e) }
  }

  const handleApprove = async (status) => {
    setApproving(true)
    try {
      await fetch(`/api/v1/onboarding/admin/approve/${selected}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewer_notes: reviewNote })
      })
      await loadAll()
      await loadUserDetail(selected)
    } catch(e) { console.error(e) }
    finally { setApproving(false) }
  }

  const statusBadge = (status) => {
    if (!status) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">Not submitted</span>
    if (status === 'pending') return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">⏳ Pending Review</span>
    if (status === 'approved') return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">✅ Approved</span>
    if (status === 'needs_revision') return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">❗ Needs Revision</span>
    return null
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="flex gap-6 h-full">
      {/* Left panel — user list */}
      <div className="w-80 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pre-Onboarding Tracker</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No participants yet.</div>
          ) : (
            <div className="divide-y">
              {users.map(u => (
                <button key={u.user_id}
                  onClick={() => loadUserDetail(u.user_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selected === u.user_id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                  <div className="font-medium text-gray-900 text-sm">{u.full_name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${u.completed === 25 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${(u.completed / 25) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{u.completed}/25</span>
                  </div>
                  <div className="mt-1">{statusBadge(u.status)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — user detail */}
      <div className="flex-1">
        {!selected ? (
          <div className="bg-white rounded-xl shadow flex items-center justify-center h-64 text-gray-400">
            Select a participant to view their tracker
          </div>
        ) : !userDetail ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div>
            {/* User header */}
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{userDetail.user.full_name}</h3>
                  <p className="text-sm text-gray-400">{userDetail.user.email}</p>
                  <div className="mt-2">{statusBadge(userDetail.submission?.status)}</div>
                  {userDetail.submission?.submitted_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted: {new Date(userDetail.submission.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                  {userDetail.submission?.signature && (
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Signed by: {userDetail.submission.signature}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{userDetail.completed_count}/25</div>
                  <div className="text-xs text-gray-400">completed</div>
                </div>
              </div>

              {/* Approve/Reject — only show if submitted */}
              {userDetail.submission?.status === 'pending' && (
                <div className="mt-4 border-t pt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Review Notes</label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add any notes for the participant..."
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove('approved')}
                      disabled={approving}
                      className="bg-green-600 text-white text-sm px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium">
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleApprove('needs_revision')}
                      disabled={approving}
                      className="bg-red-100 text-red-700 text-sm px-5 py-2 rounded hover:bg-red-200 disabled:opacity-50 font-medium">
                      ❗ Request Revision
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Training checklist */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Training</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Dropbox Link</th>
                    <th className="px-4 py-3 text-left">Initials</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {REQUIRED_TRAININGS_TITLES.map((title, idx) => {
                    const p = userDetail.progress[idx + 1]
                    const done = p?.is_completed
                    return (
                      <tr key={idx} className={done ? 'bg-green-50' : ''}>
                        <td className="px-4 py-2 text-gray-400 font-mono text-xs">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-800 font-medium">{title}</td>
                        <td className="px-4 py-2">
                          {done
                            ? <span className="text-green-600 text-xs font-medium">✅ Done</span>
                            : <span className="text-gray-400 text-xs">Pending</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          {p?.dropbox_link
                            ? <a href={p.dropbox_link} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 text-xs hover:underline truncate block max-w-xs">
                                View Proof ↗
                              </a>
                            : <span className="text-gray-300 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">{p?.initials || '—'}</td>
                        <td className="px-4 py-2 text-xs text-gray-400">
                          {p?.date_completed ? new Date(p.date_completed).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}