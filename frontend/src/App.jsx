import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import PublicTrainingsPage from './pages/PublicTrainingsPage'
import ParticipantDashboard from './pages/participant/Dashboard'
import InstructorDashboard from './pages/instructor/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import CertificatePage from './pages/participant/CertificatePage'
import VerifyCertificate from './pages/participant/VerifyCertificate'
import ProfilePage from './pages/participant/ProfilePage'
import ParticipantOnboarding from './pages/participant/OnboardingTracker'
import AdminOnboarding from './pages/admin/OnboardingTracker'

function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (allowedRoles && !user.roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public standalone pages — no nav/layout */}
        <Route path="/certificate/:enrollmentId" element={<CertificatePage />} />
        <Route path="/verify/:verificationCode" element={<VerifyCertificate />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Main app with nav */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PublicTrainingsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['Participant', 'Instructor', 'Admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="instructor"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
          <Route
            path="onboarding"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/onboarding"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminOnboarding />
              </ProtectedRoute>
            }
          />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}