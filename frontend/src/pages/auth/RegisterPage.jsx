import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const [form, setForm]       = useState({ full_name: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form.full_name, form.email, form.password)
      setAuth(data.access_token, {
        user_id:   data.user_id,
        full_name: data.full_name,
        roles:     data.roles,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand-700">Create Account</h1>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text" required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email" required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password (min 8 chars)</label>
            <input
              type="password" required minLength={8}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white py-2 rounded font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}