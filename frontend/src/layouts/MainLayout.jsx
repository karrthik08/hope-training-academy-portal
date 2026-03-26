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
      <div style={{ backgroundColor: '#CC0000' }} className="text-white text-xs py-1 text-center">
        1.855.9.OOHHOPE (1.855.966.4467) &nbsp;|&nbsp; pw@organizationofhope.org &nbsp;|&nbsp;
        <a href="https://www.organizationofhope.org" target="_blank" rel="noopener noreferrer"
          className="underline hover:text-yellow-200 ml-1">
          www.OrganizationofHope.org
        </a>
      </div>
      
      <nav style={{ backgroundColor: '#003087' }} className="text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/Cobranding.png"
              alt="Organization of Hope + HOPEYA Logos"
              className="h-12 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <div>
              <div className="text-lg font-bold leading-tight">HOPE Training Academy Portal</div>
              <div className="text-xs" style={{ color: '#FFC72C' }}>
                Organization of Hope — Changing Minds and Bridging Lives
              </div>
            </div>
          </Link>
          
          {/* Nav links */}
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:underline">Trainings</Link>
            
            {/* Onboarding link for Participants */}
            {user && user.roles.includes('Participant') && (
              <Link to="/onboarding" className="hover:underline">Pre-Onboarding</Link>
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
                <span style={{ color: '#FFC72C' }}>Hi, {user.full_name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded font-medium"
                  style={{ backgroundColor: '#CC0000', color: 'white' }}
                >
                  Logout
                </button>
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
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer style={{ backgroundColor: '#003087' }} className="text-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/Cobranding.png"
              alt="OOH + HOPEYA"
              className="h-12 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <div className="text-sm">
              <div className="font-bold" style={{ color: '#FFC72C' }}>HOPE Training Academy Portal</div>
              <div className="text-xs">Bridging Hope, Inc. dba Organization of Hope</div>
            </div>
          </div>
          
          <div className="text-xs text-right">
            <div>☎ 1.855.966.4467 | ✉ pw@organizationofhope.org</div>
            <div>218 E Lexington St, Suite 600, Baltimore, MD 21202</div>
          </div>
        </div>
        
        <div className="text-center text-xs mt-4">
          © 2026 Organization of Hope. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
