import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/client'

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore()
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        setFullName(r.data.full_name)
        setEmail(r.data.email)
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (password && password.length < 6) return setError('Password must be at least 6 characters.')
    if (password && password !== confirm) return setError('Passwords do not match.')
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { full_name: fullName }
      if (password) payload.password = password
      const res = await api.put('/auth/me', payload)
      setAuth(token, { ...user, full_name: res.data.full_name })
      setPassword('')
      setConfirm('')
      setSuccess('Profile updated successfully!')
    } catch(err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'
  const roleLabel = user?.roles?.includes('Admin') ? 'Admin' : user?.roles?.includes('Instructor') ? 'Instructor' : 'Participant'
  const roleColor = user?.roles?.includes('Admin') ? 'bg-purple-100 text-purple-700' : user?.roles?.includes('Instructor') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'

  if (loading) return <div className="text-center py-12 text-gray-400">Loading profile…</div>

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your account information</p>

      <div className="bg-white rounded-lg shadow p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{fullName}</p>
          <p className="text-gray-500 text-sm">{email}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Edit Information</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded px-3 py-2 mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-600 mb-3">
              Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}