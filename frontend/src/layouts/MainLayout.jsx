import React from 'react'
import NotificationBell from '../Components/NotificationBell'
import HelpSupport from '../Components/HelpSupport'
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
    if (!user || !user.roles) return null
    if (user.roles.includes('Admin'))      return { to: '/admin',      label: 'Admin Panel' }
    if (user.roles.includes('Instructor')) return { to: '/instructor', label: 'Instructor' }
    return { to: '/dashboard', label: 'My Trainings' }
  }

  const dash = dashboardLink()

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top red bar — matches OOH website */}
      <div style={{ backgroundColor: '#CC0000' }} className="text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">✉️ oohtraining@organizationofhope.org</span>
            <span className="opacity-50">|</span>
            <span>📞 1.855.966.4467 / 443.449.6018</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.organizationofhope.org" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-yellow-200">
              www.OrganizationofHope.org
            </a>
          </div>
        </div>
      </div>

      {/* White address bar with logos — matches OOH website */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #ddd' }} className="py-3 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-2">

            {/* Address 1 */}
            <div className="flex items-start gap-1.5 text-xs text-gray-700">
              <span style={{ color: '#CC0000' }} className="mt-0.5">✉️</span>
              <div>
                <div className="font-bold">PO Box 1466,</div>
                <div>Temple Hills, Maryland</div>
                <div>MD 20575</div>
              </div>
            </div>

            {/* Address 2 */}
            <div className="flex items-start gap-1.5 text-xs text-gray-700">
              <span style={{ color: '#CC0000' }} className="mt-0.5">📍</span>
              <div>
                <div className="font-bold">3605 Springdale Avenue,</div>
                <div>Baltimore,</div>
                <div>MD 21216</div>
              </div>
            </div>

            {/* Center logos */}
            <div className="flex items-center gap-3 px-4">
              <img src="/Cobranding.png" alt="OOH + HOPEYA Logos" className="h-16 w-auto" />
            </div>

            {/* Address 3 */}
            <div className="flex items-start gap-1.5 text-xs text-gray-700">
              <span style={{ color: '#CC0000' }} className="mt-0.5">📍</span>
              <div>
                <div className="font-bold">1629 K. Street NW,</div>
                <div>Suite 300, Washington,</div>
                <div>DC 20006</div>
              </div>
            </div>

            {/* Address 4 */}
            <div className="flex items-start gap-1.5 text-xs text-gray-700">
              <span style={{ color: '#CC0000' }} className="mt-0.5">📍</span>
              <div>
                <div className="font-bold">909 St David Street,</div>
                <div>Tarboro,</div>
                <div>NC 27886</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Blue navbar */}
      <nav style={{ backgroundColor: '#003087' }} className="text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div>
              <div className="text-lg font-bold leading-tight">HOPE Training Academy Portal</div>
              <div className="text-xs" style={{ color: '#FFC72C' }}>
                Bridging Hope, Inc. dba Organization of Hope
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:underline">Trainings</Link>
            
            {user && user.roles && user.roles.includes("Participant") && (
              <Link to="/onboarding" className="hover:underline">OOH Pre-Onboarding</Link>
            )}
            
            {dash && (
              <Link to={dash.to} className="hover:underline">{dash.label}</Link>
            )}
            
            {user && (
              <Link to="/profile" className="hover:underline" style={{ color: '#FFC72C' }}>
                My Profile
              </Link>
            )}
            
            {user ? (
              <>
                <NotificationBell />
                <span style={{ color: '#FFC72C' }}>Hi, {user.full_name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded font-medium"
                  style={{ backgroundColor: '#CC0000', color: 'white' }}
                >
                  Logout
                </button>
                <HelpSupport />
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link
                  to="/register"
                  className="px-3 py-1 rounded font-medium"
                  style={{ backgroundColor: '#CC0000', color: 'white' }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer style={{ backgroundColor: '#003087' }} className="text-white text-sm py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/Cobranding.png"
                alt="OOH Logo"
                className="h-10 w-auto"
              />
              <div>
                <div className="font-bold text-sm">HOPE Training Academy Portal</div>
                <div className="text-xs" style={{ color: '#FFC72C' }}>
                  Bridging Hope, Inc. dba Organization of Hope
                </div>
              </div>
            </div>
            <div className="text-xs text-center" style={{ color: '#93C5FD' }}>
              <div>📞 1.855.966.4467 &nbsp;|&nbsp; ✉️ oohtraining@organizationofhope.org</div>
              <div className="mt-1">218 E Lexington St, Suite 600, Baltimore, MD 21202</div>
            </div>
            <div className="text-xs" style={{ color: '#93C5FD' }}>
              © {new Date().getFullYear()} Organization of Hope. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
