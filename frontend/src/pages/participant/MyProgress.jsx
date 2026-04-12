import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MyProgress() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [enrollmentId]);

  const loadProgress = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/progress/enrollment/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hope_access_token')}` }
      });
      const data = await res.json();
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return <div className="p-8">Loading your progress...</div>;
  }

  if (!progress) {
    return <div className="p-8">Progress data not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Progress</h1>
          <p className="text-gray-600">Track your learning journey</p>
        </div>
        <button
          onClick={() => navigate('/participant')}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Overall Completion</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full"
                style={{ width: `${progress.overall_completion}%` }}
              ></div>
            </div>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {progress.overall_completion}%
          </span>
        </div>
      </div>

      {/* Modules Progress */}
      <div className="space-y-4">
        {progress.modules.map((module) => (
          <div key={module.module_id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-50 p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{module.module_title}</h3>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-200 rounded-full h-2 w-32">
                    <div
                      className={`h-2 rounded-full ${
                        module.completion_percentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${module.completion_percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{module.completion_percentage}%</span>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="p-4">
              {module.lessons.map((lesson) => (
                <div key={lesson.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      lesson.status === 'completed' ? 'bg-green-600' :
                      lesson.status === 'in_progress' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      {lesson.status === 'completed' && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className={lesson.status === 'completed' ? 'text-gray-900' : 'text-gray-600'}>
                      {lesson.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {lesson.time_spent > 0 && (
                      <span>⏱ {formatTime(lesson.time_spent)}</span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lesson.status === 'completed' ? 'bg-green-100 text-green-700' :
                      lesson.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {lesson.status === 'completed' ? 'Completed' :
                       lesson.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {progress.modules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No modules available yet.
        </div>
      )}
    </div>
  );
}
