import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [devToken, setDevToken] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required.')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSent(true)
      if (res.data.dev_token) setDevToken(res.data.dev_token)
    } catch(err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md text-center">
        <div className="text-4xl mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-4">
          If <span className="font-medium text-gray-700">{email}</span> is registered,
          you'll receive a password reset link shortly.
        </p>
        {devToken && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-left">
            <p className="text-xs text-yellow-700 font-semibold mb-1">🛠 Dev mode — reset token:</p>
            <Link
              to={`/reset-password?token=${devToken}`}
              className="text-xs text-blue-600 break-all hover:underline"
            >
              Click here to reset password →
            </Link>
          </div>
        )}
        <Link to="/login" className="text-blue-600 text-sm hover:underline">← Back to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl"></span>
          <span className="font-bold text-blue-700 text-sm tracking-wide uppercase">HOPE Training Academy Portal</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-3 py-2 mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
