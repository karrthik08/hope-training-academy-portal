import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

export default function InstructorCourseView() {
  const { trainingId } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('hope_access_token') || '';

  useEffect(() => {
    loadData();
  }, [trainingId]);

  const loadData = async () => {
    try {
      // Load training details
      const trainingRes = await fetch(`${API_BASE}/api/v1/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trainingData = await trainingRes.json();
      setTraining(trainingData);

      // Load enrollments for this training
      const enrollmentsRes = await fetch(`${API_BASE}/api/v1/instructor/trainings/${trainingId}/roster`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const enrollmentsData = await enrollmentsRes.json();
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!training) return <div className="text-center py-12">Training not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => navigate('/instructor')} className="text-blue-600 hover:underline mb-4">
        ← Back to Instructor Dashboard
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{training.title}</h1>
            <p className="text-gray-600 mb-2">{training.category}</p>
            <p className="text-sm text-gray-500">{training.description}</p>
          </div>
          <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold">
            👨‍🏫 Instructor View
          </span>
        </div>
      </div>

      {/* INSTRUCTOR-ONLY RESOURCES */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-200">
        <h2 className="text-2xl font-semibold mb-4 text-purple-900">
          🔒 Instructor Resources (Instructors & Admins Only)
        </h2>
        
        <div className="bg-white rounded-lg p-4 space-y-3">
          {training.instructor_manual_url && (
            <a 
              href={training.instructor_manual_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <span className="text-2xl">📚</span>
              <div>
                <div className="font-semibold text-purple-900">Instructor Manual</div>
                <div className="text-sm text-gray-600">Teaching guide and facilitation notes</div>
              </div>
            </a>
          )}

          {training.knowledge_mgmt_folder_url && (
            <a 
              href={training.knowledge_mgmt_folder_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <span className="text-2xl">📁</span>
              <div>
                <div className="font-semibold text-blue-900">Knowledge Management Folder</div>
                <div className="text-sm text-gray-600">Additional resources and reference materials</div>
              </div>
            </a>
          )}

          {!training.instructor_manual_url && !training.knowledge_mgmt_folder_url && (
            <p className="text-gray-500 italic text-center py-4">
              No instructor resources uploaded yet.
            </p>
          )}
        </div>
      </div>

      {/* STUDENT MATERIALS (What participants see) */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">📚 Student Materials</h2>
        
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

        {/* Dropbox Video/Document */}
        {training.dropbox_url && (
          <div className="mb-4">
            <h3 className="font-medium text-lg mb-2">Training Materials</h3>
            <a 
              href={training.dropbox_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              📄 View Training Materials →
            </a>
          </div>
        )}

        {/* Student Materials Links */}
        {(training.student_handbook_url || training.student_workbook_url || training.slides_url) && (
          <div className="mb-4">
            <h3 className="font-medium text-lg mb-3">Student Resources</h3>
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
            <h3 className="font-medium text-lg mb-2">Course Surveys</h3>
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

      {/* ENROLLMENT ROSTER */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">👥 Enrolled Participants ({enrollments.length})</h2>
        
        {enrollments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No participants enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{enrollment.participant_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{enrollment.participant_email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        enrollment.enrollment_status === 'completed' ? 'bg-green-100 text-green-800' :
                        enrollment.enrollment_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
