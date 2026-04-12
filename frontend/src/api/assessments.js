import api from './client';

// ============ ASSESSMENT CRUD ============
export const createAssessment = async (assessmentData) => {
  const response = await api.post('/assessments/', assessmentData);
  return response.data;
};

export const getAssessmentsByTraining = async (trainingId) => {
  const response = await api.get(`/assessments/training/${trainingId}`);
  return response.data;
};

export const getAssessment = async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}`);
  return response.data;
};

export const getAssessmentWithAttempts = async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}/with-attempts`);
  return response.data;
};

export const updateAssessment = async (assessmentId, updateData) => {
  const response = await api.put(`/assessments/${assessmentId}`, updateData);
  return response.data;
};

export const deleteAssessment = async (assessmentId) => {
  const response = await api.delete(`/assessments/${assessmentId}`);
  return response.data;
};

// ============ QUESTION CRUD ============
export const createQuestion = async (questionData) => {
  const response = await api.post('/assessments/questions/', questionData);
  return response.data;
};

export const getQuestion = async (questionId) => {
  const response = await api.get(`/assessments/questions/${questionId}`);
  return response.data;
};

export const updateQuestion = async (questionId, updateData) => {
  const response = await api.put(`/assessments/questions/${questionId}`, updateData);
  return response.data;
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/assessments/questions/${questionId}`);
  return response.data;
};

// ============ ASSESSMENT ATTEMPTS ============
export const startAssessmentAttempt = async (assessmentId, enrollmentId = null) => {
  const response = await api.post('/assessments/attempts/start', {
    assessment_id: assessmentId,
    enrollment_id: enrollmentId,
    attempt_number: 1 // Backend will calculate actual number
  });
  return response.data;
};

export const submitAssessmentAttempt = async (attemptId, responses, timeSpentSeconds = null) => {
  const response = await api.post(`/assessments/attempts/${attemptId}/submit`, {
    responses,
    time_spent_seconds: timeSpentSeconds
  });
  return response.data;
};

export const getAttemptResponses = async (attemptId) => {
  const response = await api.get(`/assessments/attempts/${attemptId}/responses`);
  return response.data;
};

// ============ ASSESSMENT RESULTS (Instructor) ============
export const getAssessmentResults = async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}/results`);
  return response.data;
};

export default {
  createAssessment,
  getAssessmentsByTraining,
  getAssessment,
  getAssessmentWithAttempts,
  updateAssessment,
  deleteAssessment,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getAttemptResponses,
  getAssessmentResults
};
