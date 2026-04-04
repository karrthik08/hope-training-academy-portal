import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hope_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hope_access_token')
      localStorage.removeItem('hope_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const register = (full_name, email, password) =>
  api.post('/auth/register', { full_name, email, password }).then((r) => r.data)

export const getPublicTrainings = () =>
  api.get('/trainings/public').then((r) => r.data)

export const getAllTrainings = () =>
  api.get('/trainings/').then((r) => r.data)

export const createTraining = (data) =>
  api.post('/trainings/', data).then((r) => r.data)

export const updateTraining = (id, data) =>
  api.put(`/trainings/${id}`, data).then((r) => r.data)

export const submitTraining = (id) =>
  api.post(`/trainings/${id}/submit`).then((r) => r.data)

export const approveTraining = (id) =>
  api.patch(`/trainings/${id}/approve`).then((r) => r.data)

export const rejectTraining = (id) =>
  api.post(`/trainings/${id}/reject`).then((r) => r.data)

export const publishTraining = (id) =>
  api.patch(`/trainings/${id}/publish`).then((r) => r.data)

export const unpublishTraining = (id) =>
  api.patch(`/trainings/${id}/unpublish`).then((r) => r.data)

export const enroll = (trainingId) =>
  api.post(`/enrollments/${trainingId}`).then((r) => r.data)

export const cancelEnrollment = (trainingId) =>
  api.delete(`/enrollments/${trainingId}`).then((r) => r.data)

export const myEnrollments = () =>
  api.get('/enrollments/my').then((r) => r.data)

export const getRoster = (trainingId) =>
  api.get(`/instructor/trainings/${trainingId}/roster`).then((r) => r.data)

export const markAttendance = (enrollmentId, attendanceStatus) =>
  api.post('/instructor/attendance', {
    enrollment_id: enrollmentId,
    attendance_status: attendanceStatus,
  }).then((r) => r.data)

export const markCompletion = (enrollmentId) =>
  api.post(`/instructor/completions/${enrollmentId}`).then((r) => r.data)

export const getRosterReport = (trainingId) =>
  api.get(`/admin/reports/roster/${trainingId}`).then((r) => r.data)

export const getCompletionReport = (trainingId) =>
  api.get(`/admin/reports/completions/${trainingId}`).then((r) => r.data)

export const getAuditLogs = () =>
  api.get('/admin/audit-logs').then((r) => r.data)

export const getCompletionByEnrollment = (enrollmentId) =>
  api.get(`/instructor/completions-by-enrollment/${enrollmentId}`).then(r => r.data)

// Onboarding API functions
export const getOnboardingTrainings = () =>
  api.get('/onboarding/trainings').then((r) => r.data)

export const getMyOnboardingProgress = () =>
  api.get('/onboarding/my-progress').then((r) => r.data)

export const updateOnboardingItem = (trainingId, proofLink, initials) =>
  api.post('/onboarding/update-item', { training_id: trainingId, proof_link: proofLink, initials }).then((r) => r.data)

export const submitOnboarding = () =>
  api.post('/onboarding/submit').then((r) => r.data)

export const getAllOnboardingProgress = () =>
  api.get('/onboarding/admin/all-progress').then((r) => r.data)

export const approveOnboarding = (userId) =>
  api.post(`/onboarding/admin/approve/${userId}`).then((r) => r.data)

// Course Content API
export const getCourseContent = (trainingId) =>
  api.get(`/course-content/training/${trainingId}`).then((r) => r.data)

export const createCourseContent = (data) =>
  api.post('/course-content/', data).then((r) => r.data)

export const updateCourseContent = (id, data) =>
  api.put(`/course-content/${id}`, data).then((r) => r.data)

export const deleteCourseContent = (id) =>
  api.delete(`/course-content/${id}`).then((r) => r.data)

// Content Progress API
export const getContentProgress = (enrollmentId) =>
  api.get(`/content-progress/enrollment/${enrollmentId}`).then((r) => r.data)

export const markContentComplete = (enrollmentId, contentId) =>
  api.post('/content-progress/mark-complete', null, {
    params: { enrollment_id: enrollmentId, content_id: contentId }
  }).then((r) => r.data)

export const markContentIncomplete = (enrollmentId, contentId) =>
  api.post('/content-progress/mark-incomplete', null, {
    params: { enrollment_id: enrollmentId, content_id: contentId }
  }).then((r) => r.data)

// Course Completion API
export const checkAndCompleteCourse = (enrollmentId) =>
  api.post(`/course-completion/check-and-complete/${enrollmentId}`).then((r) => r.data)

// Admin Enrollment Stats
export const getEnrollmentStats = () =>
  api.get('/admin/stats/enrollments').then((r) => r.data)

// Admin Enrollment Stats
