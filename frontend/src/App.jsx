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
import ManageContent from './pages/instructor/ManageContent'
import CourseBuilder from './pages/instructor/CourseBuilder'
import AttendanceTracker from './pages/instructor/AttendanceTracker'
import ProgressTracker from './pages/instructor/ProgressTracker'
import Reports from './pages/instructor/Reports'
import InstructorCourseView from './pages/instructor/InstructorCourseView'
import AdminDashboard from './pages/admin/Dashboard'
import CourseReview from './pages/admin/CourseReview'
import MetricsDashboard from './pages/admin/MetricsDashboard'
import CertificatePage from './pages/participant/CertificatePage'
import VerifyCertificate from './pages/participant/VerifyCertificate'
import ProfilePage from './pages/participant/ProfilePage'
import OnboardingTracker from './pages/participant/OnboardingTracker'
import CourseView from './pages/participant/CourseView'
import MyProgress from './pages/participant/MyProgress'
import AssessmentBuilder from './pages/instructor/AssessmentBuilder';
import TakeAssessment from './pages/participant/TakeAssessment';
import AssessmentResults from './pages/instructor/AssessmentResults';
import BulkEnrollment from './pages/instructor/BulkEnrollment';

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
        {/* Standalone pages — no nav/layout */}
        <Route path="/certificate/:enrollmentId" element={<CertificatePage />} />
        <Route path="/verify/:verificationCode" element={<VerifyCertificate />} />

        {/* All pages with full header/footer layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<PublicTrainingsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Instructor Assessment Routes */}
          <Route
            path="/instructor/assessments/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <AssessmentBuilder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/assessment-results/:assessmentId"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <AssessmentResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/bulk-enroll/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <BulkEnrollment />
              </ProtectedRoute>
            }
          />

          {/* Participant Assessment Route */}
          <Route
            path="/participant/assessment/:assessmentId/:enrollmentId"
            element={
              <ProtectedRoute allowedRoles={['Participant', 'Instructor', 'Admin']}>
                <TakeAssessment />
              </ProtectedRoute>
            }
          />

          <Route
            path="onboarding"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <OnboardingTracker />
              </ProtectedRoute>
            }
          />

          <Route
            path="course/:enrollmentId"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <CourseView />
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
            path="instructor/manage-content/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <ManageContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="instructor/course-builder/:trainingId"
            element={
              <ProtectedRoute allowedRoles={["Instructor", "Admin"]}>
                <CourseBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="instructor/attendance/:trainingId"
            element={
              <ProtectedRoute allowedRoles={["Instructor", "Admin"]}>
                <AttendanceTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="instructor/progress/:trainingId"
            element={
              <ProtectedRoute allowedRoles={["Instructor", "Admin"]}>
                <ProgressTracker />
              </ProtectedRoute>
            }
          />
          <Route

          path="instructor/view-course/:trainingId"
            element={
              <ProtectedRoute allowedRoles={['Instructor', 'Admin']}>
                <InstructorCourseView />
              </ProtectedRoute>
            }
          />

          <Route
            path="instructor/reports/:trainingId"
            element={
              <ProtectedRoute allowedRoles={["Instructor", "Admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/metrics"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <MetricsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/course-review"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <CourseReview />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}