import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnrollmentById } from '../../api/client';
import { getCourseStructure } from '../../api/courseBuilder';
import { getContentProgress, markContentComplete, markContentIncomplete } from '../../api/client';
import CommentsSection from '../../Components/CommentsSection';
import { getAssessmentsByTraining } from '../../api/assessments';

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = null;
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("watch?v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    videoId = url.split("embed/")[1].split("?")[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

const getDropboxEmbedUrl = (url) => {
  if (!url) return null;
  if (url.includes('dropbox.com')) {
    return url.replace('dl=0', 'raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
  return url;
};


export default function CourseView() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate()
  const trackLessonProgress = async (lessonId, status = 'in_progress') => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hope_access_token')}`
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          status: status
        })
      });
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  };

  const markLessonComplete = async (lessonId) => {
    await trackLessonProgress(lessonId, 'completed');
  };
;
  const [enrollment, setEnrollment] = useState(null)
  const [training, setTraining] = useState(null)
  const [overallProgress, setOverallProgress] = useState(0);
  const [modules, setModules] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});

  useEffect(() => {
    loadData();
  }, [enrollmentId]);

  const loadData = async () => {
    try {
      const enrollmentData = await getEnrollmentById(enrollmentId);
    // Load progress
    const progressRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/progress/enrollment/${enrollmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
    });
    const enrollmentProgressData = await progressRes.json();
    setOverallProgress(enrollmentProgressData.overall_completion || 0);

      setEnrollment(enrollmentData);

      // Load training details to get video URLs
      const trainingRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/trainings/${enrollmentData.training_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const trainingData = await trainingRes.json();
      setTraining(trainingData);

      const moduleData = await getCourseStructure(enrollmentData.training_id);
      setModules(moduleData);

      const progressData = await getContentProgress(enrollmentId);
      setProgress(progressData);

      // Load assessments
      try {
        const assessmentsData = await getAssessmentsByTraining(enrollmentData.training_id);
        setAssessments(assessmentsData);
      } catch (error) {
        console.error('Error loading assessments:', error);
        setAssessments([]);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (contentId) => {
    const isCompleted = progress.find(p => p.content_item_id === contentId)?.completed;
    
    try {
      if (isCompleted) {
        await markContentIncomplete(enrollmentId, contentId);
      } else {
        await markContentComplete(enrollmentId, contentId);
      }
      
      const progressData = await getContentProgress(enrollmentId);
      setProgress(progressData);
      
      const enrollmentData = await getEnrollmentById(enrollmentId);
      // Load progress
      const progressRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/progress/enrollment/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const enrollmentProgressData = await progressRes.json();
      setOverallProgress(enrollmentProgressData.overall_completion || 0);

      setEnrollment(enrollmentData);
      
      
      // Only instructor can mark as complete
      
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const isContentCompleted = (contentId) => {
    return progress.find(p => p.content_item_id === contentId)?.completed || false;
  };

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;

    modules.forEach(module => {
      module.lessons?.forEach(lesson => {
        lesson.content_items?.forEach(item => {
          total++;
          if (isContentCompleted(item.id)) completed++;
        });
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  const renderContent = (item) => {
    const completed = isContentCompleted(item.id);
    
    return (
      <div key={item.id} className={`p-3 rounded border ${completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={completed}
            onChange={() => handleToggleComplete(item.id)}
            className="mt-1 w-5 h-5 cursor-pointer"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase">{item.content_type}</span>
              <h4 className="font-medium">{item.title}</h4>
              {completed && <span className="text-green-600 text-sm font-semibold">✓ Completed</span>}
            </div>
            
            {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
            
            {item.content_type === 'video' && item.content_url && (
              <div className="mt-2">
                {item.content_url.includes('youtube.com') || item.content_url.includes('youtu.be') ? (
                  <iframe
                    width="100%"
                    height="315"
                    src={getYouTubeEmbedUrl(item.content_url)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded"
                  ></iframe>
                ) : (
                  <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Watch Video →
                  </a>
                )}
              </div>
            )}
            
            {item.content_type === 'link' && item.content_url && (
              <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Open Link →
              </a>
            )}
            
            {item.content_type === 'pdf' && item.file_path && (
              <a href={`/uploads/${item.file_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                View PDF →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-12">Loading course...</div>;
  if (!enrollment) return <div className="text-center py-12">Enrollment not found</div>;

  const progressPercent = overallProgress > 0 ? overallProgress : calculateProgress();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline mb-4">
  ← Back to Dashboard
</button>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{enrollment.training_title}</h1>
        <p className="text-gray-600 mb-4">{enrollment.training_category}</p>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {progressPercent === 100 && enrollment.enrollment_status === 'completed' && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded mb-4">
            🎉 Congratulations! You've completed this course!
          </div>
        )}
        
        {progressPercent === 100 && enrollment.enrollment_status !== 'completed' && (
          <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4">
            ✅ Great work! You've completed all course content. Your instructor will review and mark you as complete.
          </div>
        )}
      </div>

      {/* TRAINING & MATERIALS SECTION */}
      {training && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">📹 Training Materials</h2>
          
          {/* YouTube Video */}
          {training.video_url && (
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Training Video</h3>
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={getYouTubeEmbedUrl(training.video_url)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          )}

          {/* Dropbox Video */}
          {training.dropbox_url && (
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Training Video/Document</h3>
              {training.dropbox_url.endsWith('.mp4') || training.dropbox_url.endsWith('.mov') ? (
                <video
                  controls
                  className="w-full rounded-lg"
                  src={getDropboxEmbedUrl(training.dropbox_url)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <a 
                  href={training.dropbox_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  📄 View Training Materials →
                </a>
              )}
            </div>
          )}

          {/* Student Materials */}
          {(training.student_handbook_url || training.student_workbook_url || training.slides_url) && (
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-3">📚 Student Materials</h3>
              <div className="flex flex-col gap-2">
                {training.student_handbook_url && (
                  <a 
                    href={training.student_handbook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    📖 Student Handbook →
                  </a>
                )}
                {training.student_workbook_url && (
                  <a 
                    href={training.student_workbook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    📓 Student Workbook →
                  </a>
                )}
                {training.slides_url && (
                  <a 
                    href={training.slides_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    📊 Presentation Slides →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* QRC Surveys */}
          {training.qrc_surveys_url && (
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">📋 Course Surveys</h3>
              <p className="text-sm text-gray-600 mb-2">
                Complete the pre/post surveys to help us improve this training:
              </p>
              <a 
                href={training.qrc_surveys_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                📊 Access Surveys →
              </a>
            </div>
          )}

          {/* Flyer */}
          {training.flyer_url && (
            <div>
              <a 
                href={training.flyer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                📋 View Training Flyer →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ASSESSMENTS SECTION */}
      {assessments && assessments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📝 Assessments</h2>
          <div className="space-y-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{assessment.title}</h3>
                    {assessment.description && (
                      <p className="text-sm text-gray-600 mb-2">{assessment.description}</p>
                    )}
                    <div className="flex gap-3 text-sm text-gray-600">
                      <span className="bg-blue-100 px-2 py-1 rounded">
                        {assessment.assessment_type.replace('_', ' ')}
                      </span>
                      <span>{assessment.questions?.length || 0} questions</span>
                      <span>Passing: {assessment.passing_score}%</span>
                      {assessment.time_limit_minutes && (
                        <span>⏱️ {assessment.time_limit_minutes} min</span>
                      )}
                      {assessment.is_required && (
                        <span className="text-red-600 font-medium">Required</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/participant/assessment/${assessment.id}/${enrollmentId}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ml-4"
                  >
                    Take Assessment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMENTS SECTION - NEW FEATURE */}
      {training && <CommentsSection trainingId={training.id} />}

      <div className="space-y-4">
        {modules.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No course content available yet. The instructor is still building this course.
          </div>
        )}

        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full bg-blue-50 p-4 text-left font-semibold text-lg hover:bg-blue-100 transition flex justify-between items-center"
            >
              <span>{expandedModules[module.id] ? '▼' : '▶'} {module.title}</span>
              {module.is_required && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>}
            </button>

            {expandedModules[module.id] && (
              <div className="p-4 space-y-3">
                {module.description && <p className="text-gray-600 mb-4">{module.description}</p>}
                
                {module.lessons?.map((lesson) => (
                  <div key={lesson.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleLesson(lesson.id)}
                      className="w-full bg-gray-50 p-3 text-left font-medium hover:bg-gray-100 transition flex justify-between items-center"
                    >
                      <span>{expandedLessons[lesson.id] ? '▼' : '▶'} {lesson.title}</span>
                      {lesson.is_required && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Required</span>}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markLessonComplete(lesson.id);
                          alert('Lesson marked as complete!');
                          window.location.reload();
                        }}
                        className="ml-auto bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                      >
                        ✓ Mark Complete
                      </button>
                    </button>

                    {expandedLessons[lesson.id] && (
                      <div className="p-3 space-y-3 bg-gray-50">
                        {lesson.description && <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>}
                        
                        {lesson.content_items?.length === 0 && (
                          <p className="text-sm text-gray-400 italic">No content in this lesson yet.</p>
                        )}
                        
                        {lesson.content_items?.map(renderContent)}
                      </div>
                    )}
                  </div>
                ))}

                {(!module.lessons || module.lessons.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No lessons in this module yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}