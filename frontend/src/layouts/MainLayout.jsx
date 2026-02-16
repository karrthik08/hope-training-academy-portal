import React from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const dashboardLink = () => {
    if (!user) return null
    if (user.roles.includes('Admin'))      return { to: '/admin',      label: 'Admin Panel' }
    if (user.roles.includes('Instructor')) return { to: '/instructor', label: 'Instructor' }
    return { to: '/dashboard', label: 'My Trainings' }
  }

  const dash = dashboardLink()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-brand-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            HOPE Training Portal
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:underline">Trainings</Link>
            {dash && (
              <Link to={dash.to} className="hover:underline">{dash.label}</Link>
            )}
            {user && (
              <Link to="/profile" className="hover:underline text-blue-200">
                My Profile
              </Link>
            )}
            {user ? (
              <>
                <span className="text-blue-200">Hi, {user.full_name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-brand-700 px-3 py-1 rounded font-medium hover:bg-blue-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link
                  to="/register"
                  className="bg-white text-brand-700 px-3 py-1 rounded font-medium hover:bg-blue-50"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-100 border-t text-center text-sm text-gray-500 py-4">
        © {new Date().getFullYear()} HOPE Training Academy
      </footer>
    </div>
  )
}