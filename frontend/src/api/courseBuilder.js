import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('hope_access_token'); // FIX: was 'token'
  return { Authorization: `Bearer ${token}` };
};

// MODULES
export const createModule = async (trainingId, moduleData) => {
  const response = await axios.post(`${API_URL}/modules/`, {
    training_id: trainingId,
    ...moduleData
  }, { headers: getAuthHeader() });
  return response.data;
};

export const getModulesByTraining = async (trainingId) => {
  const response = await axios.get(`${API_URL}/modules/training/${trainingId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateModule = async (moduleId, moduleData) => {
  const response = await axios.put(`${API_URL}/modules/${moduleId}`, moduleData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteModule = async (moduleId) => {
  const response = await axios.delete(`${API_URL}/modules/${moduleId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// LESSONS
export const createLesson = async (moduleId, lessonData) => {
  const response = await axios.post(`${API_URL}/lessons/`, {
    module_id: moduleId,
    ...lessonData
  }, { headers: getAuthHeader() });
  return response.data;
};

export const getLessonsByModule = async (moduleId) => {
  const response = await axios.get(`${API_URL}/lessons/module/${moduleId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateLesson = async (lessonId, lessonData) => {
  const response = await axios.put(`${API_URL}/lessons/${lessonId}`, lessonData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  const response = await axios.delete(`${API_URL}/lessons/${lessonId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// CONTENT ITEMS
export const createContentItem = async (lessonId, contentData) => {
  const response = await axios.post(`${API_URL}/content-items/`, {
    lesson_id: lessonId,
    ...contentData
  }, { headers: getAuthHeader() });
  return response.data;
};

export const uploadContentFile = async (lessonId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lesson_id', lessonId);
  
  const response = await axios.post(`${API_URL}/content-items/upload`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getContentItemsByLesson = async (lessonId) => {
  const response = await axios.get(`${API_URL}/content-items/lesson/${lessonId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateContentItem = async (contentId, contentData) => {
  const response = await axios.put(`${API_URL}/content-items/${contentId}`, contentData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteContentItem = async (contentId) => {
  const response = await axios.delete(`${API_URL}/content-items/${contentId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// PARTICIPANT VIEW - Get full course structure
export const getCourseStructure = async (trainingId) => {
  const modules = await getModulesByTraining(trainingId);
  
  // For each module, get lessons
  for (let module of modules) {
    module.lessons = await getLessonsByModule(module.id);
    
    // For each lesson, get content items
    for (let lesson of module.lessons) {
      lesson.content_items = await getContentItemsByLesson(lesson.id);
    }
  }
  
  return modules;
};

export const reorderModules = (moduleOrders) => 
  api.put('/modules/reorder', moduleOrders).then(r => r.data);

export const reorderLessons = (lessonOrders) => 
  api.put('/lessons/reorder', lessonOrders).then(r => r.data);

export const reorderContentItems = (contentOrders) => 
  api.put('/content-items/reorder', contentOrders).then(r => r.data);
