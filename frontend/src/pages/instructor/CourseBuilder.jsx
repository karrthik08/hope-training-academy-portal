import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createModule, getModulesByTraining, updateModule, deleteModule,
  createLesson, getLessonsByModule, updateLesson, deleteLesson,
  createContentItem, uploadContentFile, getContentItemsByLesson, updateContentItem, deleteContentItem
} from '../../api/courseBuilder';
import { toggleSelfEnrollment } from '../../api/enrollments';


export default function CourseBuilder() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [lessons, setLessons] = useState({});
  const [contentItems, setContentItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [selfEnrollmentEnabled, setSelfEnrollmentEnabled] = useState(false);

  useEffect(() => {
    loadModules();
  }, [trainingId]);
  
  // Reload when component mounts (e.g., navigating back)
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await getModulesByTraining(trainingId);
      setModules(data);
      
      // Load self-enrollment status
      try {
        const trainingRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/trainings/${trainingId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
        });
        const training = await trainingRes.json();
        setSelfEnrollmentEnabled(training.self_enrollment_enabled || false);
      } catch (err) {
        console.error('Error loading training:', err);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelfEnrollment = async (enabled) => {
    try {
      await toggleSelfEnrollment(trainingId, enabled);
      setSelfEnrollmentEnabled(enabled);
    } catch (error) {
      console.error('Error toggling self-enrollment:', error);
    }
  };

  const handleMoveModule = async (moduleId, direction) => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;
    
    // Can't move up if first, can't move down if last
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === modules.length - 1) return;
    
    const newModules = [...modules];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap positions
    [newModules[currentIndex], newModules[newIndex]] = [newModules[newIndex], newModules[currentIndex]];
    
    setModules(newModules);
    
    // Save to backend
    try {
      const moduleIds = newModules.map(m => m.id);
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/modules/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hope_access_token')}`
        },
        body: JSON.stringify(moduleIds)
      });
    } catch (error) {
      console.error('Error reordering modules:', error);
    }
  };



  const loadLessons = async (moduleId) => {
    try {
      const data = await getLessonsByModule(moduleId);
      setLessons(prev => ({ ...prev, [moduleId]: data }));
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadContentItems = async (lessonId) => {
    try {
      const data = await getContentItemsByLesson(lessonId);
      setContentItems(prev => ({ ...prev, [lessonId]: data }));
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleAddModule = async () => {
    const title = prompt('Module Title:');
    if (!title) return;
    
    try {
      await createModule(trainingId, {
        title,
        description: '',
        order_index: modules.length,
        is_required: true
      });
      loadModules();
    } catch (error) {
      alert('Error creating module');
    }
  };

  const handleAddLesson = async (moduleId) => {
    const title = prompt('Lesson Title:');
    if (!title) return;
    
    try {
      await createLesson(moduleId, {
        title,
        description: '',
        order_index: (lessons[moduleId] || []).length,
        is_required: true
      });
      loadLessons(moduleId);
    } catch (error) {
      alert('Error creating lesson');
    }
  };

  const handleAddContent = async (lessonId, type) => {
    if (type === 'video') {
      const url = prompt('YouTube/Vimeo URL:');
      if (!url) return;
      try {
        await createContentItem(lessonId, {
          content_type: 'video',
          title: 'Video',
          content_url: url,
          order_index: (contentItems[lessonId] || []).length
        });
        loadContentItems(lessonId);
      } catch (error) {
        alert('Error adding video');
      }
    } else if (type === 'link') {
      const url = prompt('Link URL:');
      const title = prompt('Link Title:');
      if (!url || !title) return;
      try {
        await createContentItem(lessonId, {
          content_type: 'link',
          title,
          content_url: url,
          order_index: (contentItems[lessonId] || []).length
        });
        loadContentItems(lessonId);
      } catch (error) {
        alert('Error adding link');
      }
    } else if (type === 'text') {
      const title = prompt('Text Title:');
      const description = prompt('Text Content:');
      if (!title) return;
      try {
        await createContentItem(lessonId, {
          content_type: 'text',
          title,
          description,
          order_index: (contentItems[lessonId] || []).length
        });
        loadContentItems(lessonId);
      } catch (error) {
        alert('Error adding text');
      }
    }
  };

  const handleFileUpload = async (lessonId, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      await uploadContentFile(lessonId, file);
      loadContentItems(lessonId);
    } catch (error) {
      alert('Error uploading file');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await deleteModule(moduleId);
      loadModules();
    } catch (error) {
      alert('Error deleting module');
    }
  };

  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (!confirm('Delete this lesson and all its content?')) return;
    try {
      await deleteLesson(lessonId);
      loadLessons(moduleId);
    } catch (error) {
      alert('Error deleting lesson');
    }
  };

  const handleDeleteContent = async (contentId, lessonId) => {
    if (!confirm('Delete this content item?')) return;
    try {
      await deleteContentItem(contentId);
      loadContentItems(lessonId);
    } catch (error) {
      alert('Error deleting content');
    }
  };

  const toggleModule = (moduleId) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleId);
      if (!lessons[moduleId]) {
        loadLessons(moduleId);
      }
    }
  };

  const toggleLesson = (lessonId) => {
    if (expandedLesson === lessonId) {
      setExpandedLesson(null);
    } else {
      setExpandedLesson(lessonId);
      if (!contentItems[lessonId]) {
        loadContentItems(lessonId);
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow ml-8">
            <span className="text-sm font-medium text-gray-700">Self-Enrollment:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selfEnrollmentEnabled}
                onChange={(e) => handleToggleSelfEnrollment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm font-semibold">
              {selfEnrollmentEnabled ? <span className="text-green-600">Enabled</span> : <span className="text-gray-500">Disabled</span>}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/instructor/assessments/${trainingId}`)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            📝 Assessments
          </button>
          <button onClick={() => navigate('/instructor')} className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <button
        onClick={handleAddModule}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        + Add Module
      </button>

      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 p-4 flex justify-between items-center">
              <button
                onClick={() => toggleModule(module.id)}
                className="flex-1 text-left font-semibold text-lg"
              >
                {expandedModule === module.id ? '▼' : '▶'} {module.title}
              </button>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleMoveModule(module.id, 'up')}
                  className="text-blue-600 hover:text-blue-800 font-bold px-2"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveModule(module.id, 'down')}
                  className="text-blue-600 hover:text-blue-800 font-bold px-2"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDeleteModule(module.id)}
                  className="text-red-600 hover:text-red-800 ml-2"
                >
                  Delete
                </button>
              </div>
            </div>

            {expandedModule === module.id && (
              <div className="p-4 bg-white">
                <button
                  onClick={() => handleAddLesson(module.id)}
                  className="mb-4 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                >
                  + Add Lesson
                </button>

                <div className="space-y-3">
                  {(lessons[module.id] || []).map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg overflow-hidden ml-6">
                      <div className="bg-gray-50 p-3 flex justify-between items-center">
                        <button
                          onClick={() => toggleLesson(lesson.id)}
                          className="flex-1 text-left font-medium"
                        >
                          {expandedLesson === lesson.id ? '▼' : '▶'} {lesson.title}
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id, module.id)}
                          className="text-red-600 hover:text-red-800 text-sm ml-4"
                        >
                          Delete
                        </button>
                      </div>

                      {expandedLesson === lesson.id && (
                        <div className="p-3 bg-white">
                          <div className="flex gap-2 mb-3 flex-wrap">
                            <button
                              onClick={() => handleAddContent(lesson.id, 'video')}
                              className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                            >
                              + Video
                            </button>
                            <label className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 cursor-pointer">
                              + Upload File
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(lesson.id, e)}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                              />
                            </label>
                            <button
                              onClick={() => handleAddContent(lesson.id, 'link')}
                              className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700"
                            >
                              + Link
                            </button>
                            <button
                              onClick={() => handleAddContent(lesson.id, 'text')}
                              className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                            >
                              + Text
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(contentItems[lesson.id] || []).map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{item.content_type}</span>
                                  <span>{item.title}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteContent(item.id, lesson.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No modules yet. Click "Add Module" to get started!
        </div>
      )}
    </div>
  );
}