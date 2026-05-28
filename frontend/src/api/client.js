import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hope-backend-sad2.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

console.log('🔧 API CLIENT INITIALIZED WITH baseURL:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  console.log('🔧 MAKING REQUEST TO:', config.url, 'FULL URL:', config.baseURL + config.url);
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

const getAuthHeader = () => {
  const token = localStorage.getItem('hope_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default api

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (userData) => api.post('/auth/register', userData)

// Trainings
export const getAllTrainings = () => api.get('/trainings/all').then(r => r.data)
export const getTrainingById = (id) => api.get(`/trainings/${id}`).then(r => r.data)
export const createTraining = (data) => api.post('/trainings', data).then(r => r.data)
export const updateTraining = (id, data) => api.put(`/trainings/${id}`, data).then(r => r.data)
export const deleteTraining = (id) => api.delete(`/trainings/${id}`).then(r => r.data)
export const submitForReview = (id) => api.post(`/trainings/${id}/submit`).then(r => r.data)

// Enrollments
export const enrollInTraining = (trainingId) => api.post(`/enrollments/${trainingId}`).then(r => r.data)
export const getMyEnrollments = () => api.get('/enrollments/my').then(r => r.data)
export const unenrollFromTraining = (trainingId) => api.delete(`/enrollments/${trainingId}`).then(r => r.data)

// Instructor
export const getInstructorTrainings = () => api.get('/instructor/trainings').then(r => r.data)
export const getTrainingRoster = (trainingId) => api.get(`/instructor/trainings/${trainingId}/roster`).then(r => r.data)

// Admin
export const getPendingTrainings = () => api.get('/admin/trainings/pending').then(r => r.data)
export const approveTraining = (id) => api.post(`/admin/trainings/${id}/approve`).then(r => r.data)
export const rejectTraining = (id, reason) => api.post(`/admin/trainings/${id}/reject`, { reason }).then(r => r.data)
export const publishTraining = (id) => api.post(`/admin/trainings/${id}/publish`).then(r => r.data)
export const getAllUsers = () => api.get('/admin/users').then(r => r.data)
export const updateUserRole = (userId, roleId) => api.put(`/admin/users/${userId}/role`, { role_id: roleId }).then(r => r.data)
export const getCompletionReport = (trainingId) => api.get(`/reports/completion/${trainingId}`).then(r => r.data)
export const getAuditLogs = () => api.get('/admin/audit-logs').then(r => r.data)

// Certificates
export const getCertificate = (enrollmentId) => api.get(`/enrollments/${enrollmentId}/certificate`).then(r => r.data)
export const verifyCertificate = (certId) => api.get(`/certificates/verify/${certId}`).then(r => r.data)

// Onboarding
export const getOnboardingStatus = () => api.get('/onboarding/status').then(r => r.data)
export const completeOnboardingStep = (step) => api.post(`/onboarding/complete/${step}`).then(r => r.data)

// Course Content
export const getCourseContent = (trainingId) => api.get(`/course-content/training/${trainingId}`).then(r => r.data)
export const createCourseContent = (data) => api.post('/course-content', data).then(r => r.data)
export const updateCourseContent = (id, data) => api.put(`/course-content/${id}`, data).then(r => r.data)
export const deleteCourseContent = (id) => api.delete(`/course-content/${id}`).then(r => r.data)

// Content Progress
export const getContentProgress = (enrollmentId) => api.get(`/content-progress/enrollment/${enrollmentId}`).then(r => r.data)
export const markContentComplete = (enrollmentId, contentId) => api.post('/content-progress/complete', { enrollment_id: enrollmentId, content_id: contentId }).then(r => r.data)
export const markContentIncomplete = (enrollmentId, contentId) => api.post('/content-progress/incomplete', { enrollment_id: enrollmentId, content_id: contentId }).then(r => r.data)

// Course Completion
export const checkAndCompleteCourse = (enrollmentId) => api.post(`/course-completion/check-and-complete/${enrollmentId}`).then(r => r.data)

// Attendance & Completion
export const markAttendance = (enrollmentId, attendanceStatus) => 
  api.post(`/enrollments/${enrollmentId}/attendance`, { attendance_status: attendanceStatus }).then(r => r.data)

export const markCompletion = (enrollmentId) => 
  api.post(`/enrollments/${enrollmentId}/complete`).then(r => r.data)

export const getCompletionByEnrollment = (enrollmentId) => 
  api.get(`/enrollments/${enrollmentId}/completion`).then(r => r.data)

// Get enrollment by ID
export const getEnrollmentById = async (enrollmentId) => {
  const response = await api.get(`/enrollments/${enrollmentId}/details`);
  return response.data;
};

// Payment - Stripe Integration
export const createCheckoutSession = async (trainingId) => {
  const response = await api.post('/create-checkout', { training_id: trainingId })
  return response.data
}

export const verifyPayment = async (sessionId) => {
  const response = await api.get(`/verify-payment/${sessionId}`);
  return response.data;
};

export const enrollAfterPayment = async (trainingId) => {
  const response = await api.post('/enroll-after-payment', { training_id: trainingId });
  return response.data;
};

// Missing exports that other components need
export const enroll = enrollInTraining
export const cancelEnrollment = unenrollFromTraining
export const getRoster = getTrainingRoster

export const submitTraining = submitForReview
export const myEnrollments = getMyEnrollments

// Public trainings (no auth required)
export const getPublicTrainings = () => api.get('/trainings/public').then(r => r.data)