import api from './client';

export const bulkEnroll = (trainingId, userEmails) =>
  api.post('/enrollments/bulk-enroll', 
    { user_emails: userEmails, training_id: trainingId }
  ).then(r => r.data);

export const toggleSelfEnrollment = (trainingId, enabled) =>
  api.put(`/enrollments/trainings/${trainingId}/self-enrollment`, null, {
    params: { enabled }
  }).then(r => r.data);

export const getAvailableUsers = (trainingId) =>
  api.get(`/enrollments/available-users/${trainingId}`).then(r => r.data);

export const selfEnroll = (trainingId) =>
  api.post(`/enrollments/self-enroll/${trainingId}`).then(r => r.data);
