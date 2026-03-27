import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
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

export const approveTraining = (id) =>
  api.patch(`/trainings/${id}/approve`).then((r) => r.data)

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